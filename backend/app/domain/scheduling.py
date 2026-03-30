import random
from collections import defaultdict

from app.domain.enums import EventType, ResultType
from app.domain.models import Match, RoundPlan, RoundPlanMatch

Pairing = tuple[tuple[str, str], tuple[str, str]]


def generate_round_1(
    event_type: EventType,
    player_ids: list[str],
    courts: list[int],
    event_seed: str = "",
) -> RoundPlan:
    if len(player_ids) < 4:
        raise ValueError("At least 4 players are required")
    if len(player_ids) % 4 != 0:
        raise ValueError("Players must be divisible by 4")

    ordered_courts = get_ordered_courts(courts)
    max_matches = min(len(ordered_courts), len(player_ids) // 4)
    matches: list[RoundPlanMatch] = []
    result_type = _result_type(event_type)

    # Shuffle players before grouping so round 1 is randomised but reproducible.
    shuffled = list(player_ids)
    rng = random.Random(event_seed or "mexicano-r1")
    rng.shuffle(shuffled)

    for i in range(max_matches):
        base = i * 4
        quartet = shuffled[base : base + 4]
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

    if event_type == EventType.WINNERS_COURT:
        if not previous_matches:
            round_plan = generate_round_1(event_type, ordered_player_ids, ordered_courts)
            return RoundPlan(round_number=next_round, matches=round_plan.matches)
        return RoundPlan(
            round_number=next_round,
            matches=_generate_winners_court_matches(previous_matches, ordered_courts, event_seed),
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

    if event_type == EventType.RANKED_BOX:
        if not previous_matches:
            round_plan = generate_round_1(event_type, ordered_player_ids, ordered_courts)
            return RoundPlan(round_number=next_round, matches=round_plan.matches)
        return RoundPlan(
            round_number=next_round,
            matches=_generate_ranked_box_matches(previous_matches, next_round),
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


def _generate_winners_court_matches(
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
            EventType.WINNERS_COURT, _flatten_previous_players(previous_matches), ordered_courts
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


def _generate_ranked_box_matches(
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
    if event_type == EventType.WINNERS_COURT:
        return ResultType.WIN_LOSS
    if event_type == EventType.MEXICANO:
        return ResultType.SCORE_24
    if event_type == EventType.AMERICANO:
        return ResultType.SCORE_24
    return ResultType.WIN_LOSS_DRAW


# ─── Americano schedule tables ────────────────────────────────────────────────
# Each entry is a list of rounds; each round is a list of (team1, team2) tuples
# where team1 = (p_idx_a, p_idx_b) and team2 = (p_idx_c, p_idx_d).
# Player indices are 0-based positions in the player_ids list.
#
# SCHEDULE_8: Whist optimal table for 8 players, 2 courts, 7 rounds.
# Each player partners every other player exactly once.
_SCHEDULE_8: list[list[tuple[tuple[int, int], tuple[int, int]]]] = [
    [((0, 1), (2, 3)), ((4, 5), (6, 7))],
    [((0, 2), (4, 6)), ((1, 3), (5, 7))],
    [((0, 3), (5, 6)), ((1, 2), (4, 7))],
    [((0, 4), (1, 7)), ((2, 6), (3, 5))],
    [((0, 5), (2, 7)), ((1, 6), (3, 4))],
    [((0, 6), (3, 7)), ((1, 5), (2, 4))],
    [((0, 7), (1, 4)), ((2, 5), (3, 6))],
]

# SCHEDULE_16: Whist optimal table for 16 players, 4 courts, 15 rounds.
_SCHEDULE_16: list[list[tuple[tuple[int, int], tuple[int, int]]]] = [
    [((0, 1), (2, 3)), ((4, 5), (6, 7)), ((8, 9), (10, 11)), ((12, 13), (14, 15))],
    [((0, 2), (4, 8)), ((1, 3), (5, 9)), ((6, 10), (12, 14)), ((7, 11), (13, 15))],
    [((0, 3), (6, 9)), ((1, 2), (7, 8)), ((4, 11), (13, 14)), ((5, 10), (12, 15))],
    [((0, 4), (1, 5)), ((2, 6), (3, 7)), ((8, 12), (9, 13)), ((10, 14), (11, 15))],
    [((0, 5), (3, 6)), ((1, 4), (2, 7)), ((8, 13), (11, 14)), ((9, 12), (10, 15))],
    [((0, 6), (2, 4)), ((1, 7), (3, 5)), ((8, 14), (10, 12)), ((9, 15), (11, 13))],
    [((0, 7), (5, 2)), ((1, 6), (4, 3)), ((8, 15), (9, 14)), ((10, 13), (11, 12))],
    [((0, 8), (1, 9)), ((2, 10), (3, 11)), ((4, 12), (5, 13)), ((6, 14), (7, 15))],
    [((0, 9), (2, 11)), ((1, 8), (3, 10)), ((4, 13), (7, 14)), ((5, 12), (6, 15))],
    [((0, 10), (4, 14)), ((1, 11), (5, 15)), ((2, 8), (6, 12)), ((3, 9), (7, 13))],
    [((0, 11), (5, 14)), ((1, 10), (4, 15)), ((2, 9), (7, 12)), ((3, 8), (6, 13))],
    [((0, 12), (3, 15)), ((1, 13), (2, 14)), ((4, 8), (7, 11)), ((5, 9), (6, 10))],
    [((0, 13), (6, 11)), ((1, 12), (7, 10)), ((2, 15), (4, 9)), ((3, 14), (5, 8))],
    [((0, 14), (7, 9)), ((1, 15), (6, 8)), ((2, 12), (5, 11)), ((3, 13), (4, 10))],
    [((0, 15), (8, 7)), ((1, 14), (9, 6)), ((2, 13), (10, 5)), ((3, 12), (11, 4))],
]

# Z-cyclic seeds for 12 players (3 courts, 11 rounds).
# Each seed defines a base-round pairing; rotate using (idx + round) % 11
# for round offsets 0..10 to get all 11 rounds.
# Format: list of (a, b, c, d) where (a,b) vs (c,d) is a match.
_WHIST_SEEDS_12: list[tuple[int, int, int, int]] = [
    (0, 1, 3, 9),  # court 1 seed
    (0, 4, 7, 10),  # court 2 seed
    (0, 6, 2, 8),  # court 3 seed
]


def _generate_americano_schedule_12(
    player_ids: list[str],
) -> list[list[tuple[tuple[int, int], tuple[int, int]]]]:
    """Z-cyclic construction for 12 players (11 rounds, 3 courts)."""
    mod = 11
    all_rounds: list[list[tuple[tuple[int, int], tuple[int, int]]]] = []
    for r in range(mod):
        round_matches: list[tuple[tuple[int, int], tuple[int, int]]] = []
        for a_base, b_base, c_base, d_base in _WHIST_SEEDS_12:
            a = a_base if a_base == 0 else ((a_base - 1 + r) % mod) + 1
            b = b_base if b_base == 0 else ((b_base - 1 + r) % mod) + 1
            c = c_base if c_base == 0 else ((c_base - 1 + r) % mod) + 1
            d = d_base if d_base == 0 else ((d_base - 1 + r) % mod) + 1
            round_matches.append(((a, b), (c, d)))
        all_rounds.append(round_matches)
    return all_rounds


def _berger_circle_rotation(
    n: int,
) -> list[list[tuple[tuple[int, int], tuple[int, int]]]]:
    """Generate N-1 rounds for N players using Berger circle rotation.

    n must be even (a multiple of 4 is guaranteed by the caller).
    Returns rounds as lists of (team1, team2) pairs where each element is a
    0-based player index.  Each pair (a, b) vs (c, d) partners a with b and c
    with d.
    """
    if n % 2 != 0:
        raise ValueError("n must be even for Berger circle rotation")

    # Build the Berger table: n-1 rounds of n/2 match pairs (player index pairs)
    # using the standard circle method: fix index 0 (pinned), rotate 1..n-1.
    num_rounds = n - 1
    rotating = list(range(1, n))  # [1, 2, ..., n-1]
    all_rounds: list[list[tuple[tuple[int, int], tuple[int, int]]]] = []

    for r in range(num_rounds):
        circle = [0] + rotating  # pinned 0 + current rotation
        # Pair circle[i] with circle[n-1-i] for i in 0..n/2-1
        pairs: list[tuple[int, int]] = []
        for i in range(n // 2):
            pairs.append((circle[i], circle[n - 1 - i]))
        # Group consecutive pairs into matches: (pair[0], pair[1]), (pair[2], pair[3])...
        round_matches: list[tuple[tuple[int, int], tuple[int, int]]] = []
        for j in range(0, len(pairs) - 1, 2):
            round_matches.append((pairs[j], pairs[j + 1]))
        all_rounds.append(round_matches)
        # Rotate: move last element of rotating to front
        rotating = [rotating[-1]] + rotating[:-1]

    return all_rounds


def _apply_court_rotation_optimization(
    schedule: list[list[tuple[tuple[int, int], tuple[int, int]]]],
    num_courts: int,
) -> list[list[tuple[tuple[int, int], tuple[int, int]]]]:
    """Minimize consecutive same-court assignments across rounds.

    Rotate each round's match list so that a player who just played on court C
    is less likely to play on court C again in the next round.  This is a simple
    greedy pass: for each round after the first, find the rotation that minimises
    the number of players who repeat their court from the previous round.
    """
    if not schedule:
        return schedule

    optimized = [schedule[0]]
    for r in range(1, len(schedule)):
        prev = optimized[r - 1]
        curr = schedule[r]
        if not curr:
            optimized.append(curr)
            continue

        # Build player→court map from prev round
        prev_court: dict[int, int] = {}
        for court_idx, ((a, b), (c, d)) in enumerate(prev):
            for p in (a, b, c, d):
                prev_court[p] = court_idx

        best_rotation = 0
        best_penalty = float("inf")
        n = len(curr)
        for rotation in range(n):
            rotated = curr[rotation:] + curr[:rotation]
            penalty = sum(
                1
                for court_idx, ((a, b), (c, d)) in enumerate(rotated)
                for p in (a, b, c, d)
                if prev_court.get(p) == court_idx
            )
            if penalty < best_penalty:
                best_penalty = penalty
                best_rotation = rotation

        best = curr[best_rotation:] + curr[:best_rotation]
        optimized.append(best)

    return optimized


def generate_americano_rounds(player_ids: list[str], courts: list[int]) -> list[RoundPlan]:
    """Generate all rounds for an Americano event at start time.

    Returns a list of RoundPlan objects, one per round.  All rounds are
    pre-computed; no scheduling occurs at next_round() time.

    Supported player counts: any multiple of 4.
    - 8 players: Whist table (7 rounds, 2 courts)
    - 12 players: Z-cyclic construction (11 rounds, 3 courts)
    - 16 players: Whist table (15 rounds, 4 courts)
    - Other multiples of 4: Berger circle rotation fallback
    """
    n = len(player_ids)
    if n < 4 or n % 4 != 0:
        raise ValueError(f"Americano requires a multiple of 4 players; got {n}")

    ordered_courts = get_ordered_courts(courts)
    num_courts = min(len(ordered_courts), n // 4)

    # Select schedule source
    if n == 8:
        raw_schedule = _SCHEDULE_8
    elif n == 16:
        raw_schedule = _SCHEDULE_16
    else:
        raw_schedule = _berger_circle_rotation(n)

    # Apply court-rotation optimisation
    optimized = _apply_court_rotation_optimization(raw_schedule, num_courts)

    # Map indices to player IDs and build RoundPlan list
    plans: list[RoundPlan] = []
    for round_idx, round_matches in enumerate(optimized):
        matches: list[RoundPlanMatch] = []
        for match_idx, ((a, b), (c, d)) in enumerate(round_matches):
            if match_idx >= num_courts:
                break
            court_number = ordered_courts[match_idx]
            matches.append(
                RoundPlanMatch(
                    court_number=court_number,
                    team1=(player_ids[a], player_ids[b]),
                    team2=(player_ids[c], player_ids[d]),
                    result_type=ResultType.SCORE_24,
                )
            )
        plans.append(RoundPlan(round_number=round_idx + 1, matches=matches))

    return plans
