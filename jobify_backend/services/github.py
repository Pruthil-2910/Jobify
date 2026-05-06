"""URL ingestion services for GitHub repos and LinkedIn pages."""
from __future__ import annotations

import logging
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 30.0
MAX_TEXT_CHARS = 8000

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class LinkedInBlockedError(Exception):
    """Raised when LinkedIn blocks scraping (403/401/451/999)."""


def _is_transient(exc: BaseException) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.TransportError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        return status == 429 or 500 <= status < 600
    return False


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception(_is_transient),
)
async def _http_get(
    client: httpx.AsyncClient,
    url: str,
    headers: Optional[dict] = None,
) -> httpx.Response:
    resp = await client.get(url, headers=headers, follow_redirects=True)
    if resp.status_code == 429 or resp.status_code >= 500:
        resp.raise_for_status()
    return resp


# ---------------------------------------------------------------------------
# Markdown / HTML stripping
# ---------------------------------------------------------------------------

_RE_CODE_FENCE = re.compile(r"```.*?```", re.DOTALL)
_RE_INLINE_CODE = re.compile(r"`([^`]*)`")
_RE_HEADER = re.compile(r"^\s{0,3}#{1,6}\s*", re.MULTILINE)
_RE_IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_RE_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_RE_HTML_TAG = re.compile(r"<[^>]+>")
_RE_WS = re.compile(r"\s+")


def _strip_markdown(md: str) -> str:
    text = _RE_CODE_FENCE.sub(" ", md)
    text = _RE_IMAGE.sub(" ", text)
    text = _RE_LINK.sub(r"\1", text)
    text = _RE_HEADER.sub("", text)
    text = _RE_INLINE_CODE.sub(r"\1", text)
    text = _RE_HTML_TAG.sub(" ", text)
    text = _RE_WS.sub(" ", text).strip()
    return text


def _strip_html(html: str) -> str:
    try:
        from bs4 import BeautifulSoup  # type: ignore

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator=" ")
    except Exception:
        text = _RE_HTML_TAG.sub(" ", html)
    return _RE_WS.sub(" ", text).strip()


def _cap(text: str) -> str:
    if len(text) > MAX_TEXT_CHARS:
        return text[:MAX_TEXT_CHARS]
    return text


# ---------------------------------------------------------------------------
# GitHub
# ---------------------------------------------------------------------------

_GH_PATH_RE = re.compile(r"^/([^/]+)/([^/]+?)(?:\.git)?/?$")


def _parse_github(url: str) -> tuple[str, str]:
    parsed = urlparse(url)
    if "github.com" not in (parsed.hostname or ""):
        raise ValueError("not_a_github_url")
    m = _GH_PATH_RE.match(parsed.path or "")
    if not m:
        raise ValueError("invalid_github_repo_url")
    return m.group(1), m.group(2)


async def extract_github_repo_text(url: str) -> str:
    """Fetch metadata + README for a GitHub repo, returning plain text (<=8000 chars)."""
    owner, repo = _parse_github(url)
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "jobify-bot"}

    logger.info("github.extract owner=%s repo=%s", owner, repo)

    parts: list[str] = []
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        try:
            meta_resp = await _http_get(client, api_url, headers=headers)
            if meta_resp.status_code == 200:
                meta = meta_resp.json()
                desc = meta.get("description")
                language = meta.get("language")
                topics = meta.get("topics") or []
                if desc:
                    parts.append(f"Description: {desc}")
                if language:
                    parts.append(f"Language: {language}")
                if topics:
                    parts.append("Topics: " + ", ".join(topics))
        except httpx.HTTPError as exc:
            logger.warning("github.meta_fetch_failed: %s", exc)

        readme_text = ""
        for branch in ("HEAD", "main", "master"):
            raw_url = (
                f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
            )
            try:
                resp = await _http_get(client, raw_url, headers={"User-Agent": "jobify-bot"})
            except httpx.HTTPError as exc:
                logger.debug("github.readme branch=%s err=%s", branch, exc)
                continue
            if resp.status_code == 200 and resp.text.strip():
                readme_text = resp.text
                break

    if readme_text:
        parts.append(_strip_markdown(readme_text))

    return _cap("\n\n".join(p for p in parts if p))


# ---------------------------------------------------------------------------
# LinkedIn
# ---------------------------------------------------------------------------

_LINKEDIN_BLOCK_STATUSES = {401, 403, 451, 999}


async def extract_linkedin_text(url: str) -> str:
    """Best-effort LinkedIn page fetch. Raises LinkedInBlockedError on block."""
    headers = {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    logger.info("linkedin.extract url=%s", url)
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        try:
            resp = await _http_get(client, url, headers=headers)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in _LINKEDIN_BLOCK_STATUSES:
                raise LinkedInBlockedError("linkedin_scraping_blocked") from exc
            raise

    if resp.status_code in _LINKEDIN_BLOCK_STATUSES:
        raise LinkedInBlockedError("linkedin_scraping_blocked")
    if resp.status_code >= 400:
        raise LinkedInBlockedError("linkedin_scraping_blocked")

    return _cap(_strip_html(resp.text))


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------


async def ingest_url(url: str) -> str:
    """Route ``url`` to the appropriate extractor based on hostname."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if "github.com" in host:
        return await extract_github_repo_text(url)
    if "linkedin.com" in host:
        return await extract_linkedin_text(url)

    # Generic fallback: best-effort plain HTML strip.
    headers = {"User-Agent": BROWSER_UA}
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        resp = await _http_get(client, url, headers=headers)
    if resp.status_code >= 400:
        return ""
    return _cap(_strip_html(resp.text))
