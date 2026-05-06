"""Jobs routes: search, retrieve, and external fetch with embedding."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from auth.dependencies import get_current_user, get_db_dep
from db.crud import (
    get_job_by_id,
    match_jobs_for_user,
    search_jobs,
    upsert_job,
    upsert_vec_embedding,
)
from models.job import JobFetchRequest, JobFetchResponse, JobResponse
from services.adzuna import AdzunaError, fetch_jobs
from services.embedding import (
    InvalidAPIKeyError,
    RateLimitError,
    embed_document,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_text(title: str, company: Optional[str], description: Optional[str]) -> str:
    """Compose embedding text from title + company + description."""
    parts = [p for p in (title, company, description) if p]
    return "\n".join(parts).strip()


@router.get("/search", response_model=list[JobResponse])
async def search(
    q: Optional[str] = Query(default=None, description="Free-text on title/description."),
    location: Optional[str] = Query(default=None, description="Substring match on location."),
    country: Optional[str] = Query(default=None, description="ISO country code (e.g. 'in')."),
    category: Optional[str] = Query(default=None, description="Adzuna category label."),
    contract_type: Optional[str] = Query(default=None, description="'permanent' or 'contract'."),
    contract_time: Optional[str] = Query(default=None, description="'full_time' or 'part_time'."),
    salary_min: Optional[float] = Query(default=None, description="Minimum salary cap."),
    salary_max: Optional[float] = Query(default=None, description="Maximum salary cap."),
    posted_since: Optional[str] = Query(default=None, description="ISO date — only jobs posted on/after."),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> list[JobResponse]:
    """Search persisted jobs with rich filters (location, country, category, salary, date, contract)."""
    rows = search_jobs(
        conn, q=q, location=location, limit=limit, offset=offset,
        country=country, category=category,
        contract_type=contract_type, contract_time=contract_time,
        salary_min=salary_min, salary_max=salary_max, posted_since=posted_since,
    )
    logger.info(
        "jobs.search user_id=%s q=%s loc=%s country=%s cat=%s count=%d",
        current_user.get("id"), q, location, country, category, len(rows),
    )
    return [JobResponse.model_validate(r) for r in rows]


@router.get("/match-feed")
async def match_feed(
    limit: int = Query(20, ge=1, le=100),
    country: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    posted_since: Optional[str] = Query(None, description="ISO date, e.g. '2026-03-06'."),
    category: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> dict:
    """Personalised job feed ranked by cosine similarity to the user's resume.

    Each row carries a ``match_pct`` (0..100) computed from the cosine
    distance between the user's resume embedding and the job's embedding.
    If the user has no resume embedding yet (no Gemini key was set when
    /users/resume was called), ``match_pct`` will be absent and the rows
    fall back to recency-ordered ``search_jobs``.
    """
    user_id = current_user["id"]
    rows = match_jobs_for_user(
        conn, user_id, limit=limit,
        country=country, location=location,
        posted_since=posted_since, category=category,
    )
    if not rows:
        # Fallback: no embedding for this user yet — return plain search.
        rows = search_jobs(
            conn, q=None, location=location, limit=limit, offset=0,
            country=country, posted_since=posted_since, category=category,
        )
        return {"personalised": False, "results": rows}
    return {"personalised": True, "results": rows}


@router.get("/{job_id}", response_model=JobResponse)
async def get_one(
    job_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> JobResponse:
    """Fetch a single persisted job by primary key."""
    row = get_job_by_id(conn, job_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="job_not_found")
    logger.info(
        "jobs.get_one user_id=%s job_id=%s",
        current_user.get("id"), job_id,
    )
    return JobResponse.model_validate(row)


@router.post("/fetch", response_model=JobFetchResponse)
async def fetch(
    payload: JobFetchRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> JobFetchResponse:
    """Fetch jobs from Adzuna, persist them, and embed for vector search.

    Requires a Gemini key on ``request.state.gemini_key`` (used to embed each
    job). Returns counts of fetched/embedded jobs along with per-job errors.
    """
    gemini_key = getattr(request.state, "gemini_key", None)
    if not gemini_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_gemini_key",
        )

    try:
        results = await fetch_jobs(
            query=payload.query,
            location=payload.location,
            results_per_page=payload.results_per_page,
        )
    except AdzunaError as exc:
        logger.warning("jobs.fetch adzuna_error user_id=%s err=%s", current_user.get("id"), exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"adzuna_error: {exc}",
        ) from exc

    fetched = 0
    embedded = 0
    errors: list[str] = []

    for item in results:
        external_id = item.get("external_id")
        title = item.get("title")
        if not external_id or not title:
            errors.append(f"missing_required_fields: external_id={external_id}")
            continue

        try:
            job_id = upsert_job(
                conn,
                external_id=str(external_id),
                title=str(title),
                company=item.get("company"),
                location=item.get("location"),
                salary_min=item.get("salary_min"),
                salary_max=item.get("salary_max"),
                description=item.get("description"),
                raw_json=item.get("raw_json"),
                category=item.get("category"),
                contract_type=item.get("contract_type"),
                contract_time=item.get("contract_time"),
                posted_at=item.get("posted_at"),
                redirect_url=item.get("redirect_url"),
                country=getattr(payload, "country", None) or "gb",
            )
            fetched += 1
        except Exception as exc:
            errors.append(f"upsert_failed external_id={external_id}: {exc}")
            logger.warning("jobs.fetch upsert failed external_id=%s err=%s", external_id, exc)
            continue

        text = _job_text(str(title), item.get("company"), item.get("description"))
        if not text:
            errors.append(f"empty_text external_id={external_id}")
            continue

        try:
            embedding = await embed_document(text, gemini_key)
            upsert_vec_embedding(conn, "vec_jobs", job_id, embedding)
            embedded += 1
        except InvalidAPIKeyError as exc:
            logger.warning("jobs.fetch invalid gemini key user_id=%s", current_user.get("id"))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_gemini_key",
            ) from exc
        except RateLimitError as exc:
            logger.warning("jobs.fetch rate limit user_id=%s", current_user.get("id"))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"rate_limit: {exc}",
            ) from exc
        except Exception as exc:
            errors.append(f"embed_failed external_id={external_id}: {exc}")
            logger.warning(
                "jobs.fetch embed failed external_id=%s err=%s", external_id, exc
            )

    logger.info(
        "jobs.fetch user_id=%s fetched=%d embedded=%d errors=%d",
        current_user.get("id"), fetched, embedded, len(errors),
    )
    return JobFetchResponse(fetched=fetched, embedded=embedded, errors=errors)


@router.get("/stats/summary")
async def stats_summary(
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> dict:
    """Return totals for monitoring (per-country, vector coverage)."""
    rows = conn.execute(
        "SELECT COALESCE(country,'?') AS country, COUNT(*) AS n FROM jobs GROUP BY country"
    ).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
    embedded = conn.execute("SELECT COUNT(*) FROM vec_jobs").fetchone()[0]
    by_country = {}
    for r in rows:
        try:
            by_country[r["country"]] = r["n"]
        except (TypeError, KeyError):
            by_country[r[0]] = r[1]
    return {"total_jobs": total, "embedded_jobs": embedded, "by_country": by_country}


@router.post("/seed")
async def seed_country(
    request: Request,
    country: str = Query("in", description="ISO-2 country, e.g. 'in', 'us', 'gb'."),
    target: int = Query(5000, ge=1, le=20000),
    embed: bool = Query(False, description="Also embed each job into vec_jobs."),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> dict:
    """Bulk-pull up to ``target`` Adzuna jobs into the DB. Idempotent.

    With ``embed=true`` the user's Gemini key is used to embed every job for
    semantic search. Embedding ~5000 jobs is slow and costs tokens — leave it
    false unless you need vector search end-to-end.
    """
    from services.job_ingest import ingest_country
    gemini_key = getattr(request.state, "gemini_key", None)
    if embed and not gemini_key:
        raise HTTPException(401, detail="invalid_gemini_key")
    try:
        result = await ingest_country(
            country=country, target_count=target, embed=embed, gemini_key=gemini_key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("jobs.seed failed user_id=%s", current_user.get("id"))
        raise HTTPException(502, detail=f"seed_failed: {exc}") from exc
    logger.info("jobs.seed user_id=%s result=%s", current_user.get("id"), result)
    return result


@router.post("/refresh-now")
async def refresh_now(
    country: str = Query("in"),
    days: int = Query(1, ge=1, le=30, description="Pull jobs posted in last N days."),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> dict:
    """Manually trigger the daily refresh for testing the scheduler."""
    from services.job_ingest import daily_refresh
    try:
        result = await daily_refresh(country=country, days=days)
    except Exception as exc:  # noqa: BLE001
        logger.exception("jobs.refresh_now failed user_id=%s", current_user.get("id"))
        raise HTTPException(502, detail=f"refresh_failed: {exc}") from exc
    return result
