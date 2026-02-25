from pathlib import Path

from app.db.connection import get_connection


def _migration_files() -> list[Path]:
    base_dir = Path(__file__).parent / "migrations"
    return sorted(base_dir.glob("*.sql"))


def _meta_sql(name: str) -> str:
    path = Path(__file__).parent / "migrations" / "meta" / name
    return path.read_text(encoding="utf-8")


def run_migrations() -> None:
    files = _migration_files()
    if not files:
        return

    with get_connection() as conn:
        for file_path in files:
            if file_path.name == "000_schema_migrations.sql":
                conn.execute(file_path.read_text(encoding="utf-8"))
                continue

            existing = conn.execute(_meta_sql("select_applied.sql"), [file_path.name]).fetchone()
            if existing:
                continue

            conn.execute(file_path.read_text(encoding="utf-8"))
            conn.execute(_meta_sql("insert_applied.sql"), [file_path.name])
