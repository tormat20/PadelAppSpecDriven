from app.domain.enums import EventType, ResultType
from app.domain.models import RoundPlan, RoundPlanMatch


def generate_round_1(event_type: EventType, player_ids: list[str], courts: list[int]) -> RoundPlan:
    if len(player_ids) < 4:
        raise ValueError("At least 4 players are required")
    if len(player_ids) % 4 != 0:
        raise ValueError("Players must be divisible by 4")

    max_matches = min(len(courts), len(player_ids) // 4)
    matches: list[RoundPlanMatch] = []
    result_type = _result_type(event_type)

    for i in range(max_matches):
        base = i * 4
        quartet = player_ids[base : base + 4]
        matches.append(
            RoundPlanMatch(
                court_number=courts[i],
                team1=(quartet[0], quartet[1]),
                team2=(quartet[2], quartet[3]),
                result_type=result_type,
            )
        )
    return RoundPlan(round_number=1, matches=matches)


def generate_next_round(
    event_type: EventType,
    current_round: int,
    ordered_player_ids: list[str],
    courts: list[int],
) -> RoundPlan:
    # For MVP planning: deterministic regroup by given ordered list.
    round_plan = generate_round_1(event_type, ordered_player_ids, courts)
    return RoundPlan(round_number=current_round + 1, matches=round_plan.matches)


def _result_type(event_type: EventType) -> ResultType:
    if event_type == EventType.AMERICANO:
        return ResultType.WIN_LOSS
    if event_type == EventType.MEXICANO:
        return ResultType.SCORE_24
    return ResultType.WIN_LOSS_DRAW
