"""JD Match router - job description matching and resume tailoring."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth.dependencies import get_current_user, get_db_dep
from agents.jd_matcher_graph import jd_matcher_graph, jd_match_only_graph
from agents.state import JDMatchState
from agents.nodes.resume_tailor import LLMOutputMalformedError
from db.crud import list_tailored_resumes, get_user_by_id
from models.resume import (
    JDMatchRequest,
    JDMatchResponse,
    TailoredResumeResponse,
)
from services.embedding import InvalidAPIKeyError, RateLimitError

router = APIRouter(prefix="/jd", tags=["jd"])


def _gemini_key_or_401(request: Request) -> str:
    key = getattr(request.state, "gemini_key", None)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_gemini_key", "message": "Missing or invalid Gemini API key"},
        )
    return key


def _user_id(current_user) -> str:
    return getattr(current_user, "id", None) or (
        current_user.get("id") if isinstance(current_user, dict) else None
    )


def _map_exception(exc: Exception) -> HTTPException:
    if isinstance(exc, InvalidAPIKeyError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_gemini_key", "message": "Invalid Gemini API key"},
        )
    if isinstance(exc, RateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limit", "message": "Rate limit exceeded"},
        )
    if isinstance(exc, LLMOutputMalformedError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "llm_output_malformed", "message": "LLM produced malformed output"},
        )
    msg = str(exc).lower()
    if "vector" in msg and ("unavailable" in msg or "search" in msg):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "vector_search_unavailable", "message": "Vector search is unavailable"},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "internal_error", "message": "An internal error occurred"},
    )


def _build_state(body: JDMatchRequest, user, gemini_key: str) -> JDMatchState:
    resume_json = ""
    if user is not None:
        resume_json = (
            getattr(user, "resume_json", None)
            or (user.get("resume_json") if isinstance(user, dict) else None)
            or ""
        )
    return {
        "user_id": _user_id(user) if user else None,
        "jd_text": body.jd_text,
        "resume_json": resume_json,
        "gemini_key": gemini_key,
    }


@router.post("/match", response_model=JDMatchResponse)
async def jd_match(
    body: JDMatchRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db_dep),
):
    """Match JD against user's resume - returns top projects and gap analysis."""
    gemini_key = _gemini_key_or_401(request)
    uid = _user_id(current_user)
    user = get_user_by_id(db, uid) if uid else current_user

    state = _build_state(body, user, gemini_key)

    try:
        final = await jd_match_only_graph.ainvoke(state)
    except HTTPException:
        raise
    except Exception as exc:
        raise _map_exception(exc)

    return JDMatchResponse(
        top_projects=final.get("top_projects", []),
        gap_analysis=final.get("gap_analysis", {}),
    )


@router.post("/tailor", response_model=TailoredResumeResponse)
async def jd_tailor(
    body: JDMatchRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db_dep),
):
    """Run full pipeline: match + tailor resume to JD, persist result."""
    gemini_key = _gemini_key_or_401(request)
    uid = _user_id(current_user)
    user = get_user_by_id(db, uid) if uid else current_user

    state = _build_state(body, user, gemini_key)

    try:
        final = await jd_matcher_graph.ainvoke(state)
    except HTTPException:
        raise
    except Exception as exc:
        raise _map_exception(exc)

    raw = final.get("tailored_resume_json") or final.get("resume_json") or {}
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "llm_output_malformed", "message": "Tailored resume is not valid JSON"},
            )
    else:
        parsed = raw

    saved_id = final.get("saved_id") or final.get("tailored_resume_id")

    return TailoredResumeResponse(
        id=saved_id,
        jd_text=body.jd_text,
        resume_json=parsed,
        created_at=datetime.now(timezone.utc),
    )


@router.get("/history", response_model=list[TailoredResumeResponse])
async def jd_history(
    current_user=Depends(get_current_user),
    db=Depends(get_db_dep),
):
    """List all tailored resumes for the current user."""
    uid = _user_id(current_user)
    try:
        records = list_tailored_resumes(db, uid)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "internal_error", "message": "An internal error occurred"},
        )

    result: list[TailoredResumeResponse] = []
    for r in records:
        rj = (
            getattr(r, "resume_json", None)
            if not isinstance(r, dict)
            else r.get("resume_json")
        )
        if isinstance(rj, str):
            try:
                rj = json.loads(rj)
            except (ValueError, TypeError):
                rj = {}
        result.append(
            TailoredResumeResponse(
                id=getattr(r, "id", None) if not isinstance(r, dict) else r.get("id"),
                jd_text=(
                    getattr(r, "jd_text", "")
                    if not isinstance(r, dict)
                    else r.get("jd_text", "")
                ),
                resume_json=rj or {},
                created_at=(
                    getattr(r, "created_at", None)
                    if not isinstance(r, dict)
                    else r.get("created_at")
                )
                or datetime.now(timezone.utc),
            )
        )
    return result
