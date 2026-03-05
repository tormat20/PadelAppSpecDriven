from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.domain.auth import hash_password
from app.main import app


@pytest.fixture
def client(tmp_path: Path):
    """TestClient fixture pre-seeded with an admin user.

    All requests automatically carry a valid admin Bearer token so that
    protected write routes (POST /players, event mutations, rounds, etc.)
    work without modifying each test.
    """
    db_file = tmp_path / "test.duckdb"
    settings.db_path = str(db_file)

    with TestClient(app) as test_client:
        # Seed admin via register endpoint (role=user), then promote via
        # upsert_admin — but the simplest path is just to call register and
        # login, then switch role using the low-level upsert.
        #
        # Actually — register gives role=user.  We need role=admin.
        # Use the /auth/login flow after seeding via upsert_admin directly.
        from app.db.connection import get_connection
        from app.repositories.users_repo import UsersRepository

        admin_email = "test-admin@padel.test"
        admin_password = "testpassword1"

        with get_connection() as conn:
            repo = UsersRepository(conn)
            repo.upsert_admin(admin_email, hash_password(admin_password))

        login_resp = test_client.post(
            "/api/v1/auth/login",
            json={"email": admin_email, "password": admin_password},
        )
        assert login_resp.status_code == 200, f"Admin login failed in fixture: {login_resp.text}"
        token = login_resp.json()["access_token"]

        # Patch the client to send the token on every request
        test_client.headers.update({"Authorization": f"Bearer {token}"})

        yield test_client
