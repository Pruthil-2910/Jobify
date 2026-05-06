"""Projects router: ingest, list, and delete user projects."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth.dependencies import get_current_user, get_db_dep
from db.crud import (
    create_project,
    delete_project,
    list_user_projects,
    upsert_vec_embedding,
)
from models.resume import ProjectIngestRequest, ProjectIngestResponse
from services.embedding import (
    InvalidAPIKeyError,
    RateLimitError,
    embed_document,
)
from services.github import LinkedInBlockedError, ingest_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/ingest", response_model=ProjectIngestResponse)
async def ingest_projects(
    payload: ProjectIngestRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_dep),
) -> ProjectIngestResponse:
    """Ingest project URLs: fetch text, persist project, embed, store vector."""
    gemini_key = getattr(request.state, "gemini_key", None)
    if not gemini_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_gemini_key",
        )

    user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id

    ingested: list[int] = []
    failed: list[dict[str, str]] = []

    for url in payload.urls:
        url_str = str(url)
        try:
            text = await ingest_url(url_str)
        except LinkedInBlockedError as exc:
            logger.warning("LinkedIn blocked for url=%s: %s", url_str, exc)
            failed.append({"url": url_str, "reason": "linkedin_blocked"})
            continue
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to ingest url=%s", url_str)
            failed.append({"url": url_str, "reason": f"ingest_failed: {exc}"})
            continue

        try:
            project_id = create_project(
                conn, user_id, source_url=url_str, project_text=text
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to persist project for url=%s", url_str)
            failed.append({"url": url_str, "reason": f"db_error: {exc}"})
            continue

        try:
            embedding = await embed_document(text, gemini_key)
        except InvalidAPIKeyError as exc:
            logger.error("Invalid Gemini API key while embedding: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_gemini_key",
            ) from exc
        except RateLimitError as exc:
            logger.error("Gemini rate limit hit while embedding: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="gemini_rate_limit",
            ) from exc
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to embed project text for url=%s", url_str)
            failed.append({"url": url_str, "reason": f"embed_failed: {exc}"})
            continue

        try:
            upsert_vec_embedding(conn, "vec_projects", project_id, embedding)
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "Failed to upsert vector embedding for project_id=%s", project_id
            )
            failed.append({"url": url_str, "reason": f"vec_upsert_failed: {exc}"})
            continue

        ingested.append(project_id)
        logger.info("Ingested project_id=%s for user_id=%s", project_id, user_id)

    return ProjectIngestResponse(ingested=len(ingested), failed=failed)


@router.get("", response_model=list[dict])
async def list_projects(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_dep),
) -> list[dict[str, Any]]:
    """List all projects belonging to the current user."""
    user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
    return list_user_projects(conn, user_id)


@router.delete("/{project_id}")
async def remove_project(
    project_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_dep),
) -> dict:
    """Delete a project owned by the current user. 404 if not owned/found."""
    user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
    deleted = delete_project(conn, project_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="project_not_found",
        )
    logger.info("Deleted project_id=%s for user_id=%s", project_id, user_id)
    return {"deleted": True, "project_id": project_id}
