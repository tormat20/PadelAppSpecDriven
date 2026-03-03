def _seed_players(client, count=4):
    ids = []
    for i in range(count):
        ids.append(client.post("/api/v1/players", json={"displayName": f"PR{i}"}).json()["id"])
    return ids


def test_start_blocks_when_event_setup_is_incomplete(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Incomplete Event",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-15",
            "eventTime24h": "18:00",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201

    started = client.post(f"/api/v1/events/{created.json()['id']}/start")
    assert started.status_code == 409
    assert started.json()["detail"]["code"] == "EVENT_NOT_READY"


def test_status_reverts_to_planned_after_invalid_update(client):
    players = _seed_players(client)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Flexible Event",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-15",
            "eventTime24h": "18:00",
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert created.status_code == 201
    event = created.json()
    assert event["setupStatus"] == "ready"

    changed = client.patch(
        f"/api/v1/events/{event['id']}",
        json={
            "expectedVersion": event["version"],
            "selectedCourts": [1, 2],
        },
    )
    assert changed.status_code == 200
    assert changed.json()["setupStatus"] == "planned"
    assert any(req.startswith("players_exact_") for req in changed.json()["missingRequirements"])
