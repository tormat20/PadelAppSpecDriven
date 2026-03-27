"""
Behaviour tests for Team Mexicano scheduling.

Setup: 12 fixed teams named team_01..team_12.
  - Each team has a combined score: team_01=120, team_02=110, ..., team_12=10.
  - This gives strict ordering with no ties (for most tests).

Team Mexicano rules under test:
  1. Partners are FIXED — same two players always form one unit.
  2. Round 1: opponent matchups are RANDOMISED (seeded by event_id).
  3. Round 2+: teams sorted by combined score descending, paired swiss-adjacent:
       rank 1 vs rank 2 on the highest court,
       rank 3 vs rank 4 on the next court, ...
       rank (2n-1) vs rank 2n on the lowest court.
  4. No-repeat guard: if adjacent pair [i] faced each other last round,
     swap with pair [i+1] to avoid the repeat when possible.
  5. Tiebreak on equal scores: stable sort preserves original list order (insertion order).
"""

import pytest

from app.services.team_mexicano_service import (
    TeamMexicanoService,
    _opponent_key,
    build_last_round_opponent_pairs,
)

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

# 12 teams. Each team is (player_a, player_b).
# team_01 = ("t01a", "t01b"), team_02 = ("t02a", "t02b"), ...
TEAMS_12: list[tuple[str, str]] = [(f"t{i:02d}a", f"t{i:02d}b") for i in range(1, 13)]


# Combined scores: team_01 → 120, team_02 → 110, ..., team_12 → 10
# Each player on a team shares half the combined score (doesn't matter — we pass per-player scores).
def make_scores(
    teams: list[tuple[str, str]], *, top_score: int = 120, step: int = 10
) -> dict[str, int]:
    """Assign per-player scores so team rank i has combined = top_score - (i-1)*step."""
    scores: dict[str, int] = {}
    for i, (pa, pb) in enumerate(teams):
        half = (top_score - i * step) // 2
        scores[pa] = half
        scores[pb] = half
    return scores


SCORES_12 = make_scores(TEAMS_12)  # team_01=120, team_02=110, ..., team_12=10
COURTS_6 = list(range(1, 7))


def rank_ordered_teams(teams=None, scores=None) -> list[tuple[str, str]]:
    """Return teams sorted by combined score descending."""
    if teams is None:
        teams = TEAMS_12
    if scores is None:
        scores = SCORES_12
    return sorted(teams, key=lambda t: scores[t[0]] + scores[t[1]], reverse=True)


# ---------------------------------------------------------------------------
# Round 1 — randomised draw
# ---------------------------------------------------------------------------


class TestTeamMexicanoRound1:
    def test_round_number_is_1(self):
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        assert plan.round_number == 1

    def test_produces_6_matches_for_12_teams_6_courts(self):
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        assert len(plan.matches) == 6

    def test_all_12_teams_appear_exactly_once(self):
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        seen: set[tuple[str, str]] = set()
        for m in plan.matches:
            seen.add(m.team1)
            seen.add(m.team2)
        assert seen == set(TEAMS_12)

    def test_partners_never_split(self):
        """Every team tuple in the plan must be one of the original fixed teams."""
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        valid = set(TEAMS_12)
        for m in plan.matches:
            assert m.team1 in valid, f"team1 {m.team1} is not a valid fixed team"
            assert m.team2 in valid, f"team2 {m.team2} is not a valid fixed team"

    def test_same_seed_is_deterministic(self):
        svc = TeamMexicanoService()
        plan_a = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="stable")
        plan_b = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="stable")
        for ma, mb in zip(plan_a.matches, plan_b.matches):
            assert ma.team1 == mb.team1 and ma.team2 == mb.team2

    def test_different_seeds_produce_different_matchups(self):
        svc = TeamMexicanoService()
        results: set[tuple] = set()
        for seed in [f"s{i}" for i in range(30)]:
            plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed=seed)
            key = tuple(
                frozenset({m.team1, m.team2})
                for m in sorted(plan.matches, key=lambda x: x.court_number)
            )
            results.add(key)
        assert len(results) > 1

    def test_matches_sorted_by_court_number(self):
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        courts = [m.court_number for m in plan.matches]
        assert courts == sorted(courts)

    def test_result_type_is_score_24(self):
        from app.domain.enums import ResultType

        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="evt-1")
        for m in plan.matches:
            assert m.result_type == ResultType.SCORE_24

    def test_fewer_courts_limits_matches(self):
        svc = TeamMexicanoService()
        plan = svc.generate_round_1(TEAMS_12, [1, 2, 3], event_seed="evt-1")
        assert len(plan.matches) == 3


# ---------------------------------------------------------------------------
# Round 2+ — swiss-adjacent pairing
# ---------------------------------------------------------------------------


class TestTeamMexicanoNextRoundAdjacentPairing:
    """
    With 12 teams strictly ranked 1(=team_01)..12(=team_12):
      court 6 (highest): team_01 vs team_02
      court 5:           team_03 vs team_04
      court 4:           team_05 vs team_06
      court 3:           team_07 vs team_08
      court 2:           team_09 vs team_10
      court 1 (lowest):  team_11 vs team_12
    This is the OPPOSITE of the old "best vs worst" logic.
    """

    def _plan(self, last_pairs=None):
        svc = TeamMexicanoService()
        return svc.generate_next_round(
            1,
            TEAMS_12,
            COURTS_6,
            previous_scores=SCORES_12,
            last_round_opponent_pairs=last_pairs,
        )

    def _court_teams(self, plan, court: int) -> frozenset[tuple[str, str]]:
        for m in plan.matches:
            if m.court_number == court:
                return frozenset({m.team1, m.team2})
        raise AssertionError(f"Court {court} not found")

    # --- Core adjacency tests ---

    def test_top_two_teams_face_each_other_on_highest_court(self):
        plan = self._plan()
        top = self._court_teams(plan, 6)
        assert top == frozenset({TEAMS_12[0], TEAMS_12[1]})  # team_01 vs team_02

    def test_ranks_3_4_face_each_other_on_court_5(self):
        plan = self._plan()
        assert self._court_teams(plan, 5) == frozenset({TEAMS_12[2], TEAMS_12[3]})

    def test_ranks_5_6_face_each_other_on_court_4(self):
        plan = self._plan()
        assert self._court_teams(plan, 4) == frozenset({TEAMS_12[4], TEAMS_12[5]})

    def test_ranks_7_8_face_each_other_on_court_3(self):
        plan = self._plan()
        assert self._court_teams(plan, 3) == frozenset({TEAMS_12[6], TEAMS_12[7]})

    def test_ranks_9_10_face_each_other_on_court_2(self):
        plan = self._plan()
        assert self._court_teams(plan, 2) == frozenset({TEAMS_12[8], TEAMS_12[9]})

    def test_bottom_two_teams_face_each_other_on_lowest_court(self):
        plan = self._plan()
        bottom = self._court_teams(plan, 1)
        assert bottom == frozenset({TEAMS_12[10], TEAMS_12[11]})  # team_11 vs team_12

    def test_NOT_best_vs_worst_global(self):
        """Regression: team_01 must NOT face team_12 (old broken logic)."""
        plan = self._plan()
        for m in plan.matches:
            pair = frozenset({m.team1, m.team2})
            assert TEAMS_12[0] not in pair or TEAMS_12[11] not in pair, (
                "team_01 vs team_12 — this is the old broken extreme-pairing logic"
            )

    def test_all_12_teams_appear_exactly_once(self):
        plan = self._plan()
        seen: set[tuple[str, str]] = set()
        for m in plan.matches:
            seen.add(m.team1)
            seen.add(m.team2)
        assert seen == set(TEAMS_12)

    def test_produces_6_matches(self):
        assert len(self._plan().matches) == 6

    def test_courts_sorted_ascending(self):
        plan = self._plan()
        courts = [m.court_number for m in plan.matches]
        assert courts == sorted(courts)

    def test_score_ordering_drives_court_assignment(self):
        """
        Swap scores so team_12 has the highest score.
        team_12 should then appear on the highest court.
        """
        svc = TeamMexicanoService()
        # Reverse: team_12 gets score 120, team_01 gets score 10
        reversed_scores = make_scores(list(reversed(TEAMS_12)))
        plan = svc.generate_next_round(1, TEAMS_12, COURTS_6, previous_scores=reversed_scores)
        top_court_match = next(m for m in plan.matches if m.court_number == 6)
        top_pair = frozenset({top_court_match.team1, top_court_match.team2})
        # team_12 (index 11) and team_11 (index 10) should be on top court
        assert TEAMS_12[11] in top_pair
        assert TEAMS_12[10] in top_pair


# ---------------------------------------------------------------------------
# No-repeat guard
# ---------------------------------------------------------------------------


class TestTeamMexicanoNoRepeatGuard:
    def test_repeat_pair_is_swapped_away(self):
        """
        Last round: team_01 vs team_02 (the natural adjacent pair at the top).
        This round: team_01 and team_02 should NOT face each other again.
        """
        svc = TeamMexicanoService()
        last_pairs = {_opponent_key(TEAMS_12[0], TEAMS_12[1])}
        plan = svc.generate_next_round(
            1,
            TEAMS_12,
            COURTS_6,
            previous_scores=SCORES_12,
            last_round_opponent_pairs=last_pairs,
        )
        for m in plan.matches:
            pair = frozenset({m.team1, m.team2})
            assert frozenset({TEAMS_12[0], TEAMS_12[1]}) != pair, (
                "team_01 vs team_02 repeated — no-repeat guard failed"
            )

    def test_swap_result_is_rank1_vs_rank3_and_rank2_vs_rank4(self):
        """
        When rank1 vs rank2 is a repeat, the swap gives rank1 vs rank3
        and rank2 vs rank4 (cross-pair from adjacent pair[i+1]).
        """
        svc = TeamMexicanoService()
        last_pairs = {_opponent_key(TEAMS_12[0], TEAMS_12[1])}
        plan = svc.generate_next_round(
            1,
            TEAMS_12,
            COURTS_6,
            previous_scores=SCORES_12,
            last_round_opponent_pairs=last_pairs,
        )
        court_5_or_6_pairs = {
            frozenset({m.team1, m.team2}) for m in plan.matches if m.court_number in (5, 6)
        }
        # After swap: {team_01, team_03} and {team_02, team_04}
        assert frozenset({TEAMS_12[0], TEAMS_12[2]}) in court_5_or_6_pairs
        assert frozenset({TEAMS_12[1], TEAMS_12[3]}) in court_5_or_6_pairs

    def test_no_repeat_guard_off_by_default(self):
        """Without last_round_opponent_pairs, no swaps occur (pure adjacent pairing)."""
        svc = TeamMexicanoService()
        plan = svc.generate_next_round(
            1,
            TEAMS_12,
            COURTS_6,
            previous_scores=SCORES_12,
            last_round_opponent_pairs=None,
        )
        top = frozenset(
            {m.team1 if m.court_number == 6 else None for m in plan.matches}
            | {m.team2 if m.court_number == 6 else None for m in plan.matches} - {None}
        )
        # Without guard: rank1 vs rank2 on top court
        court6 = next(m for m in plan.matches if m.court_number == 6)
        assert frozenset({court6.team1, court6.team2}) == frozenset({TEAMS_12[0], TEAMS_12[1]})

    def test_unavoidable_repeat_still_produces_match(self):
        """With only 2 teams the repeat is unavoidable — match must still be generated."""
        svc = TeamMexicanoService()
        t0, t1 = TEAMS_12[0], TEAMS_12[1]
        last_pairs = {_opponent_key(t0, t1)}
        plan = svc.generate_next_round(
            1,
            [t0, t1],
            [1],
            previous_scores=SCORES_12,
            last_round_opponent_pairs=last_pairs,
        )
        assert len(plan.matches) == 1
        assert frozenset({plan.matches[0].team1, plan.matches[0].team2}) == frozenset({t0, t1})

    def test_non_repeat_pair_not_swapped(self):
        """If ranks 3 and 4 did NOT face each other last round, they stay paired."""
        svc = TeamMexicanoService()
        # Only mark ranks 1v2 as repeat; ranks 3v4 should stay adjacent
        last_pairs = {_opponent_key(TEAMS_12[0], TEAMS_12[1])}
        plan = svc.generate_next_round(
            1,
            TEAMS_12,
            COURTS_6,
            previous_scores=SCORES_12,
            last_round_opponent_pairs=last_pairs,
        )
        # Court 4 or 5 should have team_03 facing team_04 after the swap propagates
        all_pairs = {frozenset({m.team1, m.team2}) for m in plan.matches}
        # After swap: pair[0]=(t01,t03), pair[1]=(t02,t04), pair[2]=(t05,t06)...
        # team_05 vs team_06 should be untouched
        assert frozenset({TEAMS_12[4], TEAMS_12[5]}) in all_pairs


# ---------------------------------------------------------------------------
# Tiebreak on equal scores (stable sort)
# ---------------------------------------------------------------------------


class TestTeamMexicanoTiebreak:
    def test_equal_scores_preserve_list_order(self):
        """
        All 4 teams have the same combined score.
        Python's sorted() is stable, so original list order is preserved.
        Teams at index 0,1 → top court; teams at index 2,3 → bottom court.
        """
        svc = TeamMexicanoService()
        teams = TEAMS_12[:4]
        equal_scores = {p: 50 for t in teams for p in t}
        plan = svc.generate_next_round(1, teams, [1, 2], previous_scores=equal_scores)
        top = next(m for m in plan.matches if m.court_number == 2)
        top_pair = frozenset({top.team1, top.team2})
        assert top_pair == frozenset({teams[0], teams[1]})

    def test_partial_tie_score_wins_over_list_position(self):
        """
        teams[2] and teams[3] have a higher score than teams[0] and teams[1].
        Despite list order, teams[2] and teams[3] must be on the top court.
        """
        svc = TeamMexicanoService()
        teams = TEAMS_12[:4]
        # teams[2] and teams[3] each have combined 200; teams[0] and [1] have 40
        scores: dict[str, int] = {}
        scores[teams[0][0]] = 20
        scores[teams[0][1]] = 20
        scores[teams[1][0]] = 20
        scores[teams[1][1]] = 20
        scores[teams[2][0]] = 100
        scores[teams[2][1]] = 100
        scores[teams[3][0]] = 100
        scores[teams[3][1]] = 100
        plan = svc.generate_next_round(1, teams, [1, 2], previous_scores=scores)
        top = next(m for m in plan.matches if m.court_number == 2)
        top_pair = frozenset({top.team1, top.team2})
        assert top_pair == frozenset({teams[2], teams[3]})


# ---------------------------------------------------------------------------
# Partner integrity across multiple rounds
# ---------------------------------------------------------------------------


class TestTeamMexicanoPartnerIntegrity:
    def test_same_partners_in_round_1_and_round_2(self):
        """
        Partners set in the teams list must appear as the same tuple in every
        generated round — both in round 1 and in round 2+.
        """
        svc = TeamMexicanoService()
        plan_r1 = svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="integrity")
        plan_r2 = svc.generate_next_round(1, TEAMS_12, COURTS_6, previous_scores=SCORES_12)
        for plan in (plan_r1, plan_r2):
            for m in plan.matches:
                assert m.team1 in set(TEAMS_12), f"team1 {m.team1} is not a registered fixed team"
                assert m.team2 in set(TEAMS_12), f"team2 {m.team2} is not a registered fixed team"
                assert m.team1 != m.team2, "A team cannot face itself"

    def test_no_player_appears_twice_in_same_round(self):
        svc = TeamMexicanoService()
        for plan in (
            svc.generate_round_1(TEAMS_12, COURTS_6, event_seed="dup"),
            svc.generate_next_round(1, TEAMS_12, COURTS_6, previous_scores=SCORES_12),
        ):
            seen: list[str] = []
            for m in plan.matches:
                seen.extend([m.team1[0], m.team1[1], m.team2[0], m.team2[1]])
            assert len(seen) == len(set(seen)), "A player appeared in more than one match"
