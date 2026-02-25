def _seed_players(client, count=8):
    player_ids = []
    for i in range(count):
        player_ids.append(
            client.post("/api/v1/players", json={"displayName": f"R{i}"}).json()["id"]
        )
    return player_ids


def test_submit_result_and_next(client):
    player_ids = _seed_players(client)
    event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Round Test",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()
    event_id = event["id"]
    client.post(f"/api/v1/events/{event_id}/start")
    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    blocked = client.post(f"/api/v1/events/{event_id}/next")
    assert blocked.status_code == 400

    for match in current["matches"]:
        result = client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json={"mode": "Americano", "winningTeam": 1},
        )
        assert result.status_code == 204

    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200
    assert advanced.json()["round_number"] == 2
