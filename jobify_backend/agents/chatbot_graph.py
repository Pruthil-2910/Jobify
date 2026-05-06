"""LangGraph definition for the Jobify chatbot.

Wires together resume context injection, intent classification, semantic /
analytical retrieval branches, and the final LLM responder into a single
:class:`langgraph.graph.state.CompiledStateGraph`.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from langgraph.graph import END, StateGraph

from agents.nodes.intent_router import route_intent
from agents.nodes.llm_responder import llm_respond
from agents.nodes.rag_retriever import analytical_query, rag_retrieve
from agents.state import ChatState
from db import crud
from db.connection import get_connection

if TYPE_CHECKING:  # pragma: no cover
    from langgraph.graph.state import CompiledStateGraph as CompiledGraph

logger = logging.getLogger(__name__)


async def inject_context(state: ChatState) -> ChatState:
    """Load the user's resume JSON from the DB and attach it to ``state``."""
    user_id = state.get("user_id")
    conn = None
    try:
        if user_id is None:
            state["resume_json"] = None
            return state
        conn = get_connection()
        user = crud.get_user_by_id(conn, user_id)
        resume_json = None
        if user is not None:
            # Support both dict-like rows and ORM-style objects.
            if isinstance(user, dict):
                resume_json = user.get("resume_json")
            else:
                resume_json = getattr(user, "resume_json", None)
        state["resume_json"] = resume_json
        logger.info("inject_context: resume_json loaded for user_id=%s", user_id)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("inject_context: failed to load resume: %s", exc)
        state["resume_json"] = None
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover
                logger.debug("inject_context: error closing connection", exc_info=True)
    return state


def _intent_branch(state: ChatState) -> str:
    """Conditional edge selector based on classified intent."""
    intent = state.get("intent", "general")
    if intent == "semantic":
        return "rag_retrieve"
    if intent == "analytical":
        return "analytical_query"
    return "llm_respond"


def build_chatbot_graph() -> "CompiledGraph":
    """Build and compile the chatbot ``StateGraph``.

    Returns:
        A compiled LangGraph ready for ``ainvoke`` / ``astream``.
    """
    graph = StateGraph(ChatState)

    graph.add_node("inject_context", inject_context)
    graph.add_node("route_intent", route_intent)
    graph.add_node("rag_retrieve", rag_retrieve)
    graph.add_node("analytical_query", analytical_query)
    graph.add_node("llm_respond", llm_respond)

    graph.set_entry_point("inject_context")
    graph.add_edge("inject_context", "route_intent")

    graph.add_conditional_edges(
        "route_intent",
        _intent_branch,
        {
            "rag_retrieve": "rag_retrieve",
            "analytical_query": "analytical_query",
            "llm_respond": "llm_respond",
        },
    )

    graph.add_edge("rag_retrieve", "llm_respond")
    graph.add_edge("analytical_query", "llm_respond")
    graph.add_edge("llm_respond", END)

    compiled = graph.compile()
    logger.info("chatbot_graph: compiled successfully")
    return compiled


chatbot_graph = build_chatbot_graph()
