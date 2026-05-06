"""Resume tailor node for the JD-Match LangGraph workflow.

Rewrites the candidate's resume to maximize ATS alignment with a target
job description while preserving the original JSON schema. The model
output is validated as JSON and checked to retain the same top-level
keys as the input resume. On unrecoverable failure, raises
``LLMOutputMalformedError``.
"""

from __future__ import annotations

import json
import logging
import re
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

JDMatchState = Dict[str, Any]


class LLMOutputMalformedError(Exception):
    """Raised when the LLM cannot produce a schema-conformant resume JSON."""


_SYSTEM_PROMPT = (
    "You are an expert resume writer and ATS optimization specialist. "
    "Rewrite the candidate's resume so it maximally aligns with the "
    "target job description: integrate JD keywords naturally, strengthen "
    "bullet points with measurable impact verbs, and rewrite role "
    "highlights and project descriptions for clarity and ATS scoring. "
    "You MUST NOT invent jobs, employers, dates, degrees, or skills the "
    "candidate does not already have. Preserve the EXACT same JSON "
    "structure and the EXACT same set of top-level keys as the input "
    "resume. Output ONLY a single valid JSON object — no Markdown, no "
    "code fences, no commentary."
)


def _build_prompt(resume_json: Any, jd_text: str, strict: bool = False) -> str:
    """Compose the tailoring prompt.

    Args:
        resume_json: The original resume JSON.
        jd_text: The target job description.
        strict: When True, append a stricter formatting reminder used on
            retry.

    Returns:
        The formatted prompt string.
    """
    try:
        resume_str = json.dumps(resume_json, ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        resume_str = str(resume_json)

    base = (
        "## Original Resume (JSON)\n"
        f"```json\n{resume_str}\n```\n\n"
        "## Target Job Description\n"
        f"{jd_text}\n\n"
        "Task: Produce an ATS-optimized version of the resume. Rewrite "
        "highlights and descriptions to weave in relevant JD keywords, "
        "improve verb choice, and quantify impact where supported by the "
        "original content. Keep the JSON schema identical (same top-level "
        "keys, same nested array shapes). Output the JSON object only."
    )
    if strict:
        base += (
            "\n\nSTRICT MODE: Your previous response was not valid JSON or "
            "did not preserve the original schema. Reply with a single "
            "JSON object and nothing else. No prefix, no suffix, no "
            "explanation, no code fences. Top-level keys MUST match the "
            "input resume exactly."
        )
    return base


def _extract_json_object(text: str) -> Dict[str, Any]:
    """Extract a JSON object from raw LLM text.

    Args:
        text: Raw model output.

    Returns:
        The parsed JSON object as a dict.

    Raises:
        ValueError: If no valid JSON object can be extracted.
    """
    if not text:
        raise ValueError("empty model response")

    candidates = [text.strip()]

    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence_match:
        candidates.append(fence_match.group(1).strip())

    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidates.append(text[first : last + 1])

    last_err: Exception | None = None
    for cand in candidates:
        try:
            data = json.loads(cand)
        except json.JSONDecodeError as exc:
            last_err = exc
            continue
        if not isinstance(data, dict):
            last_err = ValueError("parsed JSON is not an object")
            continue
        return data

    raise ValueError(f"could not parse JSON object: {last_err}")


def _validate_schema(original: Any, tailored: Dict[str, Any]) -> None:
    """Validate that the tailored resume retains the original top-level keys.

    Args:
        original: The original resume JSON.
        tailored: The tailored resume produced by the LLM.

    Raises:
        ValueError: If the top-level key sets do not match.
    """
    if not isinstance(original, dict):
        # If the original wasn't a dict we can only require a non-empty obj.
        if not tailored:
            raise ValueError("tailored resume is empty")
        return

    orig_keys = set(original.keys())
    new_keys = set(tailored.keys())
    if orig_keys != new_keys:
        missing = orig_keys - new_keys
        extra = new_keys - orig_keys
        raise ValueError(
            f"top-level keys mismatch (missing={sorted(missing)}, extra={sorted(extra)})"
        )


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
)
async def _invoke_llm(llm: ChatGoogleGenerativeAI, prompt: str) -> str:
    """Invoke Gemini with tenacity-based retry on transport errors."""
    messages = [SystemMessage(content=_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    response = await llm.ainvoke(messages)
    content = getattr(response, "content", None)
    if not isinstance(content, str):
        content = str(content) if content is not None else ""
    return content


async def tailor_resume(state: JDMatchState) -> JDMatchState:
    """Produce an ATS-optimized resume tailored to the target JD.

    Reads the Gemini API key strictly from ``state["gemini_key"]``. On
    success, sets ``state["tailored_resume_json"]`` to a JSON-serialized
    string of the tailored resume. On parse/validation failure, retries
    once with a stricter prompt; if it still fails, raises
    ``LLMOutputMalformedError``.

    Args:
        state: The current JD-match state.

    Returns:
        The mutated state with ``tailored_resume_json`` populated.

    Raises:
        LLMOutputMalformedError: If the LLM cannot return a schema-
            conformant JSON object after one strict retry.
    """
    gemini_key = state.get("gemini_key")
    if not gemini_key:
        logger.error("tailor_resume: missing gemini_key in state")
        raise LLMOutputMalformedError("gemini_key missing from state")

    resume_json = (
        state.get("user_resume_json")
        or state.get("resume_json")
        or state.get("parsed_resume")
        or {}
    )
    jd_text = state.get("jd_text") or state.get("job_description") or ""

    if not jd_text:
        logger.warning("tailor_resume: no JD text; returning original resume unchanged")
        try:
            state["tailored_resume_json"] = json.dumps(resume_json, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            raise LLMOutputMalformedError(f"original resume not serializable: {exc}") from exc
        return state

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=gemini_key,
        temperature=0.2,
    )

    # First attempt.
    prompt = _build_prompt(resume_json, jd_text, strict=False)
    try:
        raw = await _invoke_llm(llm, prompt)
        tailored = _extract_json_object(raw)
        _validate_schema(resume_json, tailored)
        state["tailored_resume_json"] = json.dumps(tailored, ensure_ascii=False)
        logger.info("tailor_resume: tailored resume produced (first attempt)")
        return state
    except ValueError as parse_err:
        logger.warning("tailor_resume: first attempt failed (%s); strict retry", parse_err)
    except Exception as exc:  # noqa: BLE001
        logger.exception("tailor_resume: LLM call failed: %s", exc)
        raise LLMOutputMalformedError(f"LLM call failed: {exc}") from exc

    # Strict retry.
    strict_prompt = _build_prompt(resume_json, jd_text, strict=True)
    try:
        raw = await _invoke_llm(llm, strict_prompt)
        tailored = _extract_json_object(raw)
        _validate_schema(resume_json, tailored)
        state["tailored_resume_json"] = json.dumps(tailored, ensure_ascii=False)
        logger.info("tailor_resume: tailored resume produced (strict retry)")
        return state
    except ValueError as parse_err:
        logger.error("tailor_resume: strict retry failed (%s)", parse_err)
        raise LLMOutputMalformedError(str(parse_err)) from parse_err
    except Exception as exc:  # noqa: BLE001
        logger.exception("tailor_resume: strict retry LLM call failed: %s", exc)
        raise LLMOutputMalformedError(f"LLM call failed on retry: {exc}") from exc
