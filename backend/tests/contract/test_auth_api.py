"""
Auth contract tests — covers all auth API behaviours:

- US1: Admin login (T032)
- US2: Bootstrap / upsert_admin (T033)
- US3: Self-signup (T035-T037)
- US4: Public access — no token required for public routes (T034)
- US5: Session / token edge-cases (T038-T041)
- Protected write routes return 401/403 without valid token (T042)
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.domain.auth import hash_password
from app.main import app


@pytest.fixture
def anon_client(tmp_path):
    """TestClient with no auth header — anonymous access."""
    settings.db_path = str(tmp_path / "auth_test.duckdb")
    with TestClient(app) as c:
        yield c


@pytest.fixture
def seeded_admin(anon_client):
    """Seed an admin user via upsert_admin and return (client, token)."""
    from app.db.connection import get_connection
    from app.repositories.users_repo import UsersRepository

    email = "admin@example.com"
    password = "securepassword1"
    with get_connection() as conn:
        repo = UsersRepository(conn)
        repo.upsert_admin(email, hash_password(password))

    resp = anon_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return anon_client, token


# ---------------------------------------------------------------------------
# US1 — Admin login
# ---------------------------------------------------------------------------


def test_admin_login_returns_token(seeded_admin):
    _, token = seeded_admin
    assert isinstance(token, str) and len(token) > 10


def test_me_endpoint_returns_admin_role(seeded_admin):
    client, token = seeded_admin
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"


def test_login_wrong_password_returns_401(seeded_admin):
    client, _ = seeded_admin
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_returns_401(anon_client):
    resp = anon_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "somepassword"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# US2 — upsert_admin (CLI bootstrap idempotency)
# ---------------------------------------------------------------------------


def test_upsert_admin_twice_updates_password(anon_client):
    """Running seed_admin twice with same email should reset password."""
    from app.db.connection import get_connection
    from app.repositories.users_repo import UsersRepository

    email = "admin2@example.com"
    with get_connection() as conn:
        repo = UsersRepository(conn)
        repo.upsert_admin(email, hash_password("firstpassword1"))
        repo.upsert_admin(email, hash_password("newpassword1"))

    # Old password should now fail
    resp_old = anon_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "firstpassword1"}
    )
    assert resp_old.status_code == 401

    # New password should succeed
    resp_new = anon_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "newpassword1"}
    )
    assert resp_new.status_code == 200


def test_upsert_admin_sets_role_admin(anon_client):
    from app.db.connection import get_connection
    from app.repositories.users_repo import UsersRepository

    email = "admin3@example.com"
    with get_connection() as conn:
        repo = UsersRepository(conn)
        repo.upsert_admin(email, hash_password("adminpassword1"))

    resp = anon_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "adminpassword1"}
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    me = anon_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["role"] == "admin"


# ---------------------------------------------------------------------------
# US3 — Self-signup
# ---------------------------------------------------------------------------


def test_register_returns_token(anon_client):
    resp = anon_client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "userpassword1"},
    )
    assert resp.status_code == 201
    assert "access_token" in resp.json()


def test_register_sets_role_user(anon_client):
    resp = anon_client.post(
        "/api/v1/auth/register",
        json={"email": "user42@example.com", "password": "userpassword1"},
    )
    token = resp.json()["access_token"]
    me = anon_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["role"] == "user"


def test_register_duplicate_email_returns_409(anon_client):
    payload = {"email": "dup@example.com", "password": "somepassword1"}
    anon_client.post("/api/v1/auth/register", json=payload)
    resp = anon_client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_short_password_returns_400(anon_client):
    resp = anon_client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "abc"},
    )
    assert resp.status_code == 400


def test_register_invalid_email_returns_400(anon_client):
    resp = anon_client.post(
        "/api/v1/auth/register",
        json={"email": "notanemail", "password": "validpassword1"},
    )
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# US4 — Public routes accessible without any token
# ---------------------------------------------------------------------------


def test_home_leaderboard_is_public(anon_client):
    resp = anon_client.get("/api/v1/leaderboards/player-of-month")
    assert resp.status_code == 200


def test_players_search_is_public(anon_client):
    resp = anon_client.get("/api/v1/players")
    assert resp.status_code == 200


def test_player_stats_is_public(anon_client):
    """Player stats route is public; 404 on unknown id is fine."""
    resp = anon_client.get("/api/v1/players/nonexistent-id/stats")
    # 404 is expected for an unknown player — just not 401
    assert resp.status_code != 401


# ---------------------------------------------------------------------------
# US5 — Protected route access control
# ---------------------------------------------------------------------------


def test_post_player_without_token_returns_401(anon_client):
    resp = anon_client.post("/api/v1/players", json={"displayName": "Ghost"})
    assert resp.status_code == 401


def test_post_player_with_user_token_returns_403(anon_client):
    """role=user cannot create players (admin only)."""
    reg = anon_client.post(
        "/api/v1/auth/register",
        json={"email": "regularuser@example.com", "password": "userpassword1"},
    )
    token = reg.json()["access_token"]
    resp = anon_client.post(
        "/api/v1/players",
        json={"displayName": "Blocked"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_post_event_without_token_returns_401(anon_client):
    resp = anon_client.post("/api/v1/events", json={})
    assert resp.status_code == 401


def test_me_without_token_returns_401(anon_client):
    resp = anon_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_invalid_token_returns_401(anon_client):
    resp = anon_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.valid.token"},
    )
    assert resp.status_code == 401
