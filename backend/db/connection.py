"""Database connection management for Jobify backend.

Provides SQLite connections with sqlite-vec extension loaded for vector search.
"""
from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from typing import Iterator

import sqlite_vec

from config import settings as _settings
DATABASE_PATH = _settings.DATABASE_PATH

logger = logging.getLogger(__name__)


def get_connection() -> sqlite3.Connection:
    """Open a new SQLite connection with sqlite-vec loaded and pragmas applied.

    Returns:
        sqlite3.Connection: configured connection with WAL mode, foreign keys
        enabled, and the sqlite_vec extension loaded.
    """
    logger.debug("Opening SQLite connection at %s", DATABASE_PATH)
    conn = sqlite3.connect(
        DATABASE_PATH,
        detect_types=sqlite3.PARSE_DECLTYPES,
        check_same_thread=False,
    )
    conn.row_factory = sqlite3.Row

    # Load sqlite-vec extension
    conn.enable_load_extension(True)
    try:
        conn.load_extension(sqlite_vec.loadable_path())
        logger.debug("Loaded sqlite_vec extension from %s", sqlite_vec.loadable_path())
    finally:
        conn.enable_load_extension(False)

    # Pragmas
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    return conn


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    """Context-managed database connection.

    Commits on success, rolls back on error, and always closes the connection.
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("Database operation failed; rolling back")
        raise
    finally:
        conn.close()
