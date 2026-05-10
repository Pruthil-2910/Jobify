"""AI helpers for the resume builder UI."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from auth.dependencies import get_current_user
from services.ai_rewrite import (
    extract_github_project,
    rewrite_text,
)
from services.embedding import InvalidAPIKeyError, RateLimitError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class RewriteRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    kind: str = Field(default="generic", description="summary | bullet | project_description | generic")
    context: Optional[str] = Field(default=None, max_length=2000)


class RewriteResponse(BaseModel):
    rewritten: str


class GitHubExtractRequest(BaseModel):
    url: str = Field(..., min_length=10)


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite(
    payload: RewriteRequest,
    request: Request,
    current_user=Depends(get_current_user),
) -> RewriteResponse:
    """Generic LLM rewrite for resume sections (summary / bullet / description)."""
    gemini_key = getattr(request.state, "gemini_key", None)
    if not gemini_key:
        raise HTTPException(401, detail="invalid_gemini_key")
    try:
        out = await rewrite_text(
            text=payload.text, gemini_key=gemini_key, kind=payload.kind, context=payload.context,
        )
    except InvalidAPIKeyError as exc:
        raise HTTPException(401, detail="invalid_gemini_key") from exc
    except RateLimitError as exc:
        raise HTTPException(429, detail="rate_limit") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("ai.rewrite failed kind=%s", payload.kind)
        raise HTTPException(500, detail=f"rewrite_failed: {exc}") from exc
    logger.info(
        "ai.rewrite user_id=%s kind=%s in_len=%d out_len=%d",
        current_user["id"], payload.kind, len(payload.text), len(out),
    )
    return RewriteResponse(rewritten=out)


@router.post("/extract-github")
async def extract_github(
    payload: GitHubExtractRequest,
    request: Request,
    current_user=Depends(get_current_user),
) -> dict:
    """Pull a GitHub repo's README, distill into a resume project entry.

    Returns: {name, description, url, start_date, end_date, technologies[], highlights[]}.
    Date range comes from repo created_at / pushed_at.
    """
    gemini_key = getattr(request.state, "gemini_key", None)
    if not gemini_key:
        raise HTTPException(401, detail="invalid_gemini_key")
    try:
        return await extract_github_project(url=payload.url, gemini_key=gemini_key)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except InvalidAPIKeyError as exc:
        raise HTTPException(401, detail="invalid_gemini_key") from exc
    except RateLimitError as exc:
        raise HTTPException(429, detail="rate_limit") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("ai.extract_github failed")
        raise HTTPException(502, detail=f"extract_failed: {exc}") from exc
