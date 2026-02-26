def _seed_players(client, count=8):
    return [
        client.post("/api/v1/players", json={"displayName": f"Q{i}"}).json()["id"]
        for i in range(count)
    ]


def test_rounds_current_and_next_behaviors(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Rounds",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    assert "matches" in current.json()

    blocked = client.post(f"/api/v1/events/{event_id}/next")
    assert blocked.status_code == 400
