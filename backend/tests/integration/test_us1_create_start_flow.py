def test_us1_create_start_flow(client):
    players = [
        client.post("/api/v1/players", json={"displayName": f"U1-{i}"}).json()["id"]
        for i in range(8)
    ]
    event = client.post(
        "/api/v1/events",
        json={
            "eventName": "US1 Flow",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    )
    assert event.status_code == 201
    event_id = event.json()["id"]
    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200
    assert len(started.json()["matches"]) == 2
