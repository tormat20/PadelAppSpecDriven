"""
Integration tests for spec 029-summary-screen-bugs.

Verifies that GET /events/{id}/summary returns mode="final" for events
that have been explicitly finished (EventStatus.FINISHED), even when
current_round_number < round_count (early-finish scenario).
"""


def _seed_players(client, prefix: str, count: int = 4) -> list[str]:
    return [
        client.post("/api/v1/players", json={"displayName": f"{prefix}-{i}"}).json()["id"]
        for i in range(count)
    ]


def _create_and_start_mexicano(client, name: str, player_ids: list[str]) -> str:
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": name,
            "eventType": "Mexicano",
            "eventDate": "2026-03-09",
            "selectedCourts": [1],
            "playerIds": player_ids,
        },
    ).json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    return event_id


def _create_and_start_americano(client, name: str, player_ids: list[str]) -> str:
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": name,
            "eventType": "Americano",
            "eventDate": "2026-03-09",
            "selectedCourts": [1],
            "playerIds": player_ids,
        },
    ).json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    return event_id


def _submit_round_scores(client, event_id: str) -> None:
    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    for match in current.json()["matches"]:
        res = client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json={"mode": "Mexicano", "team1Score": 14, "team2Score": 10},
        )
        assert res.status_code == 204


def _submit_americano_round_scores(client, event_id: str) -> None:
    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    for match in current.json()["matches"]:
        res = client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json={"mode": "Americano", "team1Score": 14, "team2Score": 10},
        )
        assert res.status_code == 204


# ─── Test 1: Mexicano early-finish → GET /summary returns mode="final" ─────────


def test_mexicano_early_finish_summary_returns_final_mode(client):
    """
    A Mexicano event finished after round 1 (of 6) must return mode="final"
    from GET /events/{id}/summary, not mode="progress".

    Before fix: is_final_summary_available() only checks
      current_round_number >= round_count (1 < 6 → False) → returns "progress".
    After fix: it also checks event.status == FINISHED → returns "final".
    """
    player_ids = _seed_players(client, "MEX-EARLY", 4)
    event_id = _create_and_start_mexicano(client, "Mexicano Early Finish Test", player_ids)

    # Submit round 1 results
    _submit_round_scores(client, event_id)

    # Finish the event early (before round_count is reached)
    finish_res = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_res.status_code == 200

    # Confirm the event is Finished
    event_res = client.get(f"/api/v1/events/{event_id}")
    assert event_res.json()["status"] == "Finished"

    # GET /summary must now return mode="final"
    summary_res = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_res.status_code == 200
    payload = summary_res.json()
    assert payload["mode"] == "final", (
        f"Expected mode='final' for finished Mexicano event, got mode='{payload['mode']}'. "
        "This is the bug fixed by checking event.status == FINISHED in is_final_summary_available()."
    )
    # Final summary must include playerRows and crownedPlayerIds (not just columns)
    assert "playerRows" in payload
    assert "crownedPlayerIds" in payload


# ─── Test 2: Americano early-finish → GET /summary returns mode="final" ────────


def test_americano_early_finish_summary_returns_final_mode(client):
    """
    An Americano event finished after round 1 must return mode="final"
    from GET /events/{id}/summary.
    """
    player_ids = _seed_players(client, "AME-EARLY", 4)
    event_id = _create_and_start_americano(client, "Americano Early Finish Test", player_ids)

    # Submit round 1 results
    _submit_americano_round_scores(client, event_id)

    # Finish the event early
    finish_res = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_res.status_code == 200

    # GET /summary must return mode="final"
    summary_res = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_res.status_code == 200
    payload = summary_res.json()
    assert payload["mode"] == "final", (
        f"Expected mode='final' for finished Americano event, got mode='{payload['mode']}'."
    )
    assert "playerRows" in payload
    assert "crownedPlayerIds" in payload


# ─── Test 3: Ongoing Mexicano (not yet finished) → GET /summary returns "progress" ─


def test_ongoing_mexicano_summary_returns_progress_mode(client):
    """
    An ongoing Mexicano event (not yet finished, and not yet at final round)
    must still return mode="progress" from GET /events/{id}/summary.

    This ensures the fix does not break the normal in-progress case.
    """
    player_ids = _seed_players(client, "MEX-ONGOING", 4)
    event_id = _create_and_start_mexicano(client, "Mexicano Ongoing Test", player_ids)

    # Submit round 1 results but do NOT finish or advance
    _submit_round_scores(client, event_id)

    # Event is still ongoing — do NOT call /finish
    summary_res = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_res.status_code == 200
    payload = summary_res.json()
    assert payload["mode"] == "progress", (
        f"Expected mode='progress' for ongoing Mexicano event, got mode='{payload['mode']}'."
    )
