"""Tests for db.connection and db.schema."""
from __future__ import annotations

import struct
import sys
from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def _temp_db(tmp_path, monkeypatch):
    """Point DATABASE_PATH at a temp file and reload db modules."""
    db_file = tmp_path / "test_jobify.db"

    # Ensure the backend root is importable
    backend_root = Path(__file__).resolve().parents[1]
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))

    # Patch settings before importing db modules
    from config import settings  # type: ignore
    monkeypatch.setattr(settings, "DATABASE_PATH", str(db_file), raising=False)

    # Reload modules so they pick up the patched DATABASE_PATH
    for mod in ("db.connection", "db.schema"):
        if mod in sys.modules:
            del sys.modules[mod]

    yield db_file


def test_connection_opens_and_loads_sqlite_vec():
    from db.connection import get_connection

    conn = get_connection()
    try:
        # sqlite-vec exposes vec_version()
        row = conn.execute("SELECT vec_version()").fetchone()
        assert row is not None
        assert row[0]  # non-empty version string

        # WAL mode + foreign keys
        assert conn.execute("PRAGMA journal_mode").fetchone()[0].lower() == "wal"
        assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    finally:
        conn.close()


def test_init_db_creates_all_tables():
    from db.connection import get_connection
    from db.schema import init_db

    init_db()

    expected = {
        "users",
        "jobs",
        "user_projects",
        "tailored_resumes",
        "vec_users",
        "vec_jobs",
        "vec_projects",
    }

    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type IN ('table','virtual') OR name LIKE 'vec_%'"
        ).fetchall()
        names = {r[0] for r in rows}
        missing = expected - names
        assert not missing, f"Missing tables: {missing}"
    finally:
        conn.close()


def test_vec0_768_dim_insert_and_query():
    from db.connection import get_connection
    from db.schema import init_db, EMBEDDING_DIM

    assert EMBEDDING_DIM == 768

    init_db()
    conn = get_connection()
    try:
        # Pack a 768-dim float32 vector
        vec_a = struct.pack(f"{EMBEDDING_DIM}f", *([0.1] * EMBEDDING_DIM))
        vec_b = struct.pack(f"{EMBEDDING_DIM}f", *([0.9] * EMBEDDING_DIM))

        conn.execute("INSERT INTO vec_jobs(job_id, embedding) VALUES (?, ?)", (1, vec_a))
        conn.execute("INSERT INTO vec_jobs(job_id, embedding) VALUES (?, ?)", (2, vec_b))
        conn.commit()

        query = struct.pack(f"{EMBEDDING_DIM}f", *([0.1] * EMBEDDING_DIM))
        rows = conn.execute(
            "SELECT job_id, distance FROM vec_jobs WHERE embedding MATCH ? ORDER BY distance LIMIT 2",
            (query,),
        ).fetchall()

        assert len(rows) == 2
        assert rows[0][0] == 1  # nearest match should be the identical vector
    finally:
        conn.close()
