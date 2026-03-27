import random

from app.domain.enums import ResultType
from app.domain.models import RoundPlan, RoundPlanMatch
from app.domain.scheduling import get_ordered_courts

Team = tuple[str, str]
OpponentPair = frozenset  # frozenset of two frozensets, each a team


class TeamMexicanoService:
    """Scheduling for Team Mexicano events.

    Rules:
    - Partners are fixed for the whole event and never change.
    - Round 1: opponent matchups are randomised (seeded for reproducibility).
    - Round 2+: teams are sorted by combined score descending, then paired
      swiss-adjacent (rank 1 vs 2, rank 3 vs 4, ...).
      If two adjacent teams faced each other last round, they are swapped with
      the next pair (e.g. 1v3 and 2v4) to avoid the repeat.
    """

    # ------------------------------------------------------------------
    # Round 1
    # ------------------------------------------------------------------

    def generate_round_1(
        self,
        fixed_teams: list[Team],
        courts: list[int],
        event_seed: str = "",
    ) -> RoundPlan:
        """Randomise opponent matchups for round 1."""
        ordered_courts = get_ordered_courts(courts)
        num_matches = min(len(fixed_teams) // 2, len(ordered_courts))
        top_courts = sorted(ordered_courts, reverse=True)[:num_matches]

        teams_for_matches = list(fixed_teams[: num_matches * 2])
        rng = random.Random(event_seed or "team-mexicano-r1")
        rng.shuffle(teams_for_matches)

        matches: list[RoundPlanMatch] = []
        for i in range(num_matches):
            matches.append(
                RoundPlanMatch(
                    court_number=top_courts[i],
                    team1=teams_for_matches[i * 2],
                    team2=teams_for_matches[i * 2 + 1],
                    result_type=ResultType.SCORE_24,
                )
            )
        return RoundPlan(
            round_number=1,
            matches=sorted(matches, key=lambda m: m.court_number),
        )

    # ------------------------------------------------------------------
    # Round N+1
    # ------------------------------------------------------------------

    def generate_next_round(
        self,
        current_round: int,
        fixed_teams: list[Team],
        courts: list[int],
        previous_scores: dict[str, int] | None = None,
        last_round_opponent_pairs: set[frozenset] | None = None,
    ) -> RoundPlan:
        """Generate the next round using swiss-adjacent pairing with no-repeat guard.

        Teams are sorted by combined score descending.  Adjacent pairs play each
        other (rank 1 vs 2, rank 3 vs 4, ...).  When an adjacent pair repeated
        from last round is detected the two teams swap with the next pair so that
        the matchup avoids the repeat when possible.
        """
        ordered_courts = get_ordered_courts(courts)
        num_matches = min(len(fixed_teams) // 2, len(ordered_courts))
        top_courts = sorted(ordered_courts, reverse=True)[:num_matches]
        next_round = current_round + 1

        def team_score(team: Team) -> int:
            if not previous_scores:
                return 0
            return previous_scores.get(team[0], 0) + previous_scores.get(team[1], 0)

        ranked = sorted(fixed_teams, key=team_score, reverse=True)
        active = ranked[: num_matches * 2]

        # Build ordered list of adjacent pairs: (active[0],active[1]), (active[2],active[3]),...
        pairs: list[tuple[Team, Team]] = [
            (active[i * 2], active[i * 2 + 1]) for i in range(num_matches)
        ]

        # Apply no-repeat guard: if pair[i] repeated last round, swap one team with pair[i+1]
        if last_round_opponent_pairs:
            pairs = _apply_no_repeat_swaps(pairs, last_round_opponent_pairs)

        matches: list[RoundPlanMatch] = []
        for i, (team_a, team_b) in enumerate(pairs):
            matches.append(
                RoundPlanMatch(
                    court_number=top_courts[i],
                    team1=team_a,
                    team2=team_b,
                    result_type=ResultType.SCORE_24,
                )
            )

        return RoundPlan(
            round_number=next_round,
            matches=sorted(matches, key=lambda m: m.court_number),
        )


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def _opponent_key(team_a: Team, team_b: Team) -> frozenset:
    """Canonical key for an opponent pair regardless of order."""
    return frozenset({frozenset(team_a), frozenset(team_b)})


def _apply_no_repeat_swaps(
    pairs: list[tuple[Team, Team]],
    last_round_opponent_pairs: set[frozenset],
) -> list[tuple[Team, Team]]:
    """Swap adjacent pairs to avoid repeating last-round matchups where possible.

    For each pair i that is a repeat, swap team_b of pair[i] with team_a of
    pair[i+1], giving: (a_i vs a_{i+1}) and (b_i vs b_{i+1}).  Only swap if
    neither resulting matchup is also a repeat (prefer no-repeat; do nothing if
    swap would just introduce a different repeat).
    """
    result = list(pairs)
    n = len(result)
    for i in range(n - 1):
        team_a, team_b = result[i]
        if _opponent_key(team_a, team_b) not in last_round_opponent_pairs:
            continue
        # This pair is a repeat — try swapping with next pair
        next_a, next_b = result[i + 1]
        new_pair_i = (team_a, next_a)
        new_pair_next = (team_b, next_b)
        # Only apply swap if it eliminates the repeat and does not create two new ones
        swapped_repeats = sum(
            1
            for pa, pb in (new_pair_i, new_pair_next)
            if _opponent_key(pa, pb) in last_round_opponent_pairs
        )
        original_repeats = sum(
            1
            for pa, pb in (result[i], result[i + 1])
            if _opponent_key(pa, pb) in last_round_opponent_pairs
        )
        if swapped_repeats < original_repeats:
            result[i] = new_pair_i
            result[i + 1] = new_pair_next
    return result


def build_last_round_opponent_pairs(matches: list) -> set[frozenset]:
    """Build the set of opponent-pair keys from a completed round's matches.

    Each key is frozenset({frozenset(team1_players), frozenset(team2_players)}).
    """
    pairs: set[frozenset] = set()
    for match in matches:
        team_a = (match.team1_player1_id, match.team1_player2_id)
        team_b = (match.team2_player1_id, match.team2_player2_id)
        pairs.add(_opponent_key(team_a, team_b))
    return pairs
