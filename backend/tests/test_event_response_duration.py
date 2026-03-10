"""
T005 — verify roundDurationMinutes is present and correct in the API response
for all event endpoints that return EventResponse.
"""

import pytest


@pytest.fixture
def seed_event(client):
    """Create a minimal event and return its response data."""
    resp = client.post(
        "/api/v1/events",
        json={
            "eventName": "Duration Test Event",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-15",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_event_includes_round_duration_minutes(client):
    resp = client.post(
        "/api/v1/events",
        json={
            "eventName": "Create Duration Test",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-15",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "roundDurationMinutes" in data
    assert isinstance(data["roundDurationMinutes"], int)
    assert data["roundDurationMinutes"] > 0


def test_list_events_includes_round_duration_minutes(client, seed_event):
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert "roundDurationMinutes" in data[0]
    assert isinstance(data[0]["roundDurationMinutes"], int)


def test_get_event_includes_round_duration_minutes(client, seed_event):
    event_id = seed_event["id"]
    resp = client.get(f"/api/v1/events/{event_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "roundDurationMinutes" in data
    assert isinstance(data["roundDurationMinutes"], int)
    assert data["roundDurationMinutes"] > 0


def test_winners_court_round_duration_is_15(client):
    resp = client.post(
        "/api/v1/events",
        json={
            "eventName": "WC Duration Check",
            "eventType": "WinnersCourt",
            "eventDate": "2026-04-15",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["roundDurationMinutes"] == 15


def test_ranked_box_round_duration_is_30(client):
    resp = client.post(
        "/api/v1/events",
        json={
            "eventName": "RB Duration Check",
            "eventType": "RankedBox",
            "eventDate": "2026-04-15",
            "eventTime24h": "18:00",
            "createAction": "create_event_slot",
            "selectedCourts": [],
            "playerIds": [],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["roundDurationMinutes"] == 30
