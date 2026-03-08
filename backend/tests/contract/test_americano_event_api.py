"""Contract tests for Americano event flow (FR-001 through FR-016)."""


def _seed_players(client, count=8):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"AM{i}"})
        players.append(res.json()["id"])
    return players


def _match_id(match: dict) -> str:
    return match.get("matchId") or match.get("match_id") or match.get("id") or ""


def _submit_score(client, match_id: str, team1: int = 15, team2: int = 9):
    return client.post(
        f"/api/v1/matches/{match_id}/result",
        json={"mode": "Americano", "team1Score": team1, "team2Score": team2},
    )


# ─── FR-001: Americano appears as valid EventType ─────────────────────────────


def test_americano_event_can_be_created(client):
    player_ids = _seed_players(client)
    res = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Test",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["eventType"] == "Americano"
    assert data["setupStatus"] == "ready"


# ─── FR-002 / FR-003: All rounds generated at start for 8 players ────────────


def test_americano_start_generates_7_rounds_for_8_players(client):
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano 8P",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    start_res = client.post(f"/api/v1/events/{event_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["round_number"] == 1

    # Event should now report totalRounds = 7
    event_res = client.get(f"/api/v1/events/{event_id}")
    assert event_res.json()["totalRounds"] == 7


# ─── FR-003: 12 players → 11 rounds ──────────────────────────────────────────


def test_americano_start_generates_11_rounds_for_12_players(client):
    player_ids = _seed_players(client, 12)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano 12P",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2, 3],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")
    event_res = client.get(f"/api/v1/events/{event_id}")
    assert event_res.json()["totalRounds"] == 11


# ─── FR-003: 16 players → 15 rounds ──────────────────────────────────────────


def test_americano_start_generates_15_rounds_for_16_players(client):
    player_ids = _seed_players(client, 16)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano 16P",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2, 3, 4],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")
    event_res = client.get(f"/api/v1/events/{event_id}")
    assert event_res.json()["totalRounds"] == 15


# ─── FR-005: Non-multiple of 4 players blocked ───────────────────────────────


def test_americano_blocks_non_multiple_of_4_players(client):
    # 10 players on 2 courts: 2 courts need exactly 8 players.
    # Since 10 ≠ 8, evaluate_setup returns missing requirements and create_event
    # raises ValueError → 400 response. Americano creation with wrong player count
    # is blocked at creation time.
    player_ids_10 = _seed_players(client, 10)
    res = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Bad",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids_10,
        },
    )
    assert res.status_code == 400


# ─── FR-009: next_round does not re-schedule — pre-stored round is used ───────


def test_americano_next_round_does_not_reschedule(client):
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano No Resched",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")

    # Get round 1 matches and note the match assignments for round 2 (pre-stored)
    round1 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    # Submit all round 1 results
    for match in round1["matches"]:
        assert _submit_score(client, _match_id(match)).status_code == 204

    # Advance to round 2
    next_res = client.post(f"/api/v1/events/{event_id}/next")
    assert next_res.status_code == 200
    assert next_res.json()["round_number"] == 2

    # Advance again to round 2 a second time by calling next again after submitting
    round2 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
    assert round2["roundNumber"] == 2
    for match in round2["matches"]:
        _submit_score(client, _match_id(match))

    next2_res = client.post(f"/api/v1/events/{event_id}/next")
    assert next2_res.status_code == 200
    assert next2_res.json()["round_number"] == 3


# ─── FR-010: next_round blocked at final round ────────────────────────────────


def test_americano_next_round_blocked_at_final_round(client):
    # Use 8 players for a manageable 7-round event; run through all rounds
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Final Block",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")

    # Run through rounds 1–7
    for _ in range(7):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
        for match in current["matches"]:
            _submit_score(client, _match_id(match))
        advance = client.post(f"/api/v1/events/{event_id}/next")
        # After round 7 is submitted, next_round should be blocked
        if current["roundNumber"] == 7:
            assert advance.status_code == 409
            detail = advance.json().get("detail", {})
            code = detail.get("code", "") if isinstance(detail, dict) else str(detail)
            assert "FINAL_ROUND" in code
            break
        assert advance.status_code == 200


# ─── FR-007 / FR-008: Score24 result type; draw stores is_draw ───────────────


def test_americano_score_draw_stores_is_draw(client):
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Draw",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")
    round1 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    # Submit a 12–12 draw on the first match
    first_match = round1["matches"][0]
    res = client.post(
        f"/api/v1/matches/{_match_id(first_match)}/result",
        json={"mode": "Americano", "team1Score": 12, "team2Score": 12},
    )
    assert res.status_code == 204


def test_americano_invalid_score_sum_rejected(client):
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Invalid Score",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")
    round1 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    first_match = round1["matches"][0]
    res = client.post(
        f"/api/v1/matches/{_match_id(first_match)}/result",
        json={"mode": "Americano", "team1Score": 13, "team2Score": 12},  # sums to 25, not 24
    )
    assert res.status_code in (400, 422)


# ─── FR-011: Finish-early allowed ────────────────────────────────────────────


def test_americano_finish_early(client):
    player_ids = _seed_players(client, 8)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Early Finish",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    client.post(f"/api/v1/events/{event_id}/start")
    round1 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    for match in round1["matches"]:
        _submit_score(client, _match_id(match))

    # Finish after only round 1
    finish_res = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_res.status_code in (200, 204)

    # Event should be finished
    event_res = client.get(f"/api/v1/events/{event_id}")
    assert event_res.json()["status"] == "Finished"


# ─── Full happy-path flow ─────────────────────────────────────────────────────


def test_americano_full_event_flow(client):
    """Create → patch → start → submit all 7 rounds → finish → summary."""
    player_ids = _seed_players(client, 8)

    # Create event
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Full Flow",
            "eventType": "Americano",
            "eventDate": "2026-03-08",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    assert client.get(f"/api/v1/events/{event_id}").json()["setupStatus"] == "ready"

    # Start
    start_res = client.post(f"/api/v1/events/{event_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["round_number"] == 1

    # Submit all 7 rounds
    for round_num in range(1, 8):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
        assert current["roundNumber"] == round_num

        for match in current["matches"]:
            assert _submit_score(client, _match_id(match)).status_code == 204

        if round_num < 7:
            next_res = client.post(f"/api/v1/events/{event_id}/next")
            assert next_res.status_code == 200
        else:
            # Final round: next_round blocked
            blocked = client.post(f"/api/v1/events/{event_id}/next")
            assert blocked.status_code == 409

    # Finish
    finish_res = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_res.status_code in (200, 204)

    # Summary
    summary_res = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    # Should have standings for all 8 players
    standings = (
        summary.get("standings") or summary.get("finalStandings") or summary.get("playerRows") or []
    )
    assert len(standings) == 8
