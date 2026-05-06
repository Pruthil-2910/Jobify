"""Bulk Adzuna ingestion + daily refresh scheduler.

Provides:
  * ``ingest_country`` — fetch up to N jobs across multiple pages and persist
    them. Optionally embed each job into ``vec_jobs`` if a Gemini key is given.
  * ``daily_refresh`` — fetch only jobs posted in the last day and upsert them
    (keyed on ``external_id`` so re-running is idempotent).
  * ``start_scheduler`` — spawn an asyncio loop that calls ``daily_refresh``
    every day at the configured local time (default 02:00).

The scheduler is dependency-free (no APScheduler) — it just sleeps until the
next firing window. Survives restarts because Adzuna IDs are stable: the
INSERT OR REPLACE in ``upsert_job`` deduplicates.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, time, timedelta, timezone
from typing import Iterable, Optional

from db.connection import get_connection
from db.crud import upsert_job, upsert_vec_embedding, count_jobs
from services.adzuna import AdzunaError, ConfigError, fetch_jobs

logger = logging.getLogger(__name__)


# Diverse query mix — Adzuna requires *some* "what" filter or category for
# meaningful results. Each query feeds one full pagination sweep.
DEFAULT_QUERIES: tuple[str, ...] = (
    "software engineer",
    "data scientist",
    "machine learning",
    "frontend developer",
    "backend developer",
    "full stack",
    "devops",
    "product manager",
    "ui ux designer",
    "data analyst",
    "python developer",
    "java developer",
    "react developer",
    "node js",
    "ai engineer",
)


async def ingest_country(
    *,
    country: str = "in",
    target_count: int = 5000,
    queries: Iterable[str] = DEFAULT_QUERIES,
    results_per_page: int = 50,
    max_days_old: Optional[int] = None,
    gemini_key: Optional[str] = None,
    embed: bool = False,
) -> dict:
    """Pull up to ``target_count`` jobs from Adzuna and store them.

    Sweeps each query across pages until the target is hit or queries are
    exhausted. Idempotent — re-running deduplicates on Adzuna ``external_id``.

    If ``embed=True`` and ``gemini_key`` is given, each new job's
    ``title + company + description`` is embedded with text-embedding-004 and
    upserted into ``vec_jobs``. Embedding errors do not abort the run.
    """
    if embed and not gemini_key:
        raise ValueError("embed=True requires gemini_key")

    fetched = 0
    inserted = 0
    embedded = 0
    errors: list[str] = []

    conn = get_connection()
    try:
        for query in queries:
            if fetched >= target_count:
                break
            page = 1
            while fetched < target_count:
                try:
                    batch = await fetch_jobs(
                        query=query,
                        country=country,
                        results_per_page=results_per_page,
                        page=page,
                        max_days_old=max_days_old,
                        sort_by="date",
                    )
                except (AdzunaError, ConfigError) as exc:
                    errors.append(f"{query} p{page}: {exc}")
                    logger.warning("ingest stop on %s p%s: %s", query, page, exc)
                    break

                if not batch:
                    break

                for job in batch:
                    fetched += 1
                    if not job.get("external_id") or not job.get("title"):
                        continue
                    try:
                        job_id = upsert_job(
                            conn,
                            external_id=str(job["external_id"]),
                            title=str(job["title"]),
                            company=job.get("company"),
                            location=job.get("location"),
                            salary_min=job.get("salary_min"),
                            salary_max=job.get("salary_max"),
                            description=job.get("description"),
                            raw_json=job.get("raw_json"),
                            category=job.get("category"),
                            contract_type=job.get("contract_type"),
                            contract_time=job.get("contract_time"),
                            posted_at=job.get("posted_at"),
                            redirect_url=job.get("redirect_url"),
                            country=country.lower(),
                        )
                        inserted += 1

                        if embed and gemini_key:
                            try:
                                from services.embedding import embed_document
                                text = " ".join(filter(None, [
                                    job.get("title") or "",
                                    job.get("company") or "",
                                    (job.get("description") or "")[:3000],
                                ]))
                                vec = await embed_document(text, gemini_key)
                                upsert_vec_embedding(conn, "vec_jobs", job_id, vec)
                                embedded += 1
                            except Exception as exc:  # noqa: BLE001
                                errors.append(f"embed {job_id}: {exc}")
                    except Exception as exc:  # noqa: BLE001
                        errors.append(f"persist {job.get('external_id')}: {exc}")

                if fetched >= target_count:
                    break
                if len(batch) < results_per_page:
                    break  # last page for this query
                page += 1

        total_after = count_jobs(conn, country=country)
        logger.info(
            "ingest_country done country=%s fetched=%d inserted=%d embedded=%d total=%d errors=%d",
            country, fetched, inserted, embedded, total_after, len(errors),
        )
        return {
            "country": country,
            "fetched": fetched,
            "inserted": inserted,
            "embedded": embedded,
            "total_in_db": total_after,
            "errors": errors[:20],
        }
    finally:
        conn.close()


async def daily_refresh(
    *,
    country: str = "in",
    queries: Iterable[str] = DEFAULT_QUERIES,
    days: int = 1,
    pages_per_query: int = 2,
    results_per_page: int = 50,
) -> dict:
    """Pull only jobs posted in the last ``days`` days. No embeddings.

    Designed to run on a daily schedule: lightweight, fast, idempotent.
    """
    fetched = 0
    inserted = 0
    errors: list[str] = []

    conn = get_connection()
    try:
        for query in queries:
            for page in range(1, pages_per_query + 1):
                try:
                    batch = await fetch_jobs(
                        query=query,
                        country=country,
                        page=page,
                        results_per_page=results_per_page,
                        max_days_old=days,
                        sort_by="date",
                    )
                except (AdzunaError, ConfigError) as exc:
                    errors.append(f"{query} p{page}: {exc}")
                    break
                if not batch:
                    break
                for job in batch:
                    fetched += 1
                    if not job.get("external_id") or not job.get("title"):
                        continue
                    try:
                        upsert_job(
                            conn,
                            external_id=str(job["external_id"]),
                            title=str(job["title"]),
                            company=job.get("company"),
                            location=job.get("location"),
                            salary_min=job.get("salary_min"),
                            salary_max=job.get("salary_max"),
                            description=job.get("description"),
                            raw_json=job.get("raw_json"),
                            category=job.get("category"),
                            contract_type=job.get("contract_type"),
                            contract_time=job.get("contract_time"),
                            posted_at=job.get("posted_at"),
                            redirect_url=job.get("redirect_url"),
                            country=country.lower(),
                        )
                        inserted += 1
                    except Exception as exc:  # noqa: BLE001
                        errors.append(str(exc))
                if len(batch) < results_per_page:
                    break

        logger.info(
            "daily_refresh done country=%s fetched=%d inserted=%d errors=%d",
            country, fetched, inserted, len(errors),
        )
        return {"country": country, "fetched": fetched, "inserted": inserted, "errors": errors[:10]}
    finally:
        conn.close()


def _seconds_until(target_hour: int, target_minute: int) -> float:
    """Seconds from now until the next local-time HH:MM."""
    now = datetime.now()
    target = datetime.combine(now.date(), time(target_hour, target_minute))
    if target <= now:
        target += timedelta(days=1)
    return max((target - now).total_seconds(), 1.0)


async def _scheduler_loop(country: str, hour: int, minute: int) -> None:
    """Initial seed (last 60 days, if empty) + daily refresh at HH:MM local."""
    try:
        from config import settings
        seed_target = settings.JOB_SEED_TARGET
        seed_days = settings.JOB_SEED_MAX_DAYS_OLD
        refresh_days = settings.JOB_REFRESH_DAYS
    except Exception:  # noqa: BLE001
        seed_target, seed_days, refresh_days = 5000, 60, 1

    logger.info(
        "scheduler started country=%s fires=%02d:%02d seed_target=%d seed_days=%d refresh_days=%d",
        country, hour, minute, seed_target, seed_days, refresh_days,
    )

    # Optional kickoff: seed if DB looks empty for this country.
    try:
        conn = get_connection()
        try:
            total = count_jobs(conn, country=country)
        finally:
            conn.close()
        if total == 0:
            logger.info(
                "scheduler: jobs[%s] empty — initial seed target=%d days=%d",
                country, seed_target, seed_days,
            )
            try:
                await ingest_country(
                    country=country,
                    target_count=seed_target,
                    max_days_old=seed_days,
                    embed=False,
                )
            except Exception:  # noqa: BLE001
                logger.exception("initial seed failed (will retry tomorrow)")
        else:
            logger.info("scheduler: jobs[%s] already has %d rows — skipping seed", country, total)
    except Exception:  # noqa: BLE001
        logger.exception("scheduler kickoff check failed")

    while True:
        sleep_s = _seconds_until(hour, minute)
        logger.info("scheduler: sleeping %.0fs until next %02d:%02d firing", sleep_s, hour, minute)
        try:
            await asyncio.sleep(sleep_s)
        except asyncio.CancelledError:
            logger.info("scheduler cancelled")
            raise
        try:
            await daily_refresh(country=country, days=refresh_days)
        except Exception:  # noqa: BLE001
            logger.exception("daily_refresh failed (will retry tomorrow)")


def start_scheduler(
    country: str = "in",
    hour: int = 2,
    minute: int = 0,
) -> asyncio.Task:
    """Start the daily refresh scheduler as an asyncio task.

    Returns the Task — cancel it on shutdown to stop the loop.
    """
    return asyncio.create_task(_scheduler_loop(country, hour, minute))
