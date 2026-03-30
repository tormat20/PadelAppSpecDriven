# Scheduling Logic Reference

Describes how rounds are scheduled for each event type in the padel tournament app.
Covers player-facing behaviour and developer-facing implementation detail.

---

## Event types

| Type | Partners | Rounds | Key property |
|---|---|---|---|
| Americano | Rotate every match | Pre-computed full schedule | Each pair partners exactly once |
| Winners Court | Rotate by result | Generated after each round | Winners move up, losers move down |
| Ranked Box | Fixed groups of 4 | Repeating 3-round cycle | Round-robin within each box |
| Mexicano | Rotate each round | Generated after each round | Swiss-adjacent quartets |
| Team Mexicano | Fixed forever | Generated after each round | Swiss-adjacent pairs of teams |

---

## Mexicano (individual players, rotating partners)

### Round 1

- All players are randomly shuffled using a seed derived from `event_id`.
- Shuffled players are split into consecutive groups of 4.
- Within each group the pairing algorithm selects partners (see _Within-quartet pairing_ below).
- The highest-ranked group plays on the highest court number; lowest on the lowest.
- Using the same `event_id` always produces the same round 1 draw (reproducible).
- Different events produce different draws.

### Round 2 and beyond

**Player ranking**

Players are ranked by a three-level tiebreak key applied in this order:

1. Total score — descending (higher is better)
2. Previous rank position — ascending (prior rank 1 beats prior rank 2 on a tie)
3. Player ID — alphabetical ascending (final tie-breaker, deterministic)

The ranker lives in `backend/app/services/round_service.py:_rank_players_for_mexicano`.

**Quartet grouping**

After ranking:
- Determine `active_match_count = min(players // 4, available_courts)`.
- Take the top `active_match_count × 4` players — remaining players sit out.
- Split into consecutive quartets: rank 1–4 form the top quartet, rank 5–8 the second, etc.
- The top quartet plays on the highest court number.

**Within-quartet pairing**

Two pairings are possible for any quartet `[p1, p2, p3, p4]`:
- Candidate 0: `(p1, p2)` vs `(p3, p4)`
- Candidate 1: `(p1, p3)` vs `(p2, p4)`

The algorithm applies a penalty to each candidate based on how many of the two pairs were partners in the last round (from `partner_history`). The candidate with the lower penalty is selected. On a tie, candidate 0 wins.

**Court assignment**

Matches are output sorted by court number ascending (court 1 first). Internally the top quartet always goes to the highest available court.

**Source:** `backend/app/domain/scheduling.py:_generate_mexicano_matches`

---

## Team Mexicano (fixed partner pairs, rotating opponents)

Partners are assigned once when an event is created and never change. Only opponents rotate.

### Round 1

- All teams (fixed partner pairs) are randomly shuffled using a seed derived from `event_id`.
- Shuffled teams are paired: team[0] vs team[1], team[2] vs team[3], etc.
- The highest-ranked pair plays on the highest court number.
- Using the same `event_id` always produces the same draw (reproducible).

### Round 2 and beyond

**Team ranking**

Teams are sorted by combined score of both players — descending. On equal scores the original DB insertion order is preserved (stable sort).

**Swiss-adjacent pairing**

After sorting:
- Rank 1 vs rank 2 on the highest court.
- Rank 3 vs rank 4 on the next court.
- And so on down the list.

This is **not** best-vs-worst globally (that was the pre-fix bug). Adjacent pairs compete.

**No-repeat guard**

If an adjacent pair faced each other in the previous round, the guard swaps them with the next pair:
- Before swap: (rank1 vs rank2), (rank3 vs rank4)
- After swap: (rank1 vs rank3), (rank2 vs rank4)

The swap only happens when it would reduce repeats. If both alternatives are repeats, the original pairing is kept (unavoidable repeat).

**Court assignment**

Same as Mexicano: top pair → highest court. Output sorted ascending by court number.

**Source:** `backend/app/services/team_mexicano_service.py`

---

## Developer reference

### Key files

| File | Responsibility |
|---|---|
| `backend/app/domain/scheduling.py` | `generate_round_1`, `generate_next_round`, Mexicano match generation, Winners Court, Ranked Box |
| `backend/app/services/mexicano_service.py` | `MexicanoService` — wraps `generate_round_1` with `event_seed`, threads `partner_history` |
| `backend/app/services/team_mexicano_service.py` | `TeamMexicanoService` — round 1, next round, no-repeat guard, `build_last_round_opponent_pairs` |
| `backend/app/services/round_service.py` | `_rank_players_for_mexicano`, `_calculate_player_totals`, `next_round` dispatcher |
| `backend/app/services/event_service.py` | `start_event` — dispatches round 1 to the correct service |
| `backend/app/repositories/sql/event_teams/list_by_event.sql` | Returns teams ordered by `id` (insertion order) |

### Seed handling

Both Mexicano and Team Mexicano pass `event_seed=str(event_id)` to their respective round-1 generators. The seed is used to initialise a `random.Random` instance, keeping the shuffle isolated from global state and reproducible per event.

### `partner_history` (Mexicano only)

`partner_history: dict[str, str]` maps each player ID to their partner ID from the most recent completed round. Built in `round_service.py` from the previous round's matches and passed into `generate_next_round`.

### `last_round_pairs` (Team Mexicano only)

`last_round_pairs: set[frozenset[str]]` contains one entry per match from the previous round, where each entry is a frozenset of the two team IDs that faced each other. Built by `build_last_round_opponent_pairs` in `team_mexicano_service.py` and passed into `generate_next_round_team_mexicano`.

---

## Test coverage

| Test file | What it covers |
|---|---|
| `tests/unit/test_scheduling.py` | Core `generate_round_1` / `generate_next_round` contract |
| `tests/unit/test_mexicano_scheduling_behaviour.py` | Mexicano: round 1 randomisation, quartet grouping, within-quartet pairing, tiebreak cascade, court assignment (24-player scenarios) |
| `tests/unit/test_team_mexicano_scheduling.py` | `TeamMexicanoService` unit contract: round 1, next round, adjacent pairing, no-repeat guard |
| `tests/unit/test_team_mexicano_behaviour.py` | Team Mexicano: all behaviour scenarios with 12 teams on 6 courts |
| `tests/integration/test_us2_round_flow.py` | Integration: Mexicano next-round avoids immediate partner repeat |
