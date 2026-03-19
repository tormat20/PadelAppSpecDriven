"""Tests for player update endpoint."""


def test_update_player_returns_200_and_persists_fields(client):
    created = client.post(
        "/api/v1/players",
        json={"displayName": "Anna Original", "email": "anna.original@example.com"},
    )
    assert created.status_code == 201
    player_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/players/{player_id}",
        json={"displayName": "Anna Updated", "email": "anna.updated@example.com"},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["id"] == player_id
    assert body["displayName"] == "Anna Updated"
    assert body["email"] == "anna.updated@example.com"


def test_update_player_returns_404_for_unknown_id(client):
    response = client.patch(
        "/api/v1/players/does-not-exist",
        json={"displayName": "Name", "email": "name@example.com"},
    )
    assert response.status_code == 404
