def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"P{i}"})
        players.append(res.json()["id"])
    return players


def test_create_fetch_start_current_round(client):
    player_ids = _seed_players(client)
    create = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Night",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 200
    assert fetched.json()["status"] == "Lobby"

    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200

    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    assert current.json()["roundNumber"] == 1
