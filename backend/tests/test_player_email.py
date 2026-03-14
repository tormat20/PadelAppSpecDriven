"""Tests for player email field: storage, retrieval, email-first dedup, and API responses."""


def test_create_player_with_email_returns_email(client):
    resp = client.post(
        "/api/v1/players", json={"displayName": "Alice Smith", "email": "alice@example.com"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["displayName"] == "Alice Smith"
    assert data["email"] == "alice@example.com"


def test_create_player_without_email_returns_null_email(client):
    resp = client.post("/api/v1/players", json={"displayName": "Bob Jones"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] is None


def test_get_player_includes_email(client):
    create = client.post(
        "/api/v1/players", json={"displayName": "Carol Davis", "email": "carol@example.com"}
    )
    player_id = create.json()["id"]

    resp = client.get(f"/api/v1/players/{player_id}")
    assert resp.status_code == 200
    assert resp.json()["email"] == "carol@example.com"


def test_list_players_includes_email(client):
    client.post("/api/v1/players", json={"displayName": "Dana White", "email": "dana@example.com"})

    resp = client.get("/api/v1/players")
    assert resp.status_code == 200
    players = resp.json()
    dana = next((p for p in players if p["displayName"] == "Dana White"), None)
    assert dana is not None
    assert dana["email"] == "dana@example.com"


def test_email_dedup_returns_existing_player(client):
    """Creating a player with the same email as an existing one returns the existing player."""
    first = client.post(
        "/api/v1/players", json={"displayName": "Eric Nord", "email": "eric@example.com"}
    )
    assert first.status_code == 201
    original_id = first.json()["id"]

    # Same email, different name
    second = client.post(
        "/api/v1/players", json={"displayName": "Erik Nordstrom", "email": "eric@example.com"}
    )
    assert second.status_code == 201
    assert second.json()["id"] == original_id
    assert second.json()["displayName"] == "Eric Nord"  # original name preserved


def test_email_dedup_case_insensitive(client):
    """Email dedup is case-insensitive."""
    first = client.post(
        "/api/v1/players", json={"displayName": "Fiona Green", "email": "fiona@example.com"}
    )
    original_id = first.json()["id"]

    second = client.post(
        "/api/v1/players", json={"displayName": "Fiona Green 2", "email": "FIONA@EXAMPLE.COM"}
    )
    assert second.json()["id"] == original_id


def test_null_email_does_not_trigger_dedup(client):
    """Two players with no email are allowed to coexist."""
    first = client.post("/api/v1/players", json={"displayName": "Ghost One"})
    second = client.post("/api/v1/players", json={"displayName": "Ghost Two"})
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] != second.json()["id"]
