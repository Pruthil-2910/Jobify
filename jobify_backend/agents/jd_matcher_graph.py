"""LangGraph definition for the JD-matcher pipeline.

Two graphs are exported:

* :data:`jd_matcher_graph` -- full pipeline:
    ``load_resume -> embed_jd -> match_projects -> analyze_gaps
    -> tailor_resume -> save_tailored``.

* :data:`jd_match_only_graph` -- subgraph that stops after gap analysis:
    ``load_resume -> embed_jd -> match_projects -> analyze_gaps``.

The factory :func:`build_jd_matcher_graph` returns a freshly compiled full
pipeline graph, useful for tests or re-compiling with custom checkpointers.
"""

from __future__ import annotations

import logging
from typing import Any

from langgraph.graph import END, START, StateGraph

from agents.nodes.gap_analyzer import analyze_gaps
from agents.nodes.jd_embedder import embed_jd
from agents.nodes.project_matcher import match_projects
from agents.nodes.resume_tailor import tailor_resume
from agents.state import JDMatchState
from db import connection as db_connection
from db import crud as db_crud

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Local nodes (load_resume, save_tailored)
# ---------------------------------------------------------------------------

async def load_resume(state: JDMatchState) -> JDMatchState:
    """Load the user's current resume JSON from the ``users`` table.

    Reads ``state['user_id']`` and writes the user's stored
    ``resume_json`` into ``state['current_resume_json']``. If the user has
    no resume yet, an empty JSON object string ``"{}"`` is stored.

    Raises:
        ValueError: If ``user_id`` is missing or the user does not exist.
    """
    user_id = state.get("user_id")
    if user_id is None:
        raise ValueError("state['user_id'] is required")

    logger.info("Loading current resume for user_id=%s", user_id)

    conn = None
    try:
        conn = db_connection.get_connection()
        user = db_crud.get_user_by_id(conn, int(user_id))
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover - defensive close
                logger.warning("Failed to close DB connection cleanly", exc_info=True)

    if user is None:
        raise ValueError(f"User id={user_id} not found")

    resume_json: Any = user.get("resume_json")
    if resume_json is None or (isinstance(resume_json, str) and resume_json.strip() == ""):
        resume_json = "{}"
        logger.debug("User id=%s has no stored resume; using empty object", user_id)

    state["current_resume_json"] = (
        resume_json if isinstance(resume_json, str) else str(resume_json)
    )
    return state


async def save_tailored(state: JDMatchState) -> JDMatchState:
    """Persist the tailored resume to the ``tailored_resumes`` table.

    Reads ``state['tailored_resume_json']`` and ``state['jd_text']`` and
    writes the new row's id to ``state['saved_id']``.

    Raises:
        ValueError: If required fields are missing.
    """
    user_id = state.get("user_id")
    jd_text = state.get("jd_text")
    tailored = state.get("tailored_resume_json")

    if user_id is None:
        raise ValueError("state['user_id'] is required")
    if not jd_text:
        raise ValueError("state['jd_text'] is required")
    if not tailored:
        raise ValueError("state['tailored_resume_json'] is required")

    logger.info("Saving tailored resume for user_id=%s", user_id)

    conn = None
    try:
        conn = db_connection.get_connection()
        saved_id = db_crud.create_tailored_resume(
            conn,
            int(user_id),
            jd_text,
            tailored,
        )
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover - defensive close
                logger.warning("Failed to close DB connection cleanly", exc_info=True)

    state["saved_id"] = int(saved_id)
    logger.debug("Tailored resume saved id=%s for user_id=%s", saved_id, user_id)
    return state


# ---------------------------------------------------------------------------
# Graph builders
# ---------------------------------------------------------------------------

def build_jd_matcher_graph() -> Any:
    """Build and compile the full JD-matcher LangGraph.

    Linear edges:
        ``START -> load_resume -> embed_jd -> match_projects
        -> analyze_gaps -> tailor_resume -> save_tailored -> END``

    Returns:
        A compiled LangGraph ``Pregel`` runnable.
    """
    graph = StateGraph(JDMatchState)

    graph.add_node("load_resume", load_resume)
    graph.add_node("embed_jd", embed_jd)
    graph.add_node("match_projects", match_projects)
    graph.add_node("analyze_gaps", analyze_gaps)
    graph.add_node("tailor_resume", tailor_resume)
    graph.add_node("save_tailored", save_tailored)

    graph.add_edge(START, "load_resume")
    graph.add_edge("load_resume", "embed_jd")
    graph.add_edge("embed_jd", "match_projects")
    graph.add_edge("match_projects", "analyze_gaps")
    graph.add_edge("analyze_gaps", "tailor_resume")
    graph.add_edge("tailor_resume", "save_tailored")
    graph.add_edge("save_tailored", END)

    compiled = graph.compile()
    logger.debug("Compiled full jd_matcher_graph")
    return compiled


def build_jd_match_only_graph() -> Any:
    """Build the match-only subgraph (no resume tailoring or persistence).

    Linear edges:
        ``START -> load_resume -> embed_jd -> match_projects
        -> analyze_gaps -> END``

    Returns:
        A compiled LangGraph ``Pregel`` runnable.
    """
    graph = StateGraph(JDMatchState)

    graph.add_node("load_resume", load_resume)
    graph.add_node("embed_jd", embed_jd)
    graph.add_node("match_projects", match_projects)
    graph.add_node("analyze_gaps", analyze_gaps)

    graph.add_edge(START, "load_resume")
    graph.add_edge("load_resume", "embed_jd")
    graph.add_edge("embed_jd", "match_projects")
    graph.add_edge("match_projects", "analyze_gaps")
    graph.add_edge("analyze_gaps", END)

    compiled = graph.compile()
    logger.debug("Compiled jd_match_only_graph")
    return compiled


# Module-level compiled singletons.
jd_matcher_graph = build_jd_matcher_graph()
jd_match_only_graph = build_jd_match_only_graph()


__all__ = [
    "build_jd_matcher_graph",
    "build_jd_match_only_graph",
    "jd_matcher_graph",
    "jd_match_only_graph",
    "load_resume",
    "save_tailored",
]
