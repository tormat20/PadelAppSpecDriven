"""
Unit tests for court-score normalization, score distribution building,
and per-court distribution building.

Covers:
  T004 — _normalize_court_score
  T013 — _compute_score24_stats: score_distribution (all-courts)
  T019 — _compute_score24_stats: score_distribution_per_court
"""

import pytest
from app.services.player_stats_service import _normalize_court_score, _compute_score24_stats


# ── T004: _normalize_court_score ──────────────────────────────────────────────


class TestNormalizeCourtScore:
    def test_single_court_returns_10(self):
        assert _normalize_court_score(3, [3]) == 10.0

    def test_bottom_court_returns_0(self):
        assert _normalize_court_score(1, [1, 2, 3]) == pytest.approx(0.0)

    def test_top_court_returns_10(self):
        assert _normalize_court_score(3, [1, 2, 3]) == pytest.approx(10.0)

    def test_middle_court_returns_5(self):
        assert _normalize_court_score(2, [1, 2, 3]) == pytest.approx(5.0)

    def test_contiguous_five_courts_middle(self):
        # courts [2,3,4,5,6], court 4 is rank 2 out of 5 → 2/4 * 10 = 5.0
        assert _normalize_court_score(4, [2, 3, 4, 5, 6]) == pytest.approx(5.0)

    def test_non_contiguous_courts(self):
        # courts [1,3,4,5,7], court 3 is rank 1 out of 5 → 1/4 * 10 = 2.5
        assert _normalize_court_score(3, [1, 3, 4, 5, 7]) == pytest.approx(2.5)

    def test_non_contiguous_top_court(self):
        # courts [1,3,4,5,7], court 7 is rank 4 out of 5 → 4/4 * 10 = 10.0
        assert _normalize_court_score(7, [1, 3, 4, 5, 7]) == pytest.approx(10.0)

    def test_two_courts_bottom(self):
        assert _normalize_court_score(1, [1, 2]) == pytest.approx(0.0)

    def test_two_courts_top(self):
        assert _normalize_court_score(2, [1, 2]) == pytest.approx(10.0)

    def test_spec_example_contiguous(self):
        # From spec: courts [2,3,4,5,6] → court 4 = 5.0
        courts = [2, 3, 4, 5, 6]
        assert _normalize_court_score(4, courts) == pytest.approx(5.0)

    def test_spec_example_non_contiguous(self):
        # From spec: courts [1,3,4,5,7] → court 3 = 2.5
        courts = [1, 3, 4, 5, 7]
        assert _normalize_court_score(3, courts) == pytest.approx(2.5)


# ── Shared helpers for T013 / T019 ────────────────────────────────────────────


def _make_row(
    event_id: str = "e1",
    court_number: int = 1,
    round_number: int = 1,
    player_team: int = 1,
    team1_score=12,
    team2_score=12,
    event_date: str = "2025-01-01",
    event_type: str = "Mexicano",
    is_team_mexicano: bool = False,
    result_type: str = "Score24",
    winner_team=None,
    is_draw: bool = False,
) -> dict:
    return {
        "event_id": event_id,
        "court_number": court_number,
        "round_number": round_number,
        "player_team": player_team,
        "team1_score": team1_score,
        "team2_score": team2_score,
        "event_date": event_date,
        "event_type": event_type,
        "is_team_mexicano": is_team_mexicano,
        "result_type": result_type,
        "winner_team": winner_team,
        "is_draw": is_draw,
    }


def _make_court_score_map(event_id: str, courts: list[int]) -> dict:
    from app.services.player_stats_service import _normalize_court_score

    sorted_courts = sorted(courts)
    return {event_id: {c: _normalize_court_score(c, sorted_courts) for c in sorted_courts}}


# ── T013: score_distribution (all-courts) ─────────────────────────────────────


class TestScoreDistribution:
    def test_empty_rows_returns_25_zero_entries(self):
        court_score_map: dict = {}
        result = _compute_score24_stats([], court_score_map)
        dist = result["score_distribution"]
        assert len(dist) == 25
        assert all(e["count"] == 0 for e in dist)
        # Scores must be 0–24 in order
        assert [e["score"] for e in dist] == list(range(25))

    def test_both_team_scores_counted_independently(self):
        # One match: team1=7, team2=17. Both the player (team1 here) and the opponent are
        # counted. Actually, distribution counts ALL scores (both teams) for the player's match.
        court_score_map = _make_court_score_map("e1", [1])
        rows = [_make_row(event_id="e1", court_number=1, team1_score=7, team2_score=17)]
        result = _compute_score24_stats(rows, court_score_map)
        dist = {e["score"]: e["count"] for e in result["score_distribution"]}
        assert dist[7] == 1
        assert dist[17] == 1

    def test_always_25_entries_present(self):
        court_score_map = _make_court_score_map("e1", [1])
        rows = [_make_row(event_id="e1", team1_score=5, team2_score=19)]
        result = _compute_score24_stats(rows, court_score_map)
        assert len(result["score_distribution"]) == 25

    def test_multiple_matches_accumulate_counts(self):
        court_score_map = _make_court_score_map("e1", [1])
        rows = [
            _make_row(event_id="e1", team1_score=12, team2_score=12),
            _make_row(event_id="e1", team1_score=12, team2_score=12),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        dist = {e["score"]: e["count"] for e in result["score_distribution"]}
        assert dist[12] == 4  # 2 matches × 2 teams each

    def test_out_of_range_scores_ignored(self):
        court_score_map = _make_court_score_map("e1", [1])
        # Scores -1 and 25 should be silently ignored
        rows = [_make_row(event_id="e1", team1_score=-1, team2_score=25)]
        result = _compute_score24_stats(rows, court_score_map)
        dist = result["score_distribution"]
        assert len(dist) == 25
        assert all(e["count"] == 0 for e in dist)

    def test_boundary_scores_0_and_24(self):
        court_score_map = _make_court_score_map("e1", [1])
        rows = [_make_row(event_id="e1", team1_score=0, team2_score=24)]
        result = _compute_score24_stats(rows, court_score_map)
        dist = {e["score"]: e["count"] for e in result["score_distribution"]}
        assert dist[0] == 1
        assert dist[24] == 1

    def test_known_scores_7_17_10_14_12_12(self):
        # From spec independent test: matches (7 vs 17), (10 vs 14), (12 vs 12)
        court_score_map = _make_court_score_map("e1", [1])
        rows = [
            _make_row(event_id="e1", team1_score=7, team2_score=17),
            _make_row(event_id="e1", team1_score=10, team2_score=14),
            _make_row(event_id="e1", team1_score=12, team2_score=12),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        dist = {e["score"]: e["count"] for e in result["score_distribution"]}
        assert dist[7] == 1
        assert dist[17] == 1
        assert dist[10] == 1
        assert dist[14] == 1
        assert dist[12] == 2


# ── T019: score_distribution_per_court ────────────────────────────────────────


class TestScoreDistributionPerCourt:
    def test_only_courts_with_data_appear(self):
        # courts [3,5,7] in the event but only court 3 and 5 have matches
        court_score_map = _make_court_score_map("e1", [3, 5, 7])
        rows = [
            _make_row(event_id="e1", court_number=3, team1_score=10, team2_score=14),
            _make_row(event_id="e1", court_number=5, team1_score=8, team2_score=16),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        per_court = result["score_distribution_per_court"]
        court_numbers = [c["court_number"] for c in per_court]
        assert 3 in court_numbers
        assert 5 in court_numbers
        assert 7 not in court_numbers

    def test_courts_ordered_ascending(self):
        court_score_map = _make_court_score_map("e1", [1, 2, 3, 4])
        rows = [
            _make_row(event_id="e1", court_number=4, team1_score=12, team2_score=12),
            _make_row(event_id="e1", court_number=2, team1_score=12, team2_score=12),
            _make_row(event_id="e1", court_number=1, team1_score=12, team2_score=12),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        per_court = result["score_distribution_per_court"]
        court_numbers = [c["court_number"] for c in per_court]
        assert court_numbers == sorted(court_numbers)

    def test_each_court_distribution_has_25_entries(self):
        court_score_map = _make_court_score_map("e1", [1, 2])
        rows = [
            _make_row(event_id="e1", court_number=1, team1_score=5, team2_score=19),
            _make_row(event_id="e1", court_number=2, team1_score=10, team2_score=14),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        for court_entry in result["score_distribution_per_court"]:
            assert len(court_entry["distribution"]) == 25

    def test_single_score_court_still_appears(self):
        court_score_map = _make_court_score_map("e1", [1])
        rows = [_make_row(event_id="e1", court_number=1, team1_score=10, team2_score=14)]
        result = _compute_score24_stats(rows, court_score_map)
        per_court = result["score_distribution_per_court"]
        assert len(per_court) == 1
        assert per_court[0]["court_number"] == 1

    def test_per_court_counts_correct(self):
        court_score_map = _make_court_score_map("e1", [1, 2])
        rows = [
            _make_row(event_id="e1", court_number=1, team1_score=5, team2_score=19),
            _make_row(event_id="e1", court_number=2, team1_score=12, team2_score=12),
        ]
        result = _compute_score24_stats(rows, court_score_map)
        per_court = {c["court_number"]: c for c in result["score_distribution_per_court"]}
        dist1 = {e["score"]: e["count"] for e in per_court[1]["distribution"]}
        assert dist1[5] == 1
        assert dist1[19] == 1
        assert dist1[12] == 0
        dist2 = {e["score"]: e["count"] for e in per_court[2]["distribution"]}
        assert dist2[12] == 2
        assert dist2[5] == 0
