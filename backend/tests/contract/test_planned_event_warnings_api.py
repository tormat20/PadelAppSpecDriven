def test_past_datetime_warning_is_non_blocking(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Past Slot",
            "eventType": "WinnersCourt",
            "eventDate": "2020-01-01",
            "eventTime24h": "08:00",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["warnings"]["pastDateTime"] is True


def test_duplicate_slot_warning_when_same_name_date_time(client):
    first = client.post(
        "/api/v1/events",
        json={
            "eventName": "Club Night",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-20",
            "eventTime24h": "18:00",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/events",
        json={
            "eventName": "club night",
            "eventType": "WinnersCourt",
            "eventDate": "2026-03-20",
            "eventTime24h": "18:00",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert second.status_code == 201
    assert second.json()["warnings"]["duplicateSlot"] is True
    assert second.json()["warnings"]["duplicateCount"] >= 1
