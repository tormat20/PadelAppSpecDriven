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


def test_staged_save_batches_create_and_update(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Batch base",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-05",
            "eventTime24h": "09:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    base_event = created.json()

    staged = client.post(
        "/api/v1/events/staged-save",
        json={
            "creates": [
                {
                    "eventName": "Batch created",
                    "eventType": "Americano",
                    "eventDate": "2026-04-06",
                    "eventTime24h": "10:30",
                    "eventDurationMinutes": 90,
                    "selectedCourts": [],
                    "playerIds": [],
                    "isTeamMexicano": False,
                }
            ],
            "updates": [
                {
                    "eventId": base_event["id"],
                    "expectedVersion": base_event["version"],
                    "eventName": "Batch updated",
                    "eventTime24h": "11:00",
                }
            ],
            "deletes": [],
        },
    )
    assert staged.status_code == 200
    assert staged.json() == {
        "status": "saved",
        "createdCount": 1,
        "updatedCount": 1,
        "deletedCount": 0,
    }

    events = client.get("/api/v1/events")
    assert events.status_code == 200
    names = [event["eventName"] for event in events.json()]
    assert "Batch created" in names
    assert "Batch updated" in names


def test_staged_save_rolls_back_on_version_conflict(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Conflict base",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-07",
            "eventTime24h": "12:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    base_event = created.json()

    staged = client.post(
        "/api/v1/events/staged-save",
        json={
            "creates": [
                {
                    "eventName": "Should rollback",
                    "eventType": "Americano",
                    "eventDate": "2026-04-08",
                    "eventTime24h": "13:30",
                    "eventDurationMinutes": 90,
                    "selectedCourts": [],
                    "playerIds": [],
                    "isTeamMexicano": False,
                }
            ],
            "updates": [
                {
                    "eventId": base_event["id"],
                    "expectedVersion": base_event["version"] + 1,
                    "eventName": "Conflict update",
                }
            ],
            "deletes": [],
        },
    )
    assert staged.status_code == 409
    assert staged.json()["detail"]["code"] == "EVENT_VERSION_CONFLICT"

    events = client.get("/api/v1/events")
    assert events.status_code == 200
    names = [event["eventName"] for event in events.json()]
    assert "Should rollback" not in names
    assert "Conflict base" in names


def test_popup_save_endpoint_persists_immediately(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Popup target",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-09",
            "eventTime24h": "10:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    event = created.json()

    saved = client.post(
        f"/api/v1/events/{event['id']}/popup-save",
        json={
            "expectedVersion": event["version"],
            "eventName": "Popup persisted",
            "eventTime24h": "11:30",
            "selectedCourts": [1, 2],
        },
    )
    assert saved.status_code == 200
    body = saved.json()
    assert body["eventName"] == "Popup persisted"
    assert body["eventTime24h"] == "11:30"
    assert body["selectedCourts"] == [1, 2]
    assert body["version"] == event["version"] + 1
