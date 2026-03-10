"""
T009 — verify the date-range filter on GET /api/v1/events?from=...&to=...
"""

import pytest


@pytest.fixture
def seed_events(client):
    """Create three events on different dates and return their response data."""
    dates = [
        ("Event Mar 08", "2026-03-08"),
        ("Event Mar 11", "2026-03-11"),
        ("Event Mar 20", "2026-03-20"),
    ]
    created = []
    for name, d in dates:
        resp = client.post(
            "/api/v1/events",
            json={
                "eventName": name,
                "eventType": "WinnersCourt",
                "eventDate": d,
                "eventTime24h": "18:00",
                "createAction": "create_event_slot",
                "selectedCourts": [],
                "playerIds": [],
            },
        )
        assert resp.status_code == 201, resp.text
        created.append(resp.json())
    return created


def test_no_params_returns_all_events(client, seed_events):
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    assert len(resp.json()) == len(seed_events)


def test_date_range_filters_correctly(client, seed_events):
    """Events on 2026-03-08, 2026-03-11, 2026-03-20 — range 03-09 to 03-15 should return only 03-11."""
    resp = client.get("/api/v1/events?from=2026-03-09&to=2026-03-15")
    assert resp.status_code == 200
    returned_dates = {e["eventDate"] for e in resp.json()}
    assert "2026-03-11" in returned_dates
    assert "2026-03-08" not in returned_dates
    assert "2026-03-20" not in returned_dates
    assert len(resp.json()) == 1


def test_date_range_inclusive_lower_bound(client, seed_events):
    """event_date=2026-03-08 is included when from=2026-03-08."""
    resp = client.get("/api/v1/events?from=2026-03-08&to=2026-03-08")
    assert resp.status_code == 200
    returned_dates = {e["eventDate"] for e in resp.json()}
    assert "2026-03-08" in returned_dates
    assert len(resp.json()) == 1


def test_date_range_inclusive_upper_bound(client, seed_events):
    """event_date=2026-03-20 is included when to=2026-03-20."""
    resp = client.get("/api/v1/events?from=2026-03-20&to=2026-03-20")
    assert resp.status_code == 200
    returned_dates = {e["eventDate"] for e in resp.json()}
    assert "2026-03-20" in returned_dates
    assert len(resp.json()) == 1


def test_date_range_no_match_returns_empty_list(client, seed_events):
    """A range with no matching events returns an empty list."""
    resp = client.get("/api/v1/events?from=2025-01-01&to=2025-01-07")
    assert resp.status_code == 200
    assert resp.json() == []


def test_invalid_date_format_returns_422(client):
    resp = client.get("/api/v1/events?from=not-a-date&to=also-not")
    assert resp.status_code == 422


def test_only_from_returns_all_events(client, seed_events):
    """Only one param provided → falls back to list_all (backward compat)."""
    resp = client.get("/api/v1/events?from=2026-03-01")
    assert resp.status_code == 200
    assert len(resp.json()) == len(seed_events)


def test_only_to_returns_all_events(client, seed_events):
    """Only 'to' param provided → falls back to list_all."""
    resp = client.get("/api/v1/events?to=2026-03-31")
    assert resp.status_code == 200
    assert len(resp.json()) == len(seed_events)
