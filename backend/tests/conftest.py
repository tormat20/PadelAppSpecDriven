from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def client(tmp_path: Path):
    db_file = tmp_path / "test.duckdb"
    settings.db_path = str(db_file)
    with TestClient(app) as test_client:
        yield test_client
