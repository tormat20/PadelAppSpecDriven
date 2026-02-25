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
