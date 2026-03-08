"""Unit tests for Americano schedule generation (FR-002 through FR-006)."""

from collections import Counter
from itertools import combinations

import pytest

from app.domain.scheduling import generate_americano_rounds


def _player_ids(n: int) -> list[str]:
    return [f"p{i}" for i in range(n)]


def _courts(n: int) -> list[int]:
    return list(range(1, n // 4 + 1))


def _partner_pairs(plans) -> set[frozenset[str]]:
    """Return all (player_a, player_b) partner pairs across all rounds."""
    pairs: set[frozenset[str]] = set()
    for plan in plans:
        for match in plan.matches:
            pairs.add(frozenset(match.team1))
            pairs.add(frozenset(match.team2))
    return pairs


def _players_per_round(plans) -> list[set[str]]:
    """For each round, return the set of players appearing in matches."""
    return [
        {p for match in plan.matches for team in (match.team1, match.team2) for p in team}
        for plan in plans
    ]


def _count_appearances_per_round(plans, player_ids) -> list[Counter]:
    """For each round, count how many times each player appears."""
    results = []
    for plan in plans:
        c: Counter = Counter()
        for match in plan.matches:
            for p in (*match.team1, *match.team2):
                c[p] += 1
        results.append(c)
    return results


# ─── 8 players ────────────────────────────────────────────────────────────────


class TestAmericanoSchedule8:
    def test_generates_7_rounds(self):
        plans = generate_americano_rounds(_player_ids(8), _courts(8))
        assert len(plans) == 7

    def test_round_numbers_are_sequential(self):
        plans = generate_americano_rounds(_player_ids(8), _courts(8))
        assert [p.round_number for p in plans] == list(range(1, 8))

    def test_each_round_has_2_matches(self):
        plans = generate_americano_rounds(_player_ids(8), _courts(8))
        for plan in plans:
            assert len(plan.matches) == 2

    def test_each_player_appears_exactly_once_per_round(self):
        players = _player_ids(8)
        plans = generate_americano_rounds(players, _courts(8))
        for plan in plans:
            counts = Counter(p for m in plan.matches for p in (*m.team1, *m.team2))
            for pid in players:
                assert counts[pid] == 1, (
                    f"Player {pid} appeared {counts[pid]} times in round {plan.round_number}"
                )

    def test_each_pair_partners_exactly_once(self):
        players = _player_ids(8)
        plans = generate_americano_rounds(players, _courts(8))
        partner_counts: Counter = Counter()
        for plan in plans:
            for match in plan.matches:
                partner_counts[frozenset(match.team1)] += 1
                partner_counts[frozenset(match.team2)] += 1
        all_pairs = [frozenset(pair) for pair in combinations(players, 2)]
        for pair in all_pairs:
            assert partner_counts[pair] == 1, (
                f"Partner pair {pair} appeared {partner_counts[pair]} times"
            )

    def test_result_type_is_score24(self):
        from app.domain.enums import ResultType

        plans = generate_americano_rounds(_player_ids(8), _courts(8))
        for plan in plans:
            for match in plan.matches:
                assert match.result_type == ResultType.SCORE_24


# ─── 12 players ───────────────────────────────────────────────────────────────


class TestAmericanoSchedule12:
    def test_generates_11_rounds(self):
        plans = generate_americano_rounds(_player_ids(12), _courts(12))
        assert len(plans) == 11

    def test_each_round_has_3_matches(self):
        plans = generate_americano_rounds(_player_ids(12), _courts(12))
        for plan in plans:
            assert len(plan.matches) == 3

    def test_each_player_appears_exactly_once_per_round(self):
        players = _player_ids(12)
        plans = generate_americano_rounds(players, _courts(12))
        for plan in plans:
            counts = Counter(p for m in plan.matches for p in (*m.team1, *m.team2))
            for pid in players:
                assert counts[pid] == 1


# ─── 16 players ───────────────────────────────────────────────────────────────


class TestAmericanoSchedule16:
    def test_generates_15_rounds(self):
        plans = generate_americano_rounds(_player_ids(16), _courts(16))
        assert len(plans) == 15

    def test_each_round_has_4_matches(self):
        plans = generate_americano_rounds(_player_ids(16), _courts(16))
        for plan in plans:
            assert len(plan.matches) == 4

    def test_each_player_appears_exactly_once_per_round(self):
        players = _player_ids(16)
        plans = generate_americano_rounds(players, _courts(16))
        for plan in plans:
            counts = Counter(p for m in plan.matches for p in (*m.team1, *m.team2))
            for pid in players:
                assert counts[pid] == 1


# ─── Berger fallback (20 players) ─────────────────────────────────────────────


class TestAmericanoScheduleBerger20:
    def test_generates_19_rounds(self):
        plans = generate_americano_rounds(_player_ids(20), _courts(20))
        assert len(plans) == 19

    def test_each_round_has_5_matches(self):
        plans = generate_americano_rounds(_player_ids(20), _courts(20))
        for plan in plans:
            assert len(plan.matches) == 5

    def test_each_player_appears_exactly_once_per_round(self):
        players = _player_ids(20)
        plans = generate_americano_rounds(players, _courts(20))
        for plan in plans:
            counts = Counter(p for m in plan.matches for p in (*m.team1, *m.team2))
            for pid in players:
                assert counts[pid] == 1


# ─── Validation ───────────────────────────────────────────────────────────────


class TestAmericanoValidation:
    def test_raises_for_non_multiple_of_4(self):
        with pytest.raises(ValueError, match="multiple of 4"):
            generate_americano_rounds(_player_ids(9), [1, 2])

    def test_raises_for_fewer_than_4_players(self):
        with pytest.raises(ValueError):
            generate_americano_rounds(_player_ids(3), [1])

    def test_court_numbers_are_sorted(self):
        players = _player_ids(8)
        plans = generate_americano_rounds(players, [3, 1])
        for plan in plans:
            courts = [m.court_number for m in plan.matches]
            assert courts == sorted(courts) or len(courts) <= 1
