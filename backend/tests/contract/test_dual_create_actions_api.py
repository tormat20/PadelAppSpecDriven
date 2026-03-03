def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"D{i}"})
        players.append(res.json()["id"])
    return players


def test_create_event_requires_strict_setup(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Strict create",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-01",
            "eventTime24h": "18:00",
            "createAction": "create_event",
            "selectedCourts": [1],
            "playerIds": [],
        },
    )
    assert created.status_code == 400
    assert "Event setup incomplete" in created.json()["detail"]


def test_create_event_slot_ignores_setup_selections(client):
    players = _seed_players(client, count=4)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Slot create",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-01",
            "eventTime24h": "19:00",
            "createAction": "create_event_slot",
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["setupStatus"] == "planned"
    assert payload["selectedCourts"] == []
    assert payload["playerIds"] == []


def test_create_event_with_complete_setup_is_ready(client):
    players = _seed_players(client, count=4)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Ready create",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-02",
            "eventTime24h": "20:00",
            "createAction": "create_event",
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["setupStatus"] == "ready"
