"""User account routes: profile retrieval and resume management."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from auth.dependencies import get_current_user, get_db_dep
from db.crud import update_user_resume, upsert_vec_embedding
from models.resume import Resume
from models.user import UserResponse
from services.embedding import embed_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


def _resume_to_text(resume: Resume) -> str:
    """Build a single text blob from resume summary, skills, and experience for embedding."""
    parts: list[str] = []
    if resume.summary:
        parts.append(resume.summary.strip())

    if resume.skills:
        skill_names = [s.name for s in resume.skills if s and s.name]
        if skill_names:
            parts.append("Skills: " + ", ".join(skill_names))

    for exp in resume.experience or []:
        seg: list[str] = []
        if exp.title:
            seg.append(exp.title)
        if exp.company:
            seg.append(f"at {exp.company}")
        if exp.start_date or exp.end_date:
            seg.append(f"({exp.start_date or ''} - {exp.end_date or ''})")
        if exp.highlights:
            seg.append(". ".join(h for h in exp.highlights if h))
        line = " ".join(s for s in seg if s).strip()
        if line:
            parts.append(line)

    return "\n".join(parts).strip()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's public profile with resume/api-key flags."""
    has_resume = bool(current_user.get("resume_json"))
    has_api_key = bool(current_user.get("api_key_encrypted"))
    logger.info(
        "users.get_me user_id=%s has_resume=%s has_api_key=%s",
        current_user.get("id"), has_resume, has_api_key,
    )
    return UserResponse(
        id=int(current_user["id"]),
        email=current_user["email"],
        has_resume=has_resume,
        has_api_key=has_api_key,
        created_at=current_user["created_at"],
    )


@router.get("/resume")
async def get_resume(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Optional[dict]:
    """Return the user's stored resume JSON, or null if none saved yet."""
    raw = current_user.get("resume_json")
    if not raw:
        return None
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return None
    return raw


@router.put("/resume", response_model=Resume)
async def put_resume(
    resume: Resume,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> Resume:
    """Persist the user's resume and best-effort embed it for vector search.

    If a Gemini key is present on ``request.state.gemini_key`` the resume's
    summary/skills/experience text is embedded and upserted into ``vec_users``.
    Embedding failures are logged but do not fail the request.
    """
    user_id = int(current_user["id"])
    update_user_resume(conn, user_id, resume.model_dump(mode="json"))
    logger.info("users.put_resume stored user_id=%s", user_id)

    gemini_key = getattr(request.state, "gemini_key", None)
    if gemini_key:
        try:
            text = _resume_to_text(resume)
            if text:
                embedding = await embed_document(text, gemini_key)
                upsert_vec_embedding(conn, "vec_users", user_id, embedding)
                logger.info("users.put_resume embedded user_id=%s", user_id)
            else:
                logger.info(
                    "users.put_resume skipping embedding: empty text user_id=%s",
                    user_id,
                )
        except Exception as exc:  # pragma: no cover - best-effort
            logger.warning(
                "users.put_resume embedding failed user_id=%s err=%s",
                user_id, exc,
            )
    else:
        logger.info(
            "users.put_resume no gemini_key, skipping embedding user_id=%s",
            user_id,
        )

    return resume
