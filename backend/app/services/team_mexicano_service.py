import random

from app.domain.enums import ResultType
from app.domain.models import RoundPlan, RoundPlanMatch
from app.domain.scheduling import get_ordered_courts

Team = tuple[str, str]


class TeamMexicanoService:
    """Scheduling for Team Mexicano events.

    Rules:
    - Partners are fixed for the whole event and never change.
    - Round 1: opponent matchups are randomised (seeded for reproducibility).
    - Round 2+: teams are sorted by combined score descending, then paired
      swiss-adjacent (rank 1 vs 2, rank 3 vs 4, ...).
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
    ) -> RoundPlan:
        """Generate the next round using swiss-adjacent pairing.

        Teams are sorted by combined score descending.  Adjacent pairs play each
        other (rank 1 vs 2, rank 3 vs 4, ...).
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
