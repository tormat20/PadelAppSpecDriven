def test_us2_round_flow(client):
    players = [
        client.post("/api/v1/players", json={"displayName": f"U2-{i}"}).json()["id"]
        for i in range(8)
    ]
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "US2 Flow",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    ).json()["id"]
    client.post(f"/api/v1/events/{event_id}/start")
    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
    for match in current["matches"]:
        client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json={"mode": "Americano", "winningTeam": 1},
        )
    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200
