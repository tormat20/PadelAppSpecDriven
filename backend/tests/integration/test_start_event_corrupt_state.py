"""
Integration test for US1: starting an event whose status is corrupt
(status='Lobby' but rounds already exist) must succeed, not raise
EVENT_ALREADY_STARTED.

This test is written FIRST (TDD) and must FAIL before T006 lands.
"""

import uuid


def _seed_players(client, count=4):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"CorruptP{i}"})
        assert res.status_code == 201, res.text
        players.append(res.json()["id"])
    return players


def test_start_event_in_corrupt_lobby_state_with_existing_rounds(client):
    """
    Scenario: An event is in status='Lobby' (setupStatus='ready') but already
    has a round row — a corrupt state caused by a previous bug.

    Expected: calling POST /events/{id}/start returns 200 with event_id and
    round_number, and the event status in the DB is now 'Running'.
    """
    players = _seed_players(client, count=4)

    # 1. Create the event slot (planned, no players/courts yet)
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Corrupt State Test",
            "eventType": "WinnersCourt",
            "eventDate": "2026-05-01",
            "eventTime24h": "19:00",
            "createAction": "create_event_slot",
            "selectedCourts": [1],
            "playerIds": [],
        },
    )
    assert created.status_code == 201, created.text
    event = created.json()
    event_id = event["id"]
    assert event["setupStatus"] == "planned"

    # 1b. Patch courts + players to move to ready
    patched = client.patch(
        f"/api/v1/events/{event_id}",
        json={
            "expectedVersion": event["version"],
            "selectedCourts": [1],
            "playerIds": players,
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["setupStatus"] == "ready"

    # 2. Start it once to create the round rows (status becomes Running)
    started_first = client.post(f"/api/v1/events/{event_id}/start")
    assert started_first.status_code == 200, started_first.text

    # 3. Corrupt the event: manually set status back to 'Lobby' via the DB.
    #    We use the debug/internal route if available, otherwise patch directly
    #    through the test client's DB access.
    #    The test uses the low-level DB connection available via the DI scope.
    from app.db.connection import get_connection

    with get_connection() as conn:
        conn.execute(
            "UPDATE events SET status = 'Lobby' WHERE id = ?",
            [event_id],
        )

    # Verify the corruption is in place
    with get_connection() as conn:
        row = conn.execute("SELECT status FROM events WHERE id = ?", [event_id]).fetchone()
    assert row[0] == "Lobby", f"Expected corrupt 'Lobby' status, got {row[0]}"

    # 4. Now call start_event again — this should recover gracefully (NOT raise)
    response = client.post(f"/api/v1/events/{event_id}/start")
    assert response.status_code == 200, (
        f"Expected 200 OK for corrupt-state recovery, got {response.status_code}: {response.text}"
    )
    body = response.json()
    assert "event_id" in body, f"Missing event_id in response: {body}"
    assert "round_number" in body, f"Missing round_number in response: {body}"
    assert body["event_id"] == event_id

    # 5. Verify event status is now Running in the DB
    with get_connection() as conn:
        row = conn.execute("SELECT status FROM events WHERE id = ?", [event_id]).fetchone()
    assert row[0] == "Running", f"Expected event status 'Running' after recovery, got {row[0]}"
