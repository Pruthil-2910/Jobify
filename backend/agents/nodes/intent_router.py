"""Intent router node for the chatbot LangGraph.

Classifies an incoming user message into one of three intents:
``analytical``, ``semantic``, or ``general``. The classification is
performed by a small Gemini model with deterministic decoding so the
output is stable across retries.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

if TYPE_CHECKING:  # pragma: no cover - typing only
    from agents.state import ChatState

logger = logging.getLogger(__name__)

_VALID_INTENTS = {"analytical", "semantic", "general"}

_CLASSIFY_PROMPT = (
    "You are an intent classifier for a job-search assistant.\n"
    "Classify the user's message into EXACTLY ONE of these labels:\n"
    "  - analytical : the user asks for counts, aggregates, statistics,"
    " comparisons, or structured filters over the jobs table\n"
    "  - semantic   : the user asks to find / recommend jobs by meaning,"
    " skills, role description, or fit\n"
    "  - general    : greetings, small talk, resume questions, or anything"
    " that does not require querying the jobs database\n\n"
    "Respond with ONLY the single lowercase word: analytical, semantic, or"
    " general. No punctuation, no explanation.\n\n"
    "User message: {message}"
)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def _invoke_llm(llm: ChatGoogleGenerativeAI, prompt: str) -> str:
    """Invoke the Gemini classifier with tenacity retry on transient errors."""
    response = await llm.ainvoke(prompt)
    return getattr(response, "content", "") or ""


async def route_intent(state: "ChatState") -> "ChatState":
    """Classify ``state['user_message']`` and write ``state['intent']``.

    Falls back to ``"general"`` whenever the LLM call fails or the response
    cannot be parsed into one of the known intent labels.
    """
    user_message: str = state.get("user_message", "") or ""
    gemini_key: str = state.get("gemini_key", "") or ""

    intent = "general"
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=gemini_key,
            temperature=0,
        )
        prompt = _CLASSIFY_PROMPT.format(message=user_message)
        raw = await _invoke_llm(llm, prompt)
        token = raw.strip().lower().split()[0] if raw.strip() else ""
        # Strip trailing punctuation just in case the model added any.
        token = token.strip(".,!?:;\"'`)(")
        if token in _VALID_INTENTS:
            intent = token
        else:
            logger.warning(
                "intent_router: unparseable response %r — defaulting to 'general'",
                raw,
            )
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("intent_router: classification failed: %s", exc)
        intent = "general"

    state["intent"] = intent
    logger.info("intent_router: classified as %s", intent)
    return state
