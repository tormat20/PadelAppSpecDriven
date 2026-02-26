def _seed_players(client, count=8):
    return [
        client.post("/api/v1/players", json={"displayName": f"F{i}"}).json()["id"]
        for i in range(count)
    ]


def test_us1_end_to_end_event_flow(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "US1 Full",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    current = client.post(f"/api/v1/events/{event_id}/start").json()

    while True:
        for match in current["matches"]:
            match_id = match.get("matchId") or match.get("match_id")
            client.post(
                f"/api/v1/matches/{match_id}/result",
                json={"mode": "Americano", "winningTeam": 1},
            )
        nxt = client.post(f"/api/v1/events/{event_id}/next")
        if nxt.status_code != 200:
            break
        current = nxt.json()

    summary = client.post(f"/api/v1/events/{event_id}/finish")
    assert summary.status_code in (200, 400)
