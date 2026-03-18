"""Tests for player delete endpoints: per-player delete, reset stats, delete all."""


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _create_player(client, name="Test Player", email=None):
    payload = {"displayName": name}
    if email:
        payload["email"] = email
    resp = client.post("/api/v1/players", json=payload)
    assert resp.status_code == 201
    return resp.json()


def _get_non_admin_token(client):
    """Register a normal user and return their Bearer token."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "member@padel.test", "password": "memberpass1"},
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "member@padel.test", "password": "memberpass1"},
    )
    assert login.status_code == 200
    return login.json()["access_token"]


# ─── Test case 1: DELETE /players/{id} — 200, player is gone ──────────────────


def test_delete_player_returns_200_and_player_is_gone(client):
    player = _create_player(client, "Delete Me")
    player_id = player["id"]

    resp = client.delete(f"/api/v1/players/{player_id}")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

    # Player should no longer appear in search
    search = client.get("/api/v1/players")
    assert search.status_code == 200
    ids = [p["id"] for p in search.json()]
    assert player_id not in ids


# ─── Test case 2: DELETE /players/{id} — 404 for unknown ID ───────────────────


def test_delete_player_unknown_id_returns_404(client):
    resp = client.delete("/api/v1/players/nonexistent-id-99999")
    assert resp.status_code == 404


# ─── Test case 3: DELETE /players/{id} — 403 for non-admin ───────────────────


def test_delete_player_non_admin_returns_403(client):
    player = _create_player(client, "Protected Player")
    player_id = player["id"]

    non_admin_token = _get_non_admin_token(client)
    resp = client.delete(
        f"/api/v1/players/{player_id}",
        headers={"Authorization": f"Bearer {non_admin_token}"},
    )
    assert resp.status_code == 403


# ─── Test case 4: POST /admin/players/reset-stats — 200 ──────────────────────


def test_reset_stats_returns_200(client):
    resp = client.post("/api/v1/admin/players/reset-stats")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ─── Test case 5: POST /admin/players/reset-stats — 403 for non-admin ────────


def test_reset_stats_non_admin_returns_403(client):
    non_admin_token = _get_non_admin_token(client)
    resp = client.post(
        "/api/v1/admin/players/reset-stats",
        headers={"Authorization": f"Bearer {non_admin_token}"},
    )
    assert resp.status_code == 403


# ─── Test case 6: DELETE /admin/players — 200, player list is empty ──────────


def test_delete_all_players_returns_200_and_list_is_empty(client):
    _create_player(client, "Player One")
    _create_player(client, "Player Two")

    resp = client.delete("/api/v1/admin/players")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

    search = client.get("/api/v1/players")
    assert search.status_code == 200
    assert search.json() == []


# ─── Test case 7: DELETE /admin/players — 403 for non-admin ──────────────────


def test_delete_all_players_non_admin_returns_403(client):
    non_admin_token = _get_non_admin_token(client)
    resp = client.delete(
        "/api/v1/admin/players",
        headers={"Authorization": f"Bearer {non_admin_token}"},
    )
    assert resp.status_code == 403


# ─── Test case 8: DELETE /admin/players — idempotent when already empty ───────


def test_delete_all_players_when_already_empty_returns_200(client):
    # Ensure empty first
    client.delete("/api/v1/admin/players")

    # Call again — should still succeed
    resp = client.delete("/api/v1/admin/players")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
