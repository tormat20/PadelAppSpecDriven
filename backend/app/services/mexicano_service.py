from app.domain.enums import EventType, ResultType
from app.domain.models import RoundPlan, RoundPlanMatch
from app.domain.scheduling import (
    generate_next_round,
    generate_round_1,
    get_ordered_courts,
)


class MexicanoService:
    def generate_round_1(self, player_ids: list[str], courts: list[int]):
        return generate_round_1(EventType.MEXICANO, player_ids, courts)

    def generate_next_round(
        self,
        current_round: int,
        ordered_player_ids: list[str],
        courts: list[int],
        previous_matches=None,
        previous_rank_map=None,
        partner_history=None,
        event_seed: str = "",
    ):
        return generate_next_round(
            EventType.MEXICANO,
            current_round,
            ordered_player_ids,
            courts,
            previous_matches=previous_matches,
            previous_rank_map=previous_rank_map,
            partner_history=partner_history,
            event_seed=event_seed,
        )

    def generate_round_1_team_mexicano(
        self,
        fixed_teams: list[tuple[str, str]],
        courts: list[int],
    ) -> RoundPlan:
        """Generate round 1 for a Team Mexicano event with fixed partner pairs.

        Fixed teams rotate opponents/courts but never swap partners.
        Teams are ranked best-vs-worst: top-ranked team faces bottom-ranked, etc.
        """
        ordered_courts = get_ordered_courts(courts)
        num_matches = min(len(fixed_teams) // 2, len(ordered_courts))
        top_courts = sorted(ordered_courts, reverse=True)[:num_matches]

        matches: list[RoundPlanMatch] = []
        # Pair teams: team[0] vs team[-1], team[1] vs team[-2], etc.
        teams_for_matches = fixed_teams[: num_matches * 2]
        for i in range(num_matches):
            team_a = teams_for_matches[i]
            team_b = teams_for_matches[-(i + 1)]
            matches.append(
                RoundPlanMatch(
                    court_number=top_courts[i],
                    team1=team_a,
                    team2=team_b,
                    result_type=ResultType.SCORE_24,
                )
            )
        return RoundPlan(round_number=1, matches=sorted(matches, key=lambda m: m.court_number))

    def generate_next_round_team_mexicano(
        self,
        current_round: int,
        fixed_teams: list[tuple[str, str]],
        courts: list[int],
        previous_scores: dict[str, int] | None = None,
        event_seed: str = "",
    ) -> RoundPlan:
        """Generate the next round for a Team Mexicano event.

        Fixed partner pairs are preserved; only opponents and court assignments rotate.
        Teams are re-ranked by total score (highest first) and paired best-vs-worst.
        """
        ordered_courts = get_ordered_courts(courts)
        num_matches = min(len(fixed_teams) // 2, len(ordered_courts))
        top_courts = sorted(ordered_courts, reverse=True)[:num_matches]
        next_round = current_round + 1

        # Re-order teams by their combined score (sum of both players)
        def team_score(team: tuple[str, str]) -> int:
            if not previous_scores:
                return 0
            return previous_scores.get(team[0], 0) + previous_scores.get(team[1], 0)

        ranked_teams = sorted(fixed_teams, key=team_score, reverse=True)
        teams_for_matches = ranked_teams[: num_matches * 2]

        matches: list[RoundPlanMatch] = []
        for i in range(num_matches):
            team_a = teams_for_matches[i]
            team_b = teams_for_matches[-(i + 1)]
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
