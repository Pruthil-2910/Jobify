"""Database schema initialization for Jobify backend.

Creates relational tables and sqlite-vec virtual tables (768-dim embeddings,
matching Google text-embedding-004).
"""
from __future__ import annotations

import logging

from db.connection import get_db

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768

_SCHEMA_STATEMENTS: tuple[str, ...] = (
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        resume_json TEXT,
        api_key_encrypted TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE,
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        salary_min REAL,
        salary_max REAL,
        description TEXT,
        category TEXT,
        contract_type TEXT,
        contract_time TEXT,
        posted_at TEXT,
        redirect_url TEXT,
        country TEXT,
        raw_json TEXT,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_url TEXT,
        project_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS tailored_resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        jd_text TEXT NOT NULL,
        resume_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    f"""
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_users USING vec0(
        user_id INTEGER PRIMARY KEY,
        embedding FLOAT[{EMBEDDING_DIM}]
    )
    """,
    f"""
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_jobs USING vec0(
        job_id INTEGER PRIMARY KEY,
        embedding FLOAT[{EMBEDDING_DIM}]
    )
    """,
    f"""
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_projects USING vec0(
        project_id INTEGER PRIMARY KEY,
        embedding FLOAT[{EMBEDDING_DIM}]
    )
    """,
)


_JOB_EXTRA_COLUMNS = (
    ("category", "TEXT"),
    ("contract_type", "TEXT"),
    ("contract_time", "TEXT"),
    ("posted_at", "TEXT"),
    ("redirect_url", "TEXT"),
    ("country", "TEXT"),
)

_INDEX_STATEMENTS = (
    "CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at)",
    "CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country)",
    "CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category)",
    "CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)",
)


def _migrate_jobs(conn) -> None:
    """Add columns introduced after initial release (idempotent)."""
    cols = {row[1] for row in conn.execute("PRAGMA table_info(jobs)")}
    for name, sql_type in _JOB_EXTRA_COLUMNS:
        if name not in cols:
            conn.execute(f"ALTER TABLE jobs ADD COLUMN {name} {sql_type}")
            logger.info("migrate: added jobs.%s", name)


def init_db() -> None:
    """Create all tables + apply migrations (idempotent)."""
    logger.info("Initializing database schema (embedding dim=%d)", EMBEDDING_DIM)
    with get_db() as conn:
        for stmt in _SCHEMA_STATEMENTS:
            conn.execute(stmt)
        _migrate_jobs(conn)
        for stmt in _INDEX_STATEMENTS:
            conn.execute(stmt)
    logger.info("Database schema initialization complete")
