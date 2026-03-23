def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"P{i}"})
        players.append(res.json()["id"])
    return players


def test_create_fetch_start_current_round(client):
    player_ids = _seed_players(client)
    create = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Night",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 200
    assert fetched.json()["status"] == "Lobby"

    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200

    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    assert current.json()["roundNumber"] == 1


def test_start_event_returns_current_round_when_already_running(client):
    player_ids = _seed_players(client)
    create = client.post(
        "/api/v1/events",
        json={
            "eventName": "Idempotent Start",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]

    first_start = client.post(f"/api/v1/events/{event_id}/start")
    assert first_start.status_code == 200

    second_start = client.post(f"/api/v1/events/{event_id}/start")
    assert second_start.status_code == 200
    assert second_start.json()["round_number"] == 1
    assert len(second_start.json()["matches"]) == len(first_start.json()["matches"])


def test_delete_event_removes_event_and_related_access(client):
    player_ids = _seed_players(client)
    create = client.post(
        "/api/v1/events",
        json={
            "eventName": "Delete Me",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]

    deleted = client.delete(f"/api/v1/events/{event_id}")
    assert deleted.status_code == 204

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 404

    current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current_round.status_code == 404


def test_restart_event_clears_runtime_and_reverts_to_ready(client):
    player_ids = _seed_players(client)
    create = client.post(
        "/api/v1/events",
        json={
            "eventName": "Restartable",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]

    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200

    restarted = client.post(f"/api/v1/events/{event_id}/restart")
    assert restarted.status_code == 200
    body = restarted.json()
    assert body["status"] == "Lobby"
    assert body["setupStatus"] == "ready"
    assert body["lifecycleStatus"] == "ready"

    current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current_round.status_code == 404


def test_delete_all_events_removes_all_created_events(client):
    player_ids = _seed_players(client)

    first = client.post(
        "/api/v1/events",
        json={
            "eventName": "Delete all one",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-01",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    second = client.post(
        "/api/v1/events",
        json={
            "eventName": "Delete all two",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-02",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )

    assert first.status_code == 201
    assert second.status_code == 201

    deleted = client.delete("/api/v1/events")
    assert deleted.status_code == 200
    assert deleted.json()["status"] == "deleted"
    assert deleted.json()["deletedCount"] >= 2

    listed = client.get("/api/v1/events")
    assert listed.status_code == 200
    assert listed.json() == []


def test_popup_save_returns_version_conflict_when_expected_version_is_stale(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Versioned popup",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-10",
            "eventTime24h": "10:00",
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
            "eventName": "Versioned popup updated",
        },
    )
    assert updated.status_code == 200
    current_version = updated.json()["version"]

    stale_popup_save = client.post(
        f"/api/v1/events/{event['id']}/popup-save",
        json={
            "expectedVersion": event["version"],
            "eventTime24h": "11:00",
        },
    )
    assert stale_popup_save.status_code == 409
    assert stale_popup_save.json()["detail"]["code"] == "EVENT_VERSION_CONFLICT"
    assert stale_popup_save.json()["detail"]["currentVersion"] == current_version
