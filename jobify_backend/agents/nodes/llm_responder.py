"""LLM responder node for the Jobify chat agent.

This node formulates a final natural-language response to the user using
Google Gemini (via langchain_google_genai), grounded on the user's resume
and any retrieved job context held in the LangGraph ``ChatState``.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)

# ChatState is a TypedDict-like mapping defined elsewhere in the project.
# We type it loosely here to avoid a hard import dependency at module load.
ChatState = Dict[str, Any]


_SYSTEM_PROMPT = (
    "You are Jobify, a concise and helpful career assistant. "
    "Use the provided resume JSON and retrieved job postings as factual "
    "context. Never fabricate jobs, employers, or skills that are not "
    "present in the supplied context. If the context is insufficient, "
    "say so plainly and suggest what additional information would help. "
    "Respond in clear Markdown."
)


def _build_user_prompt(state: ChatState) -> str:
    """Compose the user-facing prompt from the current ``ChatState``.

    Args:
        state: The current LangGraph chat state.

    Returns:
        A formatted prompt string that includes the user resume JSON,
        retrieved jobs context, and the latest user query.
    """
    resume = state.get("user_resume_json") or state.get("resume_json") or {}
    retrieved_jobs = state.get("retrieved_jobs") or []
    user_query = state.get("user_query") or state.get("query") or ""

    try:
        resume_str = json.dumps(resume, ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        resume_str = str(resume)

    try:
        jobs_str = json.dumps(retrieved_jobs, ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        jobs_str = str(retrieved_jobs)

    return (
        "## User Resume (JSON)\n"
        f"```json\n{resume_str}\n```\n\n"
        "## Retrieved Jobs Context\n"
        f"```json\n{jobs_str}\n```\n\n"
        "## User Query\n"
        f"{user_query}\n\n"
        "Answer the user's query using only the information above."
    )


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
)
async def _invoke_llm(llm: ChatGoogleGenerativeAI, prompt: str) -> str:
    """Invoke the Gemini LLM with retry semantics.

    Args:
        llm: A configured ``ChatGoogleGenerativeAI`` instance.
        prompt: The fully composed user prompt.

    Returns:
        The model's textual response.

    Raises:
        Exception: Propagates any error after exhausting retries.
    """
    messages = [SystemMessage(content=_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    response = await llm.ainvoke(messages)
    content = getattr(response, "content", None)
    if not isinstance(content, str):
        content = str(content) if content is not None else ""
    return content


async def llm_respond(state: ChatState) -> ChatState:
    """Generate the final user-facing response and write it into state.

    Reads the Gemini API key strictly from ``state["gemini_key"]``. Sets
    ``state["final_response"]`` to the model output (or a graceful error
    message on unrecoverable failure).

    Args:
        state: The current LangGraph chat state.

    Returns:
        The mutated state with ``final_response`` populated.
    """
    gemini_key = state.get("gemini_key")
    if not gemini_key:
        logger.error("llm_respond: missing gemini_key in state")
        state["final_response"] = (
            "Sorry, I cannot answer right now because the language model "
            "credentials are not configured."
        )
        return state

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=gemini_key,
        temperature=0.3,
    )

    prompt = _build_user_prompt(state)
    logger.debug("llm_respond: invoking Gemini, prompt_len=%d", len(prompt))

    try:
        text = await _invoke_llm(llm, prompt)
    except Exception as exc:  # noqa: BLE001 - we surface a friendly message
        logger.exception("llm_respond: LLM invocation failed: %s", exc)
        state["final_response"] = (
            "Sorry, I ran into a problem generating a response. "
            "Please try again in a moment."
        )
        return state

    state["final_response"] = text.strip()
    logger.info("llm_respond: response generated (%d chars)", len(state["final_response"]))
    return state
