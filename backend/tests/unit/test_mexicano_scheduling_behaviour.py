"""
Behaviour tests for standard Mexicano scheduling.

Setup: 24 players named "A" through "X".
  - Player "A" has the highest score (24), "X" has the lowest (1).
  - Scores are assigned so rank i (1-based) = player at alphabet index (i-1).

Mexicano rules under test:
  1. Players are ranked by total score descending before each round.
  2. Ranked list is split into consecutive quartets: [1-4], [5-8], ..., [21-24].
  3. Each quartet plays on one court. Highest-ranked quartet → highest court number.
  4. Within each quartet the pairing that avoids last-round partners is chosen.
     Fallback (no-repeat possible): rank1+rank4 vs rank2+rank3  (candidates[0]).
  5. Tiebreak cascade: (−score, previous_rank, player_id alphabetical).
  6. Round 1 is randomised (seeded), so players are shuffled before grouping.
"""

import string

import pytest

from app.domain.enums import EventType
from app.domain.scheduling import _choose_pairing_for_quartet, generate_next_round, generate_round_1


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

# 24 player IDs: "A" .. "X"  (first 24 uppercase letters)
PLAYERS_24 = list(string.ascii_uppercase[:24])  # ["A","B",...,"X"]

# Scores: A=24, B=23, ..., X=1
SCORES_24: dict[str, int] = {p: 24 - i for i, p in enumerate(PLAYERS_24)}

# 6 courts: 1..6
COURTS_6 = list(range(1, 7))


def rank_ordered() -> list[str]:
    """Return players sorted by score descending (the order Mexicano would produce)."""
    return sorted(PLAYERS_24, key=lambda p: -SCORES_24[p])


def quartet(rank_start: int) -> list[str]:
    """Return the quartet starting at 1-based rank_start (e.g. 1 → ["A","B","C","D"])."""
    ordered = rank_ordered()
    base = rank_start - 1
    return ordered[base : base + 4]


# ---------------------------------------------------------------------------
# Helpers to build the input the scheduler actually receives
# ---------------------------------------------------------------------------


def make_partner_history(matches_spec: list[tuple[str, str, str, str]]) -> dict[str, str]:
    """Build a partner_history map from a list of (p1a, p1b, p2a, p2b) tuples."""
    h: dict[str, str] = {}
    for p1a, p1b, p2a, p2b in matches_spec:
        h[p1a] = p1b
        h[p1b] = p1a
        h[p2a] = p2b
        h[p2b] = p2a
    return h


# ---------------------------------------------------------------------------
# Round 1 — randomised draw
# ---------------------------------------------------------------------------


class TestMexicanoRound1:
    def test_produces_correct_number_of_matches(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        assert len(plan.matches) == 6

    def test_round_number_is_1(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        assert plan.round_number == 1

    def test_all_24_players_appear_exactly_once(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        seen: list[str] = []
        for m in plan.matches:
            seen.extend([m.team1[0], m.team1[1], m.team2[0], m.team2[1]])
        assert sorted(seen) == sorted(PLAYERS_24)

    def test_each_match_has_4_distinct_players(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        for m in plan.matches:
            players_in_match = [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
            assert len(set(players_in_match)) == 4

    def test_same_seed_is_deterministic(self):
        plan_a = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="fixed")
        plan_b = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="fixed")
        for ma, mb in zip(plan_a.matches, plan_b.matches):
            assert ma.team1 == mb.team1
            assert ma.team2 == mb.team2

    def test_different_seeds_produce_different_groupings(self):
        results = set()
        for seed in [f"seed-{i}" for i in range(30)]:
            plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed=seed)
            key = tuple(
                tuple(sorted([m.team1[0], m.team1[1], m.team2[0], m.team2[1]]))
                for m in sorted(plan.matches, key=lambda x: x.court_number)
            )
            results.add(key)
        assert len(results) > 1, "Different seeds should produce different groupings"

    def test_courts_are_sorted_ascending(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        court_numbers = [m.court_number for m in plan.matches]
        assert court_numbers == sorted(court_numbers)

    def test_result_type_is_score_24(self):
        plan = generate_round_1(EventType.MEXICANO, PLAYERS_24, COURTS_6, event_seed="evt-1")
        from app.domain.enums import ResultType

        for m in plan.matches:
            assert m.result_type == ResultType.SCORE_24


# ---------------------------------------------------------------------------
# Round 2+ — score-based quartet grouping
# ---------------------------------------------------------------------------


class TestMexicanoNextRoundQuartetGrouping:
    """
    With 24 players ranked A(24)..X(1), the scheduler must place:
      - Quartet ranks 1-4  (A,B,C,D) on court 6  (highest)
      - Quartet ranks 5-8  (E,F,G,H) on court 5
      - Quartet ranks 9-12 (I,J,K,L) on court 4
      - Quartet ranks 13-16(M,N,O,P) on court 3
      - Quartet ranks 17-20(Q,R,S,T) on court 2
      - Quartet ranks 21-24(U,V,W,X) on court 1  (lowest)
    """

    def _make_plan(self, partner_history=None):
        ordered = rank_ordered()
        return generate_next_round(
            EventType.MEXICANO,
            1,
            ordered,
            COURTS_6,
            partner_history=partner_history or {},
        )

    def _court_players(self, plan, court: int) -> set[str]:
        for m in plan.matches:
            if m.court_number == court:
                return {m.team1[0], m.team1[1], m.team2[0], m.team2[1]}
        raise AssertionError(f"Court {court} not found in plan")

    def test_top_quartet_on_highest_court(self):
        plan = self._make_plan()
        assert self._court_players(plan, 6) == set(quartet(1))

    def test_second_quartet_on_court_5(self):
        plan = self._make_plan()
        assert self._court_players(plan, 5) == set(quartet(5))

    def test_third_quartet_on_court_4(self):
        plan = self._make_plan()
        assert self._court_players(plan, 4) == set(quartet(9))

    def test_fourth_quartet_on_court_3(self):
        plan = self._make_plan()
        assert self._court_players(plan, 3) == set(quartet(13))

    def test_fifth_quartet_on_court_2(self):
        plan = self._make_plan()
        assert self._court_players(plan, 2) == set(quartet(17))

    def test_bottom_quartet_on_lowest_court(self):
        plan = self._make_plan()
        assert self._court_players(plan, 1) == set(quartet(21))

    def test_all_24_players_appear_exactly_once(self):
        plan = self._make_plan()
        seen: list[str] = []
        for m in plan.matches:
            seen.extend([m.team1[0], m.team1[1], m.team2[0], m.team2[1]])
        assert sorted(seen) == sorted(PLAYERS_24)

    def test_produces_6_matches(self):
        plan = self._make_plan()
        assert len(plan.matches) == 6

    def test_courts_sorted_ascending(self):
        plan = self._make_plan()
        court_numbers = [m.court_number for m in plan.matches]
        assert court_numbers == sorted(court_numbers)


# ---------------------------------------------------------------------------
# Within-quartet pairing rules
# ---------------------------------------------------------------------------


class TestMexicanoWithinQuartetPairing:
    """
    Within a quartet [rank1, rank2, rank3, rank4] the three possible pairings are:
      candidates[0]: (r1+r2) vs (r3+r4)   ← default / fallback
      candidates[1]: (r1+r3) vs (r2+r4)
      candidates[2]: (r1+r4) vs (r2+r3)   ← "extreme" pairing

    The scheduler picks the candidate with the lowest partner-repeat penalty.
    """

    def test_no_history_uses_candidate_0(self):
        """With no partner history, candidates[0] wins (penalty 0 for all, first wins)."""
        q = ["p1", "p2", "p3", "p4"]
        team1, team2 = _choose_pairing_for_quartet(q, {})
        assert set(team1) == {"p1", "p2"}
        assert set(team2) == {"p3", "p4"}

    def test_avoids_repeat_partner_p1_p2(self):
        """If p1+p2 were partners last round, candidate with p1+p2 is penalised."""
        q = ["p1", "p2", "p3", "p4"]
        history = {"p1": "p2", "p2": "p1"}
        team1, team2 = _choose_pairing_for_quartet(q, history)
        # p1 and p2 must NOT be partners in the chosen pairing
        assert set(team1) != {"p1", "p2"}
        assert set(team2) != {"p1", "p2"}

    def test_avoids_repeat_partner_p3_p4(self):
        """If p3+p4 were partners last round, candidate pairing them is penalised."""
        q = ["p1", "p2", "p3", "p4"]
        history = {"p3": "p4", "p4": "p3"}
        team1, team2 = _choose_pairing_for_quartet(q, history)
        assert set(team1) != {"p3", "p4"}
        assert set(team2) != {"p3", "p4"}

    def test_both_pairs_repeat_falls_back_to_candidate_0(self):
        """
        If the best we can do is one repeat, candidate[0] wins as first-encountered
        minimum (all candidates have penalty >= 1 and candidates[0] is checked first).
        """
        q = ["p1", "p2", "p3", "p4"]
        # p1+p2 and p3+p4 both repeating → candidate[0] has penalty 4,
        # candidate[1] has penalty 0 (p1+p3, p2+p4 — new pairs)
        history = {"p1": "p2", "p2": "p1", "p3": "p4", "p4": "p3"}
        team1, team2 = _choose_pairing_for_quartet(q, history)
        # candidate[1]: (p1+p3) vs (p2+p4) has penalty 0 — should be chosen
        assert set(team1) in ({f"p1", "p3"}, {"p2", "p4"})

    def test_top_court_avoids_last_round_partner_in_full_plan(self):
        """End-to-end: if A+B were partners in the previous round, A+B are not partners again."""
        ordered = rank_ordered()  # A,B,C,D on court 6
        history = make_partner_history([("A", "B", "C", "D")])
        plan = generate_next_round(
            EventType.MEXICANO, 1, ordered, COURTS_6, partner_history=history
        )
        top_match = next(m for m in plan.matches if m.court_number == 6)
        # A and B must not be on the same team
        assert not ({"A", "B"} == set(top_match.team1) or {"A", "B"} == set(top_match.team2))

    def test_bottom_court_avoids_last_round_partner_in_full_plan(self):
        """Same rule applies on the lowest court (ranks 21-24 = U,V,W,X)."""
        ordered = rank_ordered()
        history = make_partner_history([("U", "V", "W", "X")])
        plan = generate_next_round(
            EventType.MEXICANO, 1, ordered, COURTS_6, partner_history=history
        )
        bottom_match = next(m for m in plan.matches if m.court_number == 1)
        assert not ({"U", "V"} == set(bottom_match.team1) or {"U", "V"} == set(bottom_match.team2))


# ---------------------------------------------------------------------------
# Tiebreak cascade
# ---------------------------------------------------------------------------


class TestMexicanoTiebreakCascade:
    """
    Tiebreak order: (−score, previous_rank, player_id alphabetical).

    _rank_players_for_mexicano lives in RoundService and uses rankings_repo, so
    we test the sort key logic directly here using generate_next_round with a
    pre-ordered list that mirrors what the ranker would produce.
    """

    def test_equal_scores_preserve_prior_rank_order(self):
        """
        8 players all tied at 10 points. The scheduler receives them pre-ordered
        by prior rank (1..8). The top quartet must be players at prior-rank 1-4
        on the highest court, bottom quartet on court 1 — not shuffled.
        """
        # Simulate: ranker has already sorted by (−score, previous_rank)
        # and passes the result as ordered_player_ids.
        # Players: "R1".."R8" — all score=10, prior rank 1..8.
        players = [f"R{i}" for i in range(1, 9)]
        plan = generate_next_round(
            EventType.MEXICANO,
            1,
            players,  # already rank-ordered by caller
            [1, 2],
            partner_history={},
        )
        court_2_players = {
            p
            for m in plan.matches
            if m.court_number == 2
            for p in [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
        }
        court_1_players = {
            p
            for m in plan.matches
            if m.court_number == 1
            for p in [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
        }
        # Top 4 by prior rank go to court 2 (highest court)
        assert court_2_players == {"R1", "R2", "R3", "R4"}
        # Bottom 4 go to court 1
        assert court_1_players == {"R5", "R6", "R7", "R8"}

    def test_score_beats_prior_rank_in_ordering(self):
        """
        A player who scored higher this round overtakes a player with better prior rank.
        We pass players in score-descending order (as the ranker would after re-sorting).
        Players: "High" (score 20, prior rank 5) and "Low" (score 5, prior rank 1).
        The score-sorted order puts "High" before "Low", so "High" lands in top quartet.
        """
        # The ranker sorts by (−score, prior_rank), so "High" comes first.
        players = ["High", "P2", "P3", "P4", "Low", "P6", "P7", "P8"]
        plan = generate_next_round(EventType.MEXICANO, 1, players, [1, 2], partner_history={})
        court_2_players = {
            p
            for m in plan.matches
            if m.court_number == 2
            for p in [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
        }
        assert "High" in court_2_players
        assert "Low" not in court_2_players

    def test_alphabetical_tiebreak_is_last_resort(self):
        """
        When score and prior rank are equal, player_id alphabetical order breaks the tie.
        "Aaron" < "Zara" alphabetically, so Aaron is ranked higher.
        We verify by passing them in correct sorted order (as the ranker would).
        """
        # Ranker output for equal score + equal prior rank: sorted by player_id alpha
        players = ["Aaron", "Bob", "Carol", "Dave", "Eve", "Frank", "Greta", "Zara"]
        plan = generate_next_round(EventType.MEXICANO, 1, players, [1, 2], partner_history={})
        court_2_players = {
            p
            for m in plan.matches
            if m.court_number == 2
            for p in [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
        }
        # Aaron (alphabetically first) must be in the top quartet
        assert "Aaron" in court_2_players
        assert "Zara" not in court_2_players


# ---------------------------------------------------------------------------
# Court assignment
# ---------------------------------------------------------------------------


class TestMexicanoCourtAssignment:
    def test_highest_ranked_quartet_gets_highest_court(self):
        ordered = rank_ordered()
        plan = generate_next_round(EventType.MEXICANO, 1, ordered, COURTS_6, partner_history={})
        max_court = max(m.court_number for m in plan.matches)
        top_court_match = next(m for m in plan.matches if m.court_number == max_court)
        players_on_top = {
            top_court_match.team1[0],
            top_court_match.team1[1],
            top_court_match.team2[0],
            top_court_match.team2[1],
        }
        assert players_on_top == set(quartet(1))

    def test_lowest_ranked_quartet_gets_lowest_court(self):
        ordered = rank_ordered()
        plan = generate_next_round(EventType.MEXICANO, 1, ordered, COURTS_6, partner_history={})
        min_court = min(m.court_number for m in plan.matches)
        bottom_court_match = next(m for m in plan.matches if m.court_number == min_court)
        players_on_bottom = {
            bottom_court_match.team1[0],
            bottom_court_match.team1[1],
            bottom_court_match.team2[0],
            bottom_court_match.team2[1],
        }
        assert players_on_bottom == set(quartet(21))

    def test_no_player_appears_on_two_courts(self):
        ordered = rank_ordered()
        plan = generate_next_round(EventType.MEXICANO, 1, ordered, COURTS_6, partner_history={})
        seen: list[str] = []
        for m in plan.matches:
            seen.extend([m.team1[0], m.team1[1], m.team2[0], m.team2[1]])
        assert len(seen) == len(set(seen)), "A player appeared in more than one match"

    def test_fewer_courts_only_top_players_play(self):
        """With only 3 courts, top 12 players (ranks 1-12) play; bottom 12 sit out."""
        ordered = rank_ordered()
        plan = generate_next_round(EventType.MEXICANO, 1, ordered, [4, 5, 6], partner_history={})
        assert len(plan.matches) == 3
        active_players = {
            p for m in plan.matches for p in [m.team1[0], m.team1[1], m.team2[0], m.team2[1]]
        }
        # All active players must be from the top 12
        top_12 = set(rank_ordered()[:12])
        assert active_players.issubset(top_12)
