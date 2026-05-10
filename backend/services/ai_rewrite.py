"""LLM helpers for resume building: generic text rewrite + GitHub README extraction.

Uses gemini-1.5-flash via langchain-google-genai. The user's per-request
Gemini key is required (read from request.state in the router).
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Any

import httpx
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

_KIND_PROMPTS: dict[str, str] = {
    "summary": (
        "Rewrite the following resume professional summary to be tighter, more "
        "active-voice, and recruiter-friendly. Keep it under 50 words. Do not "
        "fabricate experience. Return only the rewritten summary, no preamble."
    ),
    "bullet": (
        "Rewrite this resume bullet to start with a strong action verb, lead "
        "with the impact, and include a specific metric where one is given or "
        "clearly implied. One line, under 25 words. Do not invent metrics. "
        "Return only the rewritten bullet."
    ),
    "project_description": (
        "Rewrite this project description to be a tight 1-2 sentence summary "
        "that recruiters can skim. Lead with what was built and the impact. "
        "Do not invent features. Return only the rewritten description."
    ),
    "generic": (
        "Improve the clarity and professionalism of this text without changing "
        "its meaning or fabricating facts. Return only the rewritten text."
    ),
}


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=8), reraise=True)
async def rewrite_text(
    *, text: str, gemini_key: str, kind: str = "generic", context: str | None = None,
) -> str:
    """Send `text` to Gemini with a kind-specific instruction. Returns rewritten text."""
    if not text or not text.strip():
        return text
    instruction = _KIND_PROMPTS.get(kind, _KIND_PROMPTS["generic"])
    prompt_parts = [instruction]
    if context:
        prompt_parts.append(f"\nContext (do not include in output):\n{context.strip()}")
    prompt_parts.append(f"\nText to rewrite:\n{text.strip()}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=gemini_key,
        temperature=0.4,
    )
    resp = await llm.ainvoke("\n".join(prompt_parts))
    out = (getattr(resp, "content", None) or str(resp)).strip()
    # Strip wrapping quotes the model sometimes adds.
    if (out.startswith('"') and out.endswith('"')) or (out.startswith("'") and out.endswith("'")):
        out = out[1:-1].strip()
    return out


# --- GitHub README extraction --------------------------------------------------

_GITHUB_RE = re.compile(r"github\.com/([^/\s]+)/([^/\s#?]+)", re.IGNORECASE)


def _parse_github_url(url: str) -> tuple[str, str] | None:
    m = _GITHUB_RE.search(url or "")
    if not m:
        return None
    owner = m.group(1)
    repo = m.group(2).rstrip(".git")
    return owner, repo


def _strip_markdown(md: str) -> str:
    """Light markdown → plain text for prompt cost control."""
    md = re.sub(r"```[\s\S]*?```", "", md)         # fenced code
    md = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", md)   # images
    md = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)  # links → label
    md = re.sub(r"^#{1,6}\s*", "", md, flags=re.M) # heading hashes
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()


async def _fetch_github_meta(owner: str, repo: str) -> dict[str, Any]:
    """Pull repo meta + README text. Best-effort — returns whatever is available."""
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "jobify"}
    out: dict[str, Any] = {"owner": owner, "repo": repo, "url": f"https://github.com/{owner}/{repo}"}
    async with httpx.AsyncClient(timeout=15) as client:
        # Repo metadata — created_at / pushed_at give the date range.
        try:
            r = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            if r.status_code == 200:
                meta = r.json()
                out["description"] = meta.get("description") or ""
                out["language"] = meta.get("language") or ""
                out["topics"] = meta.get("topics") or []
                out["created_at"] = meta.get("created_at")
                out["pushed_at"] = meta.get("pushed_at") or meta.get("updated_at")
                out["default_branch"] = meta.get("default_branch") or "main"
            elif r.status_code == 404:
                raise ValueError("repo_not_found")
        except httpx.HTTPError as exc:
            logger.warning("github meta fetch failed: %s", exc)

        # README — try HEAD then main then master.
        readme = ""
        for branch in (out.get("default_branch", "main"), "main", "master", "HEAD"):
            try:
                r = await client.get(
                    f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md",
                    timeout=10,
                )
                if r.status_code == 200 and r.text.strip():
                    readme = r.text
                    break
            except httpx.HTTPError:
                continue
        out["readme"] = readme[:10000]  # cap before sending to LLM
    return out


def _format_date(iso: str | None) -> str | None:
    """'2024-05-12T...' → 'May 2024'."""
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%b %Y")
    except Exception:  # noqa: BLE001
        return None


_EXTRACT_INSTRUCTION = """\
You are extracting a resume project entry from a GitHub repository's README.
Return ONLY a JSON object (no markdown fences, no preamble) with these keys:

  name           - short project name (use repo name unless README is clearer)
  description    - 1-2 sentence summary of what it does and the impact
  technologies   - list of strings, the 3-6 most central tech/frameworks used
                   (avoid filler like "JavaScript" if the project clearly uses
                   something more specific like "React")
  highlights     - up to 3 short resume bullets (each under 20 words). Pull
                   from concrete features the README mentions. Do not invent.

If the README is sparse, leave fields empty rather than fabricating. The user
fills in date_range separately from repo metadata.
"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=6), reraise=True)
async def extract_github_project(*, url: str, gemini_key: str) -> dict[str, Any]:
    """Fetch a GitHub repo's README + meta, distill into a resume project entry."""
    parsed = _parse_github_url(url)
    if not parsed:
        raise ValueError("not_a_github_url")
    owner, repo = parsed
    meta = await _fetch_github_meta(owner, repo)

    readme = _strip_markdown(meta.get("readme") or "")
    seed = (meta.get("description") or "").strip()
    topics = meta.get("topics") or []

    prompt = (
        _EXTRACT_INSTRUCTION
        + f"\nRepo: {owner}/{repo}"
        + (f"\nGitHub description: {seed}" if seed else "")
        + (f"\nGitHub topics: {', '.join(topics)}" if topics else "")
        + (f"\n\nREADME:\n{readme}" if readme else "")
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=gemini_key,
        temperature=0.2,
    )
    resp = await llm.ainvoke(prompt)
    raw = (getattr(resp, "content", None) or str(resp)).strip()

    # Strip markdown fences if model wrapped JSON anyway.
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.M).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: minimum viable record from raw metadata.
        logger.warning("extract_github_project: JSON parse failed, using meta-only fallback")
        data = {
            "name": repo,
            "description": seed,
            "technologies": [meta.get("language")] if meta.get("language") else [],
            "highlights": [],
        }

    # Sanitize + add date range from GitHub timestamps.
    out = {
        "name": (data.get("name") or repo)[:100],
        "description": (data.get("description") or seed)[:600],
        "url": meta["url"],
        "start_date": _format_date(meta.get("created_at")),
        "end_date": _format_date(meta.get("pushed_at")),
        "technologies": [
            str(t).strip() for t in (data.get("technologies") or []) if str(t).strip()
        ][:6],
        "highlights": [
            str(h).strip() for h in (data.get("highlights") or []) if str(h).strip()
        ][:3],
    }
    return out
