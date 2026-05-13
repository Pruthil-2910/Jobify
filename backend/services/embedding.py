"""Embedding service wrapping Google Gemini gemini-embedding-2.
    
Uses the modern ``google-genai`` SDK (the legacy ``google.generativeai``
package is deprecated as of 2025).

Stable public API:
    - embed_text(text, gemini_key, task_type="RETRIEVAL_DOCUMENT") -> list[float]
    - embed_query(text, gemini_key) -> list[float]
    - embed_document(text, gemini_key) -> list[float]
    - InvalidAPIKeyError
    - RateLimitError
"""

from __future__ import annotations

import asyncio
from typing import Any

from google import genai
from google.genai import types as genai_types
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

EMBEDDING_DIM: int = 768
# gemini-embedding-2 is the latest multimodal model available in AI Studio.
EMBEDDING_MODEL: str = "gemini-embedding-2"


class InvalidAPIKeyError(Exception):
    """Raised when the Gemini API key is invalid or unauthorized."""


class RateLimitError(Exception):
    """Raised when the Gemini API rate limit / quota is exhausted."""


def _classify_exception(exc: BaseException) -> Exception:
    """Classify an SDK exception into InvalidAPIKeyError / RateLimitError or pass through."""
    status_code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
    message = str(exc) if exc is not None else ""
    lowered = message.lower()

    if status_code in (401, 403) or "api key" in lowered or "unauthorized" in lowered or "permission denied" in lowered:
        return InvalidAPIKeyError(message or "Invalid API key")

    if status_code == 429 or "rate limit" in lowered or "quota" in lowered or "resource_exhausted" in lowered:
        return RateLimitError(message or "Rate limit exceeded")

    return exc


def _call_embed(text: str, gemini_key: str, task_type: str) -> Any:
    """Synchronous SDK call. New per-call client = no shared global state."""
    client = genai.Client(api_key=gemini_key)
    return client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=genai_types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=EMBEDDING_DIM
        ),
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=1, max=10),
    reraise=True,
    retry=retry_if_exception_type(Exception),
)
async def _embed_with_retry(text: str, gemini_key: str, task_type: str) -> list[float]:
    try:
        result = await asyncio.to_thread(_call_embed, text, gemini_key, task_type)
    except Exception as exc:
        classified = _classify_exception(exc)
        raise classified from exc

    # New SDK shape: EmbedContentResponse(embeddings=[ContentEmbedding(values=[...])]).
    # Old SDK shape: {"embedding": [...]}. Support both for forward/backward compat.
    embedding: Any = None
    embeddings_attr = getattr(result, "embeddings", None)
    if embeddings_attr:
        first = embeddings_attr[0]
        embedding = getattr(first, "values", None) or (first.get("values") if isinstance(first, dict) else None)
    if embedding is None:
        if isinstance(result, dict):
            embedding = result.get("embedding")
        else:
            embedding = getattr(result, "embedding", None)
            if embedding is None:
                try:
                    embedding = result["embedding"]  # type: ignore[index]
                except Exception:
                    embedding = None

    if embedding is None:
        raise ValueError("Embedding response missing 'embedding'/'embeddings' field")

    if isinstance(embedding, dict) and "values" in embedding:
        embedding = embedding["values"]
    if not isinstance(embedding, (list, tuple)):
        raise ValueError(f"Embedding has unexpected type: {type(embedding).__name__}")

    embedding_list = [float(x) for x in embedding]

    if len(embedding_list) != EMBEDDING_DIM:
        raise ValueError(
            f"Embedding dimension mismatch: expected {EMBEDDING_DIM}, got {len(embedding_list)}"
        )

    return embedding_list


async def embed_text(
    text: str,
    gemini_key: str,
    task_type: str = "RETRIEVAL_DOCUMENT",
) -> list[float]:
    """Embed a single piece of text via Gemini gemini-embedding-2.

    Args:
        text: Non-empty input text.
        gemini_key: Per-call Gemini API key.
        task_type: One of RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, etc.

    Returns:
        A 768-dim list of floats.

    Raises:
        ValueError: empty input or wrong-dim output.
        InvalidAPIKeyError: 401/403/auth errors.
        RateLimitError: 429/quota errors.
    """
    if text is None or not isinstance(text, str) or text.strip() == "":
        raise ValueError("text must be a non-empty string")
    if not gemini_key or not isinstance(gemini_key, str):
        raise ValueError("gemini_key must be a non-empty string")

    return await _embed_with_retry(text, gemini_key, task_type)


async def embed_query(text: str, gemini_key: str) -> list[float]:
    """Embed a query string (task_type=RETRIEVAL_QUERY)."""
    return await embed_text(text, gemini_key, task_type="RETRIEVAL_QUERY")


async def embed_document(text: str, gemini_key: str) -> list[float]:
    """Embed a document string (task_type=RETRIEVAL_DOCUMENT)."""
    return await embed_text(text, gemini_key, task_type="RETRIEVAL_DOCUMENT")
