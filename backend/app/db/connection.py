from collections.abc import Generator
from contextlib import contextmanager

import duckdb

from app.core.config import settings


@contextmanager
def get_connection() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    conn = duckdb.connect(settings.db_path)
    conn.execute("SET TimeZone='UTC'")
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_read_connection() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """Open DuckDB in read-only mode.

    Multiple concurrent read-only connections are safe with DuckDB — they
    do not contend for the write lock, which eliminates the race condition
    that caused intermittent leaderboard failures when three requests arrived
    simultaneously on page load.
    """
    conn = duckdb.connect(settings.db_path, read_only=True)
    conn.execute("SET TimeZone='UTC'")
    try:
        yield conn
    finally:
        conn.close()
