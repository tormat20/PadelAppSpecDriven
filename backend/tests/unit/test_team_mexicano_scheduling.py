"""Unit tests for TeamMexicanoService scheduling logic."""

import pytest

from app.services.team_mexicano_service import (
    TeamMexicanoService,
    build_last_round_opponent_pairs,
    _opponent_key,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_teams(n: int) -> list[tuple[str, str]]:
    """Return n fixed teams: [("p0","p1"), ("p2","p3"), ...]."""
    return [(f"p{i * 2}", f"p{i * 2 + 1}") for i in range(n)]


def teams_on_courts(plan) -> dict[int, tuple]:
    """Map court_number -> (team1, team2) from a RoundPlan."""
    return {m.court_number: (m.team1, m.team2) for m in plan.matches}


# ---------------------------------------------------------------------------
# Round 1 — randomised matchups
# ---------------------------------------------------------------------------


class TestGenerateRound1:
    def test_correct_round_number(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_round_1(teams, [1, 2], event_seed="seed-a")
        assert plan.round_number == 1

    def test_correct_number_of_matches(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_round_1(teams, [1, 2], event_seed="seed-a")
        assert len(plan.matches) == 2

    def test_all_teams_appear_exactly_once(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_round_1(teams, [1, 2], event_seed="seed-a")
        all_in_plan = set()
        for m in plan.matches:
            all_in_plan.add(m.team1)
            all_in_plan.add(m.team2)
        assert all_in_plan == set(teams)

    def test_partners_never_split(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_round_1(teams, [1, 2], event_seed="seed-a")
        for m in plan.matches:
            assert m.team1 in teams
            assert m.team2 in teams

    def test_different_seeds_produce_different_matchups(self):
        """Two distinct seeds should (in general) produce different pairings."""
        svc = TeamMexicanoService()
        teams = make_teams(8)
        courts = [1, 2, 3, 4]
        results = set()
        for seed in [f"seed-{i}" for i in range(20)]:
            plan = svc.generate_round_1(teams, courts, event_seed=seed)
            key = tuple(
                (m.team1, m.team2) for m in sorted(plan.matches, key=lambda x: x.court_number)
            )
            results.add(key)
        # With 8 teams and 20 different seeds we expect more than 1 unique arrangement
        assert len(results) > 1

    def test_same_seed_is_deterministic(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan_a = svc.generate_round_1(teams, [1, 2], event_seed="fixed")
        plan_b = svc.generate_round_1(teams, [1, 2], event_seed="fixed")
        assert [(m.team1, m.team2) for m in plan_a.matches] == [
            (m.team1, m.team2) for m in plan_b.matches
        ]

    def test_matches_sorted_by_court_number(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_round_1(teams, [3, 1], event_seed="seed-a")
        court_numbers = [m.court_number for m in plan.matches]
        assert court_numbers == sorted(court_numbers)

    def test_fewer_courts_than_team_pairs_limits_matches(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)  # 2 pairs
        plan = svc.generate_round_1(teams, [1], event_seed="seed")  # only 1 court
        assert len(plan.matches) == 1


# ---------------------------------------------------------------------------
# Round N+1 — swiss-adjacent pairing
# ---------------------------------------------------------------------------


class TestGenerateNextRound:
    def test_correct_round_number(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_next_round(1, teams, [1, 2])
        assert plan.round_number == 2

    def test_correct_number_of_matches(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_next_round(1, teams, [1, 2])
        assert len(plan.matches) == 2

    def test_all_teams_appear_exactly_once(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_next_round(1, teams, [1, 2])
        all_in_plan = set()
        for m in plan.matches:
            all_in_plan.add(m.team1)
            all_in_plan.add(m.team2)
        assert all_in_plan == set(teams)

    def test_adjacent_pairing_by_score(self):
        """Rank 1 vs 2, rank 3 vs 4 when no repeat constraint applies."""
        svc = TeamMexicanoService()
        # 4 teams with distinct scores: t0=100, t1=80, t2=60, t3=40
        t0, t1, t2, t3 = ("a0", "a1"), ("b0", "b1"), ("c0", "c1"), ("d0", "d1")
        scores = {"a0": 50, "a1": 50, "b0": 40, "b1": 40, "c0": 30, "c1": 30, "d0": 20, "d1": 20}
        teams = [t0, t1, t2, t3]
        plan = svc.generate_next_round(1, teams, [1, 2], previous_scores=scores)
        pairings = {frozenset({m.team1, m.team2}) for m in plan.matches}
        assert frozenset({t0, t1}) in pairings  # top two play each other
        assert frozenset({t2, t3}) in pairings  # bottom two play each other

    def test_no_repeat_guard_swaps_pair(self):
        """When rank-1 vs rank-2 repeated last round, they should be swapped."""
        svc = TeamMexicanoService()
        t0, t1, t2, t3 = ("a0", "a1"), ("b0", "b1"), ("c0", "c1"), ("d0", "d1")
        scores = {"a0": 50, "a1": 50, "b0": 40, "b1": 40, "c0": 30, "c1": 30, "d0": 20, "d1": 20}
        teams = [t0, t1, t2, t3]
        # Simulate last round: t0 vs t1, t2 vs t3
        last_pairs = {_opponent_key(t0, t1), _opponent_key(t2, t3)}
        plan = svc.generate_next_round(
            1, teams, [1, 2], previous_scores=scores, last_round_opponent_pairs=last_pairs
        )
        pairings = {frozenset({m.team1, m.team2}) for m in plan.matches}
        # After swap: t0 vs t2 and t1 vs t3 (or similar avoidance)
        assert frozenset({t0, t1}) not in pairings or frozenset({t2, t3}) not in pairings

    def test_no_repeat_guard_no_swap_when_only_option(self):
        """With only 2 teams there is only one possible pairing; repeat is unavoidable."""
        svc = TeamMexicanoService()
        t0, t1 = ("a0", "a1"), ("b0", "b1")
        last_pairs = {_opponent_key(t0, t1)}
        plan = svc.generate_next_round(1, [t0, t1], [1], last_round_opponent_pairs=last_pairs)
        assert len(plan.matches) == 1
        m = plan.matches[0]
        # The pair must still be produced even though it's a repeat (unavoidable)
        assert {m.team1, m.team2} == {t0, t1}

    def test_matches_sorted_by_court_number(self):
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_next_round(1, teams, [3, 1])
        court_numbers = [m.court_number for m in plan.matches]
        assert court_numbers == sorted(court_numbers)

    def test_no_scores_falls_back_to_stable_order(self):
        """Without scores every team has 0 — stable sort keeps original order; adjacent pairs."""
        svc = TeamMexicanoService()
        teams = make_teams(4)
        plan = svc.generate_next_round(1, teams, [1, 2], previous_scores=None)
        assert len(plan.matches) == 2

    def test_six_teams_two_courts(self):
        """Only 2 courts active; top 4 teams (by score) fill them."""
        svc = TeamMexicanoService()
        teams = make_teams(6)
        scores = {p: (5 - i) * 10 for i, (p, _) in enumerate(teams)}
        scores.update({q: (5 - i) * 10 for i, (_, q) in enumerate(teams)})
        plan = svc.generate_next_round(1, teams, [1, 2], previous_scores=scores)
        assert len(plan.matches) == 2


# ---------------------------------------------------------------------------
# build_last_round_opponent_pairs helper
# ---------------------------------------------------------------------------


class TestBuildLastRoundOpponentPairs:
    def test_extracts_pairs_from_matches(self):
        class FakeMatch:
            def __init__(self, t1p1, t1p2, t2p1, t2p2):
                self.team1_player1_id = t1p1
                self.team1_player2_id = t1p2
                self.team2_player1_id = t2p1
                self.team2_player2_id = t2p2

        matches = [
            FakeMatch("a0", "a1", "b0", "b1"),
            FakeMatch("c0", "c1", "d0", "d1"),
        ]
        pairs = build_last_round_opponent_pairs(matches)
        assert _opponent_key(("a0", "a1"), ("b0", "b1")) in pairs
        assert _opponent_key(("c0", "c1"), ("d0", "d1")) in pairs
        assert len(pairs) == 2

    def test_empty_matches_returns_empty_set(self):
        assert build_last_round_opponent_pairs([]) == set()
