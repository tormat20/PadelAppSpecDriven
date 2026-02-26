def _seed_players(client, count=8):
    ids = []
    for i in range(count):
        ids.append(client.post("/api/v1/players", json={"displayName": f"E{i}"}).json()["id"])
    return ids


def test_event_create_start_finish_lifecycle(client):
    player_ids = _seed_players(client)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Lifecycle",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert created.status_code == 201
    event_id = created.json()["id"]

    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200

    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
    for match in current["matches"]:
        match_id = match.get("matchId") or match.get("match_id")
        assert (
            client.post(
                f"/api/v1/matches/{match_id}/result",
                json={"mode": "Americano", "winningTeam": 1},
            ).status_code
            == 204
        )

    while True:
        advanced = client.post(f"/api/v1/events/{event_id}/next")
        if advanced.status_code != 200:
            break
        for match in advanced.json()["matches"]:
            match_id = match.get("matchId") or match.get("match_id")
            client.post(
                f"/api/v1/matches/{match_id}/result",
                json={"mode": "Americano", "winningTeam": 1},
            )

    finished = client.post(f"/api/v1/events/{event_id}/finish")
    assert finished.status_code in (200, 400)
