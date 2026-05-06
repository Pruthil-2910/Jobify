"""Project matcher node for the JD matcher graph.

Performs a sqlite-vec cosine nearest-neighbour search over the user's
projects using the embedded JD vector and writes the top results to
``state['top_projects']``.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from agents.state import JDMatchState
from db import connection as db_connection
from db import crud as db_crud

logger = logging.getLogger(__name__)

# Default number of top-matching projects to return.
_DEFAULT_LIMIT: int = 3


async def match_projects(state: JDMatchState) -> JDMatchState:
    """Find the top-N user projects most similar to the JD embedding.

    Args:
        state: Current ``JDMatchState`` containing ``user_id`` and a
            previously-computed ``jd_embedding``.

    Returns:
        The updated ``JDMatchState`` with ``top_projects`` populated. If the
        user has no projects, ``top_projects`` is set to an empty list.

    Raises:
        ValueError: If ``user_id`` or ``jd_embedding`` is missing/invalid.
    """
    user_id = state.get("user_id")
    jd_embedding = state.get("jd_embedding")

    if user_id is None:
        raise ValueError("state['user_id'] is required")
    if not jd_embedding or not isinstance(jd_embedding, list):
        raise ValueError("state['jd_embedding'] must be a non-empty list of floats")

    logger.info(
        "Matching top %d projects for user_id=%s (embedding dim=%d)",
        _DEFAULT_LIMIT,
        user_id,
        len(jd_embedding),
    )

    conn = None
    try:
        conn = db_connection.get_connection()
        results: List[Dict[str, Any]] = db_crud.vec_search_projects(
            conn,
            int(user_id),
            jd_embedding,
            limit=_DEFAULT_LIMIT,
        )
    except Exception:
        logger.exception(
            "Vector search over projects failed for user_id=%s", user_id
        )
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover - defensive close
                logger.warning("Failed to close DB connection cleanly", exc_info=True)

    state["top_projects"] = results or []
    logger.debug(
        "Found %d matching projects for user_id=%s",
        len(state["top_projects"]),
        user_id,
    )
    return state
