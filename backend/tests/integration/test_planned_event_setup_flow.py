def _seed_players(client, count=8):
    ids = []
    for i in range(count):
        ids.append(client.post("/api/v1/players", json={"displayName": f"PI{i}"}).json()["id"])
    return ids


def test_planned_to_ready_transition_and_start_flow(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Integrated Planned",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-30",
            "eventTime24h": "19:30",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    event = created.json()
    assert event["setupStatus"] == "planned"

    players = _seed_players(client, count=8)
    updated = client.patch(
        f"/api/v1/events/{event['id']}",
        json={
            "expectedVersion": event["version"],
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["setupStatus"] == "ready"

    started = client.post(f"/api/v1/events/{event['id']}/start")
    assert started.status_code == 200
    assert started.json()["round_number"] == 1
