"""
CRUD operations for Jobify backend.

Provides full CRUD for users, jobs, user_projects, tailored_resumes, and
sqlite-vec helpers for vector embedding upsert/search.

All SQL is parameterized. Read functions set ``conn.row_factory = sqlite3.Row``
so results can be converted to dictionaries cleanly.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Tables permitted for vector embedding upserts
_VEC_TABLES = {"vec_users", "vec_jobs", "vec_projects"}


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    """Convert a sqlite3.Row to a dict, or return None."""
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}


def _rows_to_dicts(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Convert a list of sqlite3.Row objects to a list of dicts."""
    return [{k: r[k] for k in r.keys()} for r in rows]


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------

def create_user(conn: sqlite3.Connection, email: str, password_hash: str) -> int:
    """Create a new user. Returns the new user's id."""
    cur = conn.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (email, password_hash),
    )
    conn.commit()
    user_id = cur.lastrowid
    logger.info("Created user id=%s email=%s", user_id, email)
    return int(user_id)


def get_user_by_id(conn: sqlite3.Connection, user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a user by primary key. Returns dict or None."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    return _row_to_dict(row)


def get_user_by_email(conn: sqlite3.Connection, email: str) -> Optional[Dict[str, Any]]:
    """Fetch a user by email. Returns dict or None."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    return _row_to_dict(row)


def update_user_resume(
    conn: sqlite3.Connection,
    user_id: int,
    resume_json: Any,
) -> None:
    """Update a user's stored resume JSON blob."""
    payload = resume_json if isinstance(resume_json, str) else json.dumps(resume_json)
    conn.execute(
        "UPDATE users SET resume_json = ? WHERE id = ?",
        (payload, user_id),
    )
    conn.commit()
    logger.info("Updated resume for user id=%s", user_id)


def update_user_api_key(
    conn: sqlite3.Connection,
    user_id: int,
    api_key_encrypted: str,
) -> None:
    """Update a user's encrypted API key."""
    conn.execute(
        "UPDATE users SET api_key_encrypted = ? WHERE id = ?",
        (api_key_encrypted, user_id),
    )
    conn.commit()
    logger.info("Updated API key for user id=%s", user_id)


# ---------------------------------------------------------------------------
# Job CRUD
# ---------------------------------------------------------------------------

def upsert_job(
    conn: sqlite3.Connection,
    external_id: str,
    title: str,
    company: Optional[str],
    location: Optional[str],
    salary_min: Optional[float],
    salary_max: Optional[float],
    description: Optional[str],
    raw_json: Any,
    *,
    category: Optional[str] = None,
    contract_type: Optional[str] = None,
    contract_time: Optional[str] = None,
    posted_at: Optional[str] = None,
    redirect_url: Optional[str] = None,
    country: Optional[str] = None,
) -> int:
    """Insert or replace a job keyed on ``external_id``. Returns row id."""
    payload = raw_json if isinstance(raw_json, str) else json.dumps(raw_json)
    cur = conn.execute(
        """
        INSERT OR REPLACE INTO jobs
            (external_id, title, company, location, salary_min, salary_max,
             description, category, contract_type, contract_time,
             posted_at, redirect_url, country, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            external_id, title, company, location, salary_min, salary_max,
            description, category, contract_type, contract_time,
            posted_at, redirect_url, country, payload,
        ),
    )
    conn.commit()
    job_id = cur.lastrowid
    logger.debug("Upserted job id=%s external_id=%s", job_id, external_id)
    return int(job_id)


def get_job_by_id(conn: sqlite3.Connection, job_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a job by primary key. Returns dict or None."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cur.fetchone()
    return _row_to_dict(row)


def search_jobs(
    conn: sqlite3.Connection,
    q: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    *,
    country: Optional[str] = None,
    category: Optional[str] = None,
    contract_type: Optional[str] = None,
    contract_time: Optional[str] = None,
    salary_min: Optional[float] = None,
    salary_max: Optional[float] = None,
    posted_since: Optional[str] = None,  # ISO date or datetime
) -> List[Dict[str, Any]]:
    """Search jobs with optional filters. Empty/None filters skipped."""
    conn.row_factory = sqlite3.Row
    clauses: List[str] = []
    params: List[Any] = []

    if q:
        clauses.append("(title LIKE ? OR description LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like])
    if location:
        clauses.append("location LIKE ?")
        params.append(f"%{location}%")
    if country:
        clauses.append("country = ?")
        params.append(country.lower())
    if category:
        clauses.append("category LIKE ?")
        params.append(f"%{category}%")
    if contract_type:
        clauses.append("contract_type = ?")
        params.append(contract_type)
    if contract_time:
        clauses.append("contract_time = ?")
        params.append(contract_time)
    if salary_min is not None:
        clauses.append("salary_max >= ?")
        params.append(float(salary_min))
    if salary_max is not None:
        clauses.append("salary_min <= ?")
        params.append(float(salary_max))
    if posted_since:
        clauses.append("posted_at >= ?")
        params.append(posted_since)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    sql = (
        f"SELECT * FROM jobs {where} "
        f"ORDER BY COALESCE(posted_at, fetched_at) DESC, id DESC "
        f"LIMIT ? OFFSET ?"
    )
    params.extend([int(limit), int(offset)])
    cur = conn.execute(sql, params)
    return _rows_to_dicts(cur.fetchall())


def count_jobs(conn: sqlite3.Connection, country: Optional[str] = None) -> int:
    """Count jobs, optionally scoped by country."""
    if country:
        cur = conn.execute("SELECT COUNT(*) FROM jobs WHERE country = ?", (country.lower(),))
    else:
        cur = conn.execute("SELECT COUNT(*) FROM jobs")
    return int(cur.fetchone()[0])


def list_all_jobs(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Return every job ordered by id DESC."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute("SELECT * FROM jobs ORDER BY id DESC")
    return _rows_to_dicts(cur.fetchall())


# ---------------------------------------------------------------------------
# Project CRUD
# ---------------------------------------------------------------------------

def create_project(
    conn: sqlite3.Connection,
    user_id: int,
    source_url: Optional[str],
    project_text: str,
) -> int:
    """Create a project for a user. Returns new project id."""
    cur = conn.execute(
        """
        INSERT INTO user_projects (user_id, source_url, project_text)
        VALUES (?, ?, ?)
        """,
        (user_id, source_url, project_text),
    )
    conn.commit()
    project_id = cur.lastrowid
    logger.info("Created project id=%s for user id=%s", project_id, user_id)
    return int(project_id)


def list_user_projects(
    conn: sqlite3.Connection,
    user_id: int,
) -> List[Dict[str, Any]]:
    """Return all user_projects belonging to a user, newest first."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        "SELECT * FROM user_projects WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    return _rows_to_dicts(cur.fetchall())


def delete_project(
    conn: sqlite3.Connection,
    project_id: int,
    user_id: int,
) -> bool:
    """
    Delete a project owned by ``user_id``.

    Returns True if a row was deleted, False otherwise.
    """
    cur = conn.execute(
        "DELETE FROM user_projects WHERE id = ? AND user_id = ?",
        (project_id, user_id),
    )
    conn.commit()
    deleted = cur.rowcount > 0
    logger.info(
        "Delete project id=%s user_id=%s deleted=%s", project_id, user_id, deleted
    )
    return deleted


# ---------------------------------------------------------------------------
# TailoredResume CRUD
# ---------------------------------------------------------------------------

def create_tailored_resume(
    conn: sqlite3.Connection,
    user_id: int,
    jd_text: str,
    resume_json: Any,
) -> int:
    """Create a tailored resume for a user. Returns new id."""
    payload = resume_json if isinstance(resume_json, str) else json.dumps(resume_json)
    cur = conn.execute(
        """
        INSERT INTO tailored_resumes (user_id, jd_text, resume_json)
        VALUES (?, ?, ?)
        """,
        (user_id, jd_text, payload),
    )
    conn.commit()
    resume_id = cur.lastrowid
    logger.info(
        "Created tailored resume id=%s for user id=%s", resume_id, user_id
    )
    return int(resume_id)


def list_tailored_resumes(
    conn: sqlite3.Connection,
    user_id: int,
) -> List[Dict[str, Any]]:
    """Return all tailored resumes for a user, newest first."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        "SELECT * FROM tailored_resumes WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    return _rows_to_dicts(cur.fetchall())


def get_tailored_resume(
    conn: sqlite3.Connection,
    resume_id: int,
    user_id: int,
) -> Optional[Dict[str, Any]]:
    """Fetch a single tailored resume scoped to a user."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        "SELECT * FROM tailored_resumes WHERE id = ? AND user_id = ?",
        (resume_id, user_id),
    )
    row = cur.fetchone()
    return _row_to_dict(row)


# ---------------------------------------------------------------------------
# Vector helpers (sqlite-vec)
# ---------------------------------------------------------------------------

def upsert_vec_embedding(
    conn: sqlite3.Connection,
    table: str,
    id: int,
    embedding: List[float],
) -> None:
    """
    Insert or replace a vector embedding into one of the sqlite-vec tables.

    ``table`` must be one of ``vec_users``, ``vec_jobs``, ``vec_projects``.
    The embedding list is serialized via ``json.dumps`` for sqlite-vec.
    """
    if table not in _VEC_TABLES:
        raise ValueError(
            f"Invalid vector table {table!r}; expected one of {sorted(_VEC_TABLES)}"
        )

    payload = json.dumps(embedding)
    # Table name is whitelisted above; safe to interpolate.
    sql = f"INSERT OR REPLACE INTO {table} VALUES (?, ?)"
    conn.execute(sql, (id, payload))
    conn.commit()
    logger.debug("Upserted embedding into %s id=%s", table, id)


def vec_search_jobs(
    conn: sqlite3.Connection,
    query_embedding: List[float],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Nearest-neighbour search over jobs using sqlite-vec cosine distance.

    Joins ``vec_jobs`` with ``jobs`` and orders ascending by distance.
    """
    conn.row_factory = sqlite3.Row
    payload = json.dumps(query_embedding)
    cur = conn.execute(
        """
        SELECT j.*, vec_distance_cosine(v.embedding, ?) AS distance
        FROM vec_jobs v
        JOIN jobs j ON j.id = v.id
        ORDER BY distance ASC
        LIMIT ?
        """,
        (payload, int(limit)),
    )
    return _rows_to_dicts(cur.fetchall())


def vec_search_projects(
    conn: sqlite3.Connection,
    user_id: int,
    query_embedding: List[float],
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """
    Nearest-neighbour search over a user's user_projects using cosine distance.
    """
    conn.row_factory = sqlite3.Row
    payload = json.dumps(query_embedding)
    cur = conn.execute(
        """
        SELECT p.*, vec_distance_cosine(v.embedding, ?) AS distance
        FROM vec_projects v
        JOIN user_projects p ON p.id = v.id
        WHERE p.user_id = ?
        ORDER BY distance ASC
        LIMIT ?
        """,
        (payload, user_id, int(limit)),
    )
    return _rows_to_dicts(cur.fetchall())
