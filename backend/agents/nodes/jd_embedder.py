"""JD embedder node for the JD matcher graph.

Embeds the user-supplied job description text into a 768-dim vector via
``services.embedding.embed_query`` and stores it on the state under the
``jd_embedding`` key.
"""

from __future__ import annotations

import logging

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from agents.state import JDMatchState
from services.embedding import (
    InvalidAPIKeyError,
    RateLimitError,
    embed_query,
)

logger = logging.getLogger(__name__)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=1, max=10),
    reraise=True,
    # Only retry on transient errors. Auth errors should fail fast.
    retry=retry_if_exception_type((RateLimitError, ValueError, ConnectionError)),
)
async def _embed_with_retry(jd_text: str, gemini_key: str) -> list[float]:
    """Call the embedding service with tenacity-driven retries."""
    return await embed_query(jd_text, gemini_key)


async def embed_jd(state: JDMatchState) -> JDMatchState:
    """Embed the JD text on ``state`` and write the vector back to state.

    Args:
        state: Current ``JDMatchState`` containing ``jd_text`` and ``gemini_key``.

    Returns:
        The updated ``JDMatchState`` with ``jd_embedding`` populated.

    Raises:
        ValueError: If ``jd_text`` is missing or empty.
        InvalidAPIKeyError: If the Gemini API key is invalid.
        RateLimitError: If the Gemini API rate limit is exhausted.
    """
    jd_text = state.get("jd_text")
    gemini_key = state.get("gemini_key")

    if not jd_text or not isinstance(jd_text, str) or jd_text.strip() == "":
        raise ValueError("state['jd_text'] must be a non-empty string")
    if not gemini_key or not isinstance(gemini_key, str):
        raise ValueError("state['gemini_key'] must be a non-empty string")

    user_id = state.get("user_id")
    logger.info(
        "Embedding JD for user_id=%s (jd_text length=%d)", user_id, len(jd_text)
    )

    try:
        embedding = await _embed_with_retry(jd_text, gemini_key)
    except InvalidAPIKeyError:
        logger.error("Invalid Gemini API key while embedding JD for user_id=%s", user_id)
        raise
    except RateLimitError:
        logger.error("Rate limit while embedding JD for user_id=%s", user_id)
        raise

    state["jd_embedding"] = embedding
    logger.debug(
        "JD embedding generated for user_id=%s (dim=%d)", user_id, len(embedding)
    )
    return state
