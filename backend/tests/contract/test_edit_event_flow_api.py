def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"E{i}"})
        players.append(res.json()["id"])
    return players


def test_edit_save_allows_incomplete_setup_and_keeps_planned(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Edit me",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-03",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    event = created.json()

    updated = client.patch(
        f"/api/v1/events/{event['id']}",
        json={
            "expectedVersion": event["version"],
            "selectedCourts": [1],
            "playerIds": [],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["setupStatus"] == "planned"


def test_edit_save_to_complete_setup_turns_ready_and_start_allowed(client):
    players = _seed_players(client, count=4)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Edit to ready",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-04",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    event = created.json()

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
