from pathlib import Path


def test_no_inline_sql_outside_allowed_locations():
    root = Path(__file__).resolve().parents[2]
    allowed = {
        root / "app" / "db" / "connection.py",
    }
    sql_tokens = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "CREATE TABLE", "DROP TABLE")

    for py_file in (root / "app").rglob("*.py"):
        if "repositories" in py_file.parts:
            continue
        if py_file in allowed:
            continue
        content = py_file.read_text(encoding="utf-8")
        for token in sql_tokens:
            assert token not in content, f"Inline SQL found in {py_file}: {token}"
