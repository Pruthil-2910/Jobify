"""Adzuna jobs API client.

Provides ``fetch_jobs`` for querying the Adzuna search endpoint with
retry/backoff and a normalized result schema.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
DEFAULT_TIMEOUT = 30.0


class AdzunaError(Exception):
    """Raised for non-recoverable Adzuna API errors."""


class ConfigError(Exception):
    """Raised when required configuration is missing."""


def _is_transient(exc: BaseException) -> bool:
    """Return True if the exception represents a retryable condition."""
    if isinstance(exc, (httpx.TimeoutException, httpx.TransportError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        return status == 429 or 500 <= status < 600
    return False


def _load_credentials() -> tuple[str, str]:
    """Load Adzuna app id/key from settings; raise ConfigError if missing."""
    try:
        from config import settings  # type: ignore
    except Exception as exc:  # pragma: no cover - import shape varies
        raise ConfigError("adzuna_credentials_missing") from exc

    app_id = getattr(settings, "ADZUNA_APP_ID", None)
    app_key = getattr(settings, "ADZUNA_APP_KEY", None)
    if not app_id or not app_key:
        raise ConfigError("adzuna_credentials_missing")
    return str(app_id), str(app_key)


def _normalize(result: dict[str, Any]) -> dict[str, Any]:
    """Normalize a raw Adzuna result dict into our internal schema."""
    company = (result.get("company") or {}).get("display_name")
    location = (result.get("location") or {}).get("display_name")
    category = (result.get("category") or {}).get("label")
    return {
        "external_id": result.get("id"),
        "title": result.get("title"),
        "company": company,
        "location": location,
        "salary_min": result.get("salary_min"),
        "salary_max": result.get("salary_max"),
        "description": result.get("description"),
        "category": category,
        "contract_type": result.get("contract_type"),     # "permanent" / "contract" / None
        "contract_time": result.get("contract_time"),     # "full_time" / "part_time" / None
        "posted_at": result.get("created"),               # ISO 8601 from Adzuna
        "redirect_url": result.get("redirect_url"),
        "raw_json": json.dumps(result),
    }


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception(_is_transient),
)
async def _request(
    client: httpx.AsyncClient, url: str, params: dict[str, Any]
) -> dict[str, Any]:
    resp = await client.get(url, params=params)
    if resp.status_code == 429 or resp.status_code >= 500:
        resp.raise_for_status()
    if resp.status_code >= 400:
        raise AdzunaError(
            f"adzuna_http_{resp.status_code}: {resp.text[:200]}"
        )
    try:
        return resp.json()
    except ValueError as exc:
        raise AdzunaError("adzuna_invalid_json") from exc


async def fetch_jobs(
    query: str = "",
    location: Optional[str] = None,
    country: str = "gb",
    results_per_page: int = 20,
    page: int = 1,
    *,
    what_phrase: Optional[str] = None,
    what_and: Optional[str] = None,
    what_or: Optional[str] = None,
    what_exclude: Optional[str] = None,
    distance_km: Optional[int] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    full_time: Optional[bool] = None,
    part_time: Optional[bool] = None,
    contract: Optional[bool] = None,
    permanent: Optional[bool] = None,
    category: Optional[str] = None,
    max_days_old: Optional[int] = None,
    sort_by: Optional[str] = None,
    sort_dir: Optional[str] = None,
) -> list[dict]:
    """Fetch normalized job listings from Adzuna with full filter support.

    Adzuna API reference: https://developer.adzuna.com/docs/search

    Args:
        query: Free-text keywords (``what``). Empty string is allowed if other
            filters are set.
        location: Location string (``where``) — city, region, or postcode.
        country: 2-letter ISO country code segment in URL path
            (``gb``, ``us``, ``in``, ``de``, ``fr``, ``ca``, ``au``, ``nl``,
            ``za``, ``br``, ``it``, ``mx``, ``pl``, ``sg``, ``nz``, etc.).
        results_per_page: 1..50.
        page: 1-indexed.
        what_phrase: Match the exact phrase.
        what_and: Comma-separated terms that must all appear.
        what_or: Comma-separated terms; any may appear.
        what_exclude: Comma-separated terms that must not appear.
        distance_km: Search radius around ``location``.
        salary_min / salary_max: Salary band (in country's currency).
        full_time / part_time / contract / permanent: Bool filters; pass True
            to require, False to exclude. Adzuna takes "1" / "0" — we map.
        category: Adzuna category tag (e.g. ``it-jobs``, ``engineering-jobs``).
        max_days_old: Only jobs posted within the last N days.
        sort_by: ``date`` | ``salary`` | ``relevance`` | ``default``.
        sort_dir: ``up`` | ``down``.

    Returns:
        List of normalized job dicts.

    Raises:
        ConfigError: If Adzuna credentials are not configured.
        AdzunaError: For non-retryable HTTP errors or invalid responses.
    """
    app_id, app_key = _load_credentials()
    url = f"{ADZUNA_BASE_URL}/{country}/search/{int(page)}"
    params: dict[str, Any] = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": int(results_per_page),
        "content-type": "application/json",
    }
    if query:
        params["what"] = query
    if location:
        params["where"] = location
    if what_phrase:
        params["what_phrase"] = what_phrase
    if what_and:
        params["what_and"] = what_and
    if what_or:
        params["what_or"] = what_or
    if what_exclude:
        params["what_exclude"] = what_exclude
    if distance_km is not None:
        params["distance"] = int(distance_km)
    if salary_min is not None:
        params["salary_min"] = int(salary_min)
    if salary_max is not None:
        params["salary_max"] = int(salary_max)
    if full_time is not None:
        params["full_time"] = "1" if full_time else "0"
    if part_time is not None:
        params["part_time"] = "1" if part_time else "0"
    if contract is not None:
        params["contract"] = "1" if contract else "0"
    if permanent is not None:
        params["permanent"] = "1" if permanent else "0"
    if category:
        params["category"] = category
    if max_days_old is not None:
        params["max_days_old"] = int(max_days_old)
    if sort_by:
        params["sort_by"] = sort_by
    if sort_dir:
        params["sort_dir"] = sort_dir

    logger.info(
        "adzuna.fetch_jobs country=%s page=%s q=%r where=%r days_old=%s cat=%s",
        country, page, query, location, max_days_old, category,
    )

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        try:
            data = await _request(client, url, params)
        except httpx.HTTPStatusError as exc:
            raise AdzunaError(
                f"adzuna_http_{exc.response.status_code}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AdzunaError(f"adzuna_transport_error: {exc}") from exc

    results = data.get("results") or []
    normalized = [_normalize(r) for r in results if isinstance(r, dict)]
    logger.info("adzuna.fetch_jobs returned=%d", len(normalized))
    return normalized
