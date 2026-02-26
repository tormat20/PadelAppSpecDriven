def test_event_data_persists_across_api_reads(client):
    players = []
    for i in range(8):
        created = client.post("/api/v1/players", json={"displayName": f"I{i}"})
        players.append(created.json()["id"])

    created_event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Integration Repo",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    )
    event_id = created_event.json()["id"]

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 200
    assert fetched.json()["eventName"] == "Integration Repo"
