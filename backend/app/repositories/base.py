from pathlib import Path


def load_sql(path: str) -> str:
    sql_path = Path(__file__).parent / "sql" / path
    return sql_path.read_text(encoding="utf-8")
