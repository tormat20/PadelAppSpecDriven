import random
from collections import defaultdict

from app.domain.enums import EventType, ResultType
from app.domain.models import Match, RoundPlan, RoundPlanMatch

Pairing = tuple[tuple[str, str], tuple[str, str]]


def generate_round_1(event_type: EventType, player_ids: list[str], courts: list[int]) -> RoundPlan:
    if len(player_ids) < 4:
        raise ValueError("At least 4 players are required")
    if len(player_ids) % 4 != 0:
        raise ValueError("Players must be divisible by 4")

    ordered_courts = get_ordered_courts(courts)
    max_matches = min(len(ordered_courts), len(player_ids) // 4)
    matches: list[RoundPlanMatch] = []
    result_type = _result_type(event_type)

    for i in range(max_matches):
        base = i * 4
        quartet = player_ids[base : base + 4]
        matches.append(
            RoundPlanMatch(
                court_number=ordered_courts[i],
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
    previous_matches: list[Match] | None = None,
    previous_rank_map: dict[str, int] | None = None,
    partner_history: dict[str, str] | None = None,
    event_seed: str = "",
) -> RoundPlan:
    next_round = current_round + 1
    ordered_courts = get_ordered_courts(courts)
    if not ordered_courts:
        raise ValueError("At least one court is required")

    if event_type == EventType.AMERICANO:
        if not previous_matches:
            round_plan = generate_round_1(event_type, ordered_player_ids, ordered_courts)
            return RoundPlan(round_number=next_round, matches=round_plan.matches)
        return RoundPlan(
            round_number=next_round,
            matches=_generate_americano_matches(previous_matches, ordered_courts, event_seed),
        )

    if event_type == EventType.MEXICANO:
        return RoundPlan(
            round_number=next_round,
            matches=_generate_mexicano_matches(
                ordered_player_ids,
                ordered_courts,
                partner_history or {},
            ),
        )

    if event_type == EventType.BEAT_THE_BOX:
        if not previous_matches:
            round_plan = generate_round_1(event_type, ordered_player_ids, ordered_courts)
            return RoundPlan(round_number=next_round, matches=round_plan.matches)
        return RoundPlan(
            round_number=next_round,
            matches=_generate_beat_the_box_matches(previous_matches, next_round),
        )

    raise ValueError("Unsupported event type")


def get_ordered_courts(courts: list[int]) -> list[int]:
    return sorted(set(courts))


def get_court_index(courts: list[int], court_number: int) -> int:
    if court_number not in courts:
        raise ValueError(f"Court {court_number} not in selected courts")
    return courts.index(court_number)


def _clamp_court_index(idx: int, court_count: int) -> int:
    return max(0, min(court_count - 1, idx))


def _generate_americano_matches(
    previous_matches: list[Match],
    ordered_courts: list[int],
    event_seed: str,
) -> list[RoundPlanMatch]:
    target_buckets: dict[int, list[str]] = defaultdict(list)

    for match in previous_matches:
        players1 = [match.team1_player1_id, match.team1_player2_id]
        players2 = [match.team2_player1_id, match.team2_player2_id]

        court_idx = get_court_index(ordered_courts, match.court_number)
        if match.winner_team == 1:
            winners, losers = players1, players2
        elif match.winner_team == 2:
            winners, losers = players2, players1
        else:
            # Americano must have winner; defensive fallback keeps current court.
            winners, losers = players1, players2

        target_buckets[_clamp_court_index(court_idx + 1, len(ordered_courts))].extend(winners)
        target_buckets[_clamp_court_index(court_idx - 1, len(ordered_courts))].extend(losers)

    active_court_count = max(1, len(previous_matches))
    bucket_indices = sorted(target_buckets.keys())
    if len(bucket_indices) > active_court_count:
        bucket_indices = bucket_indices[-active_court_count:]

    overflow: list[str] = []
    for idx in bucket_indices:
        bucket = target_buckets[idx]
        if len(bucket) <= 4:
            continue
        rng = random.Random(f"{event_seed}:{ordered_courts[idx]}:{len(bucket)}")
        shuffled = bucket[:]
        rng.shuffle(shuffled)
        target_buckets[idx] = shuffled[:4]
        overflow.extend(shuffled[4:])

    for player in overflow:
        for idx in bucket_indices:
            if len(target_buckets[idx]) < 4:
                target_buckets[idx].append(player)
                break

    # Backfill underfilled courts deterministically from lowest-index bucket surplus.
    for idx in bucket_indices:
        while len(target_buckets[idx]) < 4:
            donor_idx = next(
                (
                    candidate
                    for candidate in bucket_indices
                    if candidate != idx and len(target_buckets[candidate]) > 4
                ),
                None,
            )
            if donor_idx is None:
                break
            target_buckets[idx].append(target_buckets[donor_idx].pop())

    matches: list[RoundPlanMatch] = []
    for idx in sorted(bucket_indices):
        players = target_buckets[idx][:4]
        if len(players) < 4:
            continue
        matches.append(
            RoundPlanMatch(
                court_number=ordered_courts[idx],
                team1=(players[0], players[1]),
                team2=(players[2], players[3]),
                result_type=ResultType.WIN_LOSS,
            )
        )

    if not matches:
        round_plan = generate_round_1(
            EventType.AMERICANO, _flatten_previous_players(previous_matches), ordered_courts
        )
        return round_plan.matches
    return matches


def _generate_mexicano_matches(
    ordered_player_ids: list[str],
    ordered_courts: list[int],
    partner_history: dict[str, str],
) -> list[RoundPlanMatch]:
    active_match_count = min(len(ordered_player_ids) // 4, len(ordered_courts))
    playable_players = ordered_player_ids[: active_match_count * 4]
    top_courts = sorted(ordered_courts, reverse=True)[:active_match_count]

    matches: list[RoundPlanMatch] = []
    for match_idx in range(active_match_count):
        base = match_idx * 4
        quartet = playable_players[base : base + 4]
        team1, team2 = _choose_pairing_for_quartet(quartet, partner_history)
        matches.append(
            RoundPlanMatch(
                court_number=top_courts[match_idx],
                team1=team1,
                team2=team2,
                result_type=ResultType.SCORE_24,
            )
        )
    return sorted(matches, key=lambda match: match.court_number)


def _generate_beat_the_box_matches(
    previous_matches: list[Match], next_round_number: int
) -> list[RoundPlanMatch]:
    cycle_step = ((next_round_number - 1) % 3) + 1
    pairings_by_step: dict[int, tuple[tuple[int, int], tuple[int, int]]] = {
        1: ((0, 1), (2, 3)),
        2: ((0, 2), (1, 3)),
        3: ((0, 3), (1, 2)),
    }
    pairing = pairings_by_step[cycle_step]

    matches: list[RoundPlanMatch] = []
    for match in previous_matches:
        quartet = sorted(
            [
                match.team1_player1_id,
                match.team1_player2_id,
                match.team2_player1_id,
                match.team2_player2_id,
            ]
        )
        team1 = (quartet[pairing[0][0]], quartet[pairing[0][1]])
        team2 = (quartet[pairing[1][0]], quartet[pairing[1][1]])
        matches.append(
            RoundPlanMatch(
                court_number=match.court_number,
                team1=team1,
                team2=team2,
                result_type=ResultType.WIN_LOSS_DRAW,
            )
        )
    return sorted(matches, key=lambda planned: planned.court_number)


def _choose_pairing_for_quartet(
    quartet: list[str],
    partner_history: dict[str, str],
) -> Pairing:
    candidates: list[Pairing] = [
        ((quartet[0], quartet[1]), (quartet[2], quartet[3])),
        ((quartet[0], quartet[2]), (quartet[1], quartet[3])),
        ((quartet[0], quartet[3]), (quartet[1], quartet[2])),
    ]

    best_pairing = candidates[0]
    best_penalty = 10
    for candidate in candidates:
        penalty = _pairing_repeat_penalty(candidate, partner_history)
        if penalty < best_penalty:
            best_penalty = penalty
            best_pairing = candidate
    return best_pairing


def _pairing_repeat_penalty(pairing: Pairing, partner_history: dict[str, str]) -> int:
    penalty = 0
    for team in pairing:
        a, b = team
        if partner_history.get(a) == b:
            penalty += 1
        if partner_history.get(b) == a:
            penalty += 1
    return penalty


def _flatten_previous_players(previous_matches: list[Match]) -> list[str]:
    players: list[str] = []
    for match in previous_matches:
        players.extend(
            [
                match.team1_player1_id,
                match.team1_player2_id,
                match.team2_player1_id,
                match.team2_player2_id,
            ]
        )
    return players


def _result_type(event_type: EventType) -> ResultType:
    if event_type == EventType.AMERICANO:
        return ResultType.WIN_LOSS
    if event_type == EventType.MEXICANO:
        return ResultType.SCORE_24
    return ResultType.WIN_LOSS_DRAW
