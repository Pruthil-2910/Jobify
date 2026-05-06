"""RAG retrieval nodes for the chatbot graph.

Two nodes are exposed:

* :func:`rag_retrieve` — semantic vector search over the ``jobs`` table.
* :func:`analytical_query` — LLM-generated *read-only* SQL execution over the
  same table with strict safety validation.
"""
from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any, List

from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from db import crud
from db.connection import get_connection
from services.embedding import embed_query

if TYPE_CHECKING:  # pragma: no cover - typing only
    from agents.state import ChatState

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Semantic retrieval
# ---------------------------------------------------------------------------


async def rag_retrieve(state: "ChatState") -> "ChatState":
    """Embed the user message and run a vector search against ``jobs``.

    Stores up to 5 matches in ``state['retrieved_jobs']``. The DB connection
    is always closed before returning.
    """
    user_message: str = state.get("user_message", "") or ""
    conn = None
    try:
        embedding = embed_query(user_message)
        conn = get_connection()
        rows = crud.vec_search_jobs(conn, embedding, limit=5)
        state["retrieved_jobs"] = list(rows) if rows else []
        logger.info("rag_retrieve: %d jobs returned", len(state["retrieved_jobs"]))
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("rag_retrieve: vector search failed: %s", exc)
        state["retrieved_jobs"] = []
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover - best-effort close
                logger.debug("rag_retrieve: error closing connection", exc_info=True)
    return state


# ---------------------------------------------------------------------------
# Analytical (text-to-SQL) retrieval
# ---------------------------------------------------------------------------

_FORBIDDEN_TOKENS = (
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "PRAGMA",
    "ATTACH",
)

_SQL_PROMPT = (
    "You translate a user's analytical question into a SINGLE read-only"
    " SQLite SELECT statement against the table `jobs`.\n"
    "Rules:\n"
    "  1. Output ONLY the SQL — no markdown, no comments, no explanation.\n"
    "  2. Must start with SELECT.\n"
    "  3. Must NOT contain DROP, DELETE, UPDATE, INSERT, PRAGMA, ATTACH or"
    " multiple statements (no inner ';').\n"
    "  4. Always include LIMIT 50 or less.\n\n"
    "Question: {question}\n"
    "SQL:"
)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def _invoke_sql_llm(llm: ChatGoogleGenerativeAI, prompt: str) -> str:
    """Invoke Gemini with tenacity retry to obtain candidate SQL."""
    response = await llm.ainvoke(prompt)
    return getattr(response, "content", "") or ""


def _clean_sql(raw: str) -> str:
    """Strip code fences / language hints the model may emit."""
    text = raw.strip()
    if text.startswith("```"):
        # Remove leading fence (``` or ```sql) and trailing fence.
        text = re.sub(r"^```(?:sql)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```\s*$", "", text)
    return text.strip().rstrip(";").strip()


def _is_safe_sql(sql: str) -> bool:
    """Return ``True`` only when *sql* is a single SELECT with no mutations."""
    if not sql:
        return False
    upper = sql.upper().lstrip()
    if not upper.startswith("SELECT"):
        return False
    if ";" in sql:  # no inner ';'
        return False
    for token in _FORBIDDEN_TOKENS:
        if re.search(rf"\b{token}\b", upper):
            return False
    return True


async def analytical_query(state: "ChatState") -> "ChatState":
    """Generate, validate, and execute a SELECT query for analytical intents.

    On any safety violation or execution error, ``state['retrieved_jobs']``
    is set to an empty list.
    """
    user_message: str = state.get("user_message", "") or ""
    gemini_key: str = state.get("gemini_key", "") or ""

    state["retrieved_jobs"] = []
    conn = None
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=0,
        )
        prompt = _SQL_PROMPT.format(question=user_message)
        raw = await _invoke_sql_llm(llm, prompt)
        sql = _clean_sql(raw)

        if not _is_safe_sql(sql):
            logger.warning("analytical_query: unsafe or invalid SQL rejected: %r", sql)
            state["retrieved_jobs"] = []
            return state

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchmany(50)
        columns = [d[0] for d in cursor.description] if cursor.description else []
        results: List[dict[str, Any]] = [dict(zip(columns, row)) for row in rows]
        state["retrieved_jobs"] = results
        logger.info(
            "analytical_query: executed SQL, %d rows returned", len(results)
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("analytical_query: failed: %s", exc)
        state["retrieved_jobs"] = []
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover
                logger.debug("analytical_query: error closing connection", exc_info=True)
    return state
