def _seed_players(client, count=8):
    ids = []
    for i in range(count):
        ids.append(client.post("/api/v1/players", json={"displayName": f"PS{i}"}).json()["id"])
    return ids


def test_create_planned_slot_with_planning_fields_only(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Planned Tuesday",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-10",
            "eventTime24h": "18:30",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["setupStatus"] == "planned"
    assert "courts_required" in payload["missingRequirements"]
    assert payload["version"] == 1


def test_create_ready_when_players_match_courts_rule(client):
    players = _seed_players(client, count=4)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Ready Event",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-11",
            "eventTime24h": "19:00",
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["setupStatus"] == "ready"
    assert payload["missingRequirements"] == []


def test_update_event_requires_matching_expected_version(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Versioned",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-12",
            "eventTime24h": "20:00",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    event = created.json()

    updated = client.patch(
        f"/api/v1/events/{event['id']}",
        json={"expectedVersion": event["version"], "eventName": "Versioned Updated"},
    )
    assert updated.status_code == 200
    assert updated.json()["version"] == event["version"] + 1

    stale = client.patch(
        f"/api/v1/events/{event['id']}",
        json={"expectedVersion": event["version"], "eventName": "Stale Save"},
    )
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "EVENT_VERSION_CONFLICT"
