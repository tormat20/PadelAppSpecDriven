from app.db.connection import get_connection
from app.db.migrate import run_migrations


def test_migrations_apply_once(tmp_path):
    from app.core.config import settings

    settings.db_path = str(tmp_path / "mig.duckdb")
    run_migrations()
    run_migrations()

    with get_connection() as conn:
        rows = conn.execute("SELECT name FROM schema_migrations ORDER BY name").fetchall()
    assert [r[0] for r in rows] == ["001_init.sql"]
