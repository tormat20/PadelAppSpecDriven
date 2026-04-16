"""
Contract tests for GET /api/v1/players/{id}/stats/deep-dive endpoint.

Covers T022 requirements:
  - Response contains avg_court_score_per_round (not avg_court_per_round)
  - avg_court_score_overall in [0, 10] when matches exist
  - score_distribution always has exactly 25 entries
  - score_distribution_per_court contains only courts with data
  - per-court entries ordered ascending by court_number
  - Full empty-state shape when player has no matches
"""


def _seed_players(client, count=12):
    players = []
    for i in range(count):
        res = client.post("/api/v1/players", json={"displayName": f"DD{i}"})
        assert res.status_code == 201
        players.append(res.json()["id"])
    return players


def _create_mexicano_event(client, player_ids, courts=(1, 2, 3)):
    res = client.post(
        "/api/v1/events",
        json={
            "eventName": "Deep Dive Test",
            "eventType": "Mexicano",
            "eventDate": "2026-03-01",
            "selectedCourts": list(courts),
            "playerIds": player_ids,
        },
    )
    assert res.status_code == 201, f"Failed to create event: {res.json()}"
    return res.json()["id"]


def _start_and_get_matches(client, event_id):
    res = client.post(f"/api/v1/events/{event_id}/start")
    assert res.status_code == 200
    return res.json()["matches"]


def _submit_score(client, match_id, team1=14, team2=10):
    res = client.post(
        f"/api/v1/matches/{match_id}/result",
        json={"mode": "Mexicano", "team1Score": team1, "team2Score": team2},
    )
    assert res.status_code == 200


def _finish_and_apply(client, event_id):
    """Advance all rounds and finish the event. Stats are applied automatically on finish."""
    for _ in range(20):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current")
        if current.status_code == 404:
            break
        matches = current.json().get("matches", [])
        for m in matches:
            mid = m.get("matchId") or m.get("match_id") or m.get("id")
            if mid and m.get("status") != "Completed":
                _submit_score(client, mid)
        advance = client.post(f"/api/v1/events/{event_id}/next")
        if advance.status_code not in (200,):
            break

    finish_res = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_res.status_code in (200, 409)


def _get_deep_dive(client, player_id):
    res = client.get(f"/api/v1/players/{player_id}/stats/deep-dive")
    assert res.status_code == 200
    return res.json()


# ── Tests ─────────────────────────────────────────────────────────────────────


def test_empty_state_shape_for_player_with_no_matches(client):
    """Player with no matches should return all-empty shapes with correct keys."""
    res = client.post("/api/v1/players", json={"displayName": "NoMatches"})
    player_id = res.json()["id"]

    deep_dive = _get_deep_dive(client, player_id)

    for mode in ("mexicano", "americano", "team_mexicano"):
        mode_data = deep_dive[mode]

        # Renamed fields present, old fields absent
        assert "avg_court_score_per_round" in mode_data
        assert "avg_court_per_round" not in mode_data
        assert "avg_court_score_overall" in mode_data
        assert "avg_court_overall" not in mode_data

        # score_distribution always has exactly 25 entries
        assert len(mode_data["score_distribution"]) == 25
        assert all(e["count"] == 0 for e in mode_data["score_distribution"])

        # per-court is empty when no matches
        assert mode_data["score_distribution_per_court"] == []

        # avg_court_score_overall is None when no data
        assert mode_data["avg_court_score_overall"] is None


def test_deep_dive_has_25_score_distribution_entries_after_matches(client):
    """After playing matches, score_distribution always has exactly 25 entries."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    assert len(mexicano["score_distribution"]) == 25
    # Scores 0–24 in order
    scores = [e["score"] for e in mexicano["score_distribution"]]
    assert scores == list(range(25))


def test_avg_court_score_per_round_uses_new_field_names(client):
    """Response must use avg_court_score_per_round and avg_court_score_overall."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    assert "avg_court_score_per_round" in mexicano
    assert "avg_court_per_round" not in mexicano
    assert "avg_court_score_overall" in mexicano
    assert "avg_court_overall" not in mexicano


def test_avg_court_score_overall_in_0_to_10_range(client):
    """avg_court_score_overall must be in [0, 10] when matches exist."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    overall = mexicano["avg_court_score_overall"]
    if overall is not None:
        assert 0.0 <= overall <= 10.0


def test_avg_court_score_per_round_values_in_0_to_10(client):
    """All avg_court_score values in avg_court_score_per_round must be in [0, 10]."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    for entry in mexicano["avg_court_score_per_round"]:
        assert "avg_court_score" in entry
        assert 0.0 <= entry["avg_court_score"] <= 10.0


def test_score_distribution_per_court_only_has_courts_with_data(client):
    """score_distribution_per_court only contains courts where matches were played."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    per_court = mexicano["score_distribution_per_court"]
    for court_entry in per_court:
        # Each court entry must have at least one non-zero count
        total = sum(e["count"] for e in court_entry["distribution"])
        assert total > 0, f"Court {court_entry['court_number']} has zero counts but is present"


def test_score_distribution_per_court_ordered_ascending(client):
    """score_distribution_per_court must be ordered by court_number ascending."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    per_court = mexicano["score_distribution_per_court"]
    court_numbers = [c["court_number"] for c in per_court]
    assert court_numbers == sorted(court_numbers)


def test_each_per_court_distribution_has_25_entries(client):
    """Each per-court distribution entry must have exactly 25 entries (scores 0–24)."""
    player_ids = _seed_players(client, count=12)
    event_id = _create_mexicano_event(client, player_ids, courts=(1, 2, 3))
    _finish_and_apply(client, event_id)

    deep_dive = _get_deep_dive(client, player_ids[0])
    mexicano = deep_dive["mexicano"]

    for court_entry in mexicano["score_distribution_per_court"]:
        assert len(court_entry["distribution"]) == 25
        scores = [e["score"] for e in court_entry["distribution"]]
        assert scores == list(range(25))
