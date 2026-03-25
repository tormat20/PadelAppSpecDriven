def test_create_and_get_player(client):
    created = client.post("/api/v1/players", json={"displayName": "alice"})
    assert created.status_code == 201
    player = created.json()
    assert player["displayName"] == "Alice"
    fetched = client.get(f"/api/v1/players/{player['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["displayName"] == "Alice"


def test_search_players(client):
    client.post("/api/v1/players", json={"displayName": "Bob"})
    client.post("/api/v1/players", json={"displayName": "Bobby"})
    response = client.get("/api/v1/players", params={"query": "Bob"})
    assert response.status_code == 200
    assert len(response.json()) >= 2


def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"Player {i}"})
        assert res.status_code == 201
        players.append(res.json()["id"])
    return players


def test_update_player_works_when_player_is_referenced_by_event_tables(client):
    player_ids = _seed_players(client)
    target_player_id = player_ids[0]

    created_event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Update Referenced Player",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-25",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert created_event.status_code == 201

    updated = client.patch(
        f"/api/v1/players/{target_player_id}",
        json={"displayName": "Mikael Andersson", "email": "micke0522@gmail.com"},
    )

    assert updated.status_code == 200
    body = updated.json()
    assert body["id"] == target_player_id
    assert body["displayName"] == "Mikael Andersson"
    assert body["email"] == "micke0522@gmail.com"
