def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"I{i}"})
        players.append(res.json()["id"])
    return players


def test_slot_create_then_edit_to_ready_and_start(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Integrated dual flow",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-10",
            "eventTime24h": "18:30",
            "createAction": "create_event_slot",
            "selectedCourts": [1],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    event = created.json()
    assert event["setupStatus"] == "planned"

    players = _seed_players(client, count=4)
    updated = client.patch(
        f"/api/v1/events/{event['id']}",
        json={
            "expectedVersion": event["version"],
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["setupStatus"] == "ready"

    started = client.post(f"/api/v1/events/{event['id']}/start")
    assert started.status_code == 200
