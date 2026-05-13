"""Gap analyzer node for the JD-Match LangGraph workflow.

Compares the user's resume against a target job description using Gemini
and produces a JSON array of missing skills. Implements one strict-prompt
retry on JSON parse failure and falls back to an empty list if the model
still cannot return parseable output.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List

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


_SYSTEM_PROMPT = (
    "You are an expert technical recruiter and ATS reviewer. "
    "Compare a candidate resume against a target job description and "
    "identify concrete skills, tools, certifications, or experience areas "
    "explicitly required by the JD that are absent or weak in the resume. "
    "You MUST respond with a single valid JSON array of strings only — "
    "no prose, no Markdown fences, no keys, no commentary."
)


def _build_prompt(resume_json: Any, jd_text: str, strict: bool = False) -> str:
    """Build the gap-analysis prompt.

    Args:
        resume_json: The candidate resume as a JSON-compatible structure.
        jd_text: The target job description text.
        strict: When True, append a stricter formatting reminder used on
            the retry attempt.

    Returns:
        The formatted prompt string.
    """
    try:
        resume_str = json.dumps(resume_json, ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        resume_str = str(resume_json)

    base = (
        "## Candidate Resume (JSON)\n"
        f"```json\n{resume_str}\n```\n\n"
        "## Target Job Description\n"
        f"{jd_text}\n\n"
        "Task: Output ONLY a JSON array of short skill strings naming the "
        "missing skills. Example: [\"Kubernetes\", \"GraphQL\", \"AWS Lambda\"]. "
        "Do not wrap the array in any object or code fence."
    )
    if strict:
        base += (
            "\n\nSTRICT MODE: Your previous response was not valid JSON. "
            "Reply with the JSON array and nothing else. No prefix, no "
            "suffix, no explanation, no code fences."
        )
    return base


def _extract_json_array(text: str) -> List[str]:
    """Extract and parse a JSON array of strings from raw LLM text.

    Tolerates surrounding code fences or stray prose by finding the first
    ``[`` and the last ``]``.

    Args:
        text: Raw model output.

    Returns:
        A list of strings.

    Raises:
        ValueError: If no valid JSON array of strings can be extracted.
    """
    if not text:
        raise ValueError("empty model response")

    # Try direct parse first.
    candidates = [text.strip()]

    # Strip code fences if present.
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence_match:
        candidates.append(fence_match.group(1).strip())

    # Slice from first [ to last ].
    first = text.find("[")
    last = text.rfind("]")
    if first != -1 and last != -1 and last > first:
        candidates.append(text[first : last + 1])

    last_err: Exception | None = None
    for cand in candidates:
        try:
            data = json.loads(cand)
        except json.JSONDecodeError as exc:
            last_err = exc
            continue
        if not isinstance(data, list):
            last_err = ValueError("parsed JSON is not an array")
            continue
        out: List[str] = []
        for item in data:
            if isinstance(item, str):
                stripped = item.strip()
                if stripped:
                    out.append(stripped)
        return out

    raise ValueError(f"could not parse JSON array: {last_err}")


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


async def analyze_gaps(state: JDMatchState) -> JDMatchState:
    """Analyze skill gaps between the user's resume and the target JD.

    Reads the Gemini API key strictly from ``state["gemini_key"]``. Writes
    the resulting list of missing skill strings to ``state["gap_analysis"]``.
    On a parse failure, retries the LLM once with a stricter prompt; if it
    still fails, sets ``gap_analysis`` to an empty list.

    Args:
        state: The current JD-match state.

    Returns:
        The mutated state with ``gap_analysis`` populated.
    """
    gemini_key = state.get("gemini_key")
    if not gemini_key:
        logger.error("analyze_gaps: missing gemini_key in state")
        state["gap_analysis"] = []
        return state

    resume_json = (
        state.get("user_resume_json")
        or state.get("resume_json")
        or state.get("parsed_resume")
        or {}
    )
    jd_text = state.get("jd_text") or state.get("job_description") or ""

    if not jd_text:
        logger.warning("analyze_gaps: no JD text provided; returning empty gap list")
        state["gap_analysis"] = []
        return state

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=gemini_key,
        temperature=0.0,
    )

    prompt = _build_prompt(resume_json, jd_text, strict=False)

    # First attempt.
    try:
        raw = await _invoke_llm(llm, prompt)
        gaps = _extract_json_array(raw)
        state["gap_analysis"] = gaps
        logger.info("analyze_gaps: identified %d gap(s)", len(gaps))
        return state
    except ValueError as parse_err:
        logger.warning("analyze_gaps: first parse failed (%s); retrying strictly", parse_err)
    except Exception as exc:  # noqa: BLE001
        logger.exception("analyze_gaps: LLM call failed: %s", exc)
        state["gap_analysis"] = []
        return state

    # Strict retry attempt.
    strict_prompt = _build_prompt(resume_json, jd_text, strict=True)
    try:
        raw = await _invoke_llm(llm, strict_prompt)
        gaps = _extract_json_array(raw)
        state["gap_analysis"] = gaps
        logger.info("analyze_gaps: identified %d gap(s) on strict retry", len(gaps))
        return state
    except Exception as exc:  # noqa: BLE001
        logger.error("analyze_gaps: strict retry failed (%s); returning empty list", exc)
        state["gap_analysis"] = []
        return state
