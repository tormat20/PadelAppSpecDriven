# Contract: Next-Round Assignment Rules

## Purpose

Define externally visible scheduling behavior when advancing to the next round for Americano, Mexicano, and BeatTheBox.

## Shared Contract

1. Next round generation is allowed only when current round has no pending matches.
2. All assignments are generated only on selected event courts.
3. Top court is always the highest selected court number; bottom court is the lowest.
4. Identical input state yields identical next-round assignments.

## Americano Contract

1. Match result must always have a winner (no draw outcome).
2. Winners move one court toward top; losers move one court toward bottom.
3. Movement clamps at boundaries (top cannot move higher, bottom cannot move lower).
4. Each court group is capped at 4 players.
5. Overflow from a target court is reassigned to adjacent valid courts by pseudo-random selection using event-seeded determinism.

## Mexicano Contract

1. Players are ranked by cumulative points descending.
2. Ties are resolved by previous round rank, then player ID.
3. Players are grouped into quartets from highest rank downward.
4. Highest quartet is assigned to top court, next quartet to next court, and so on.
5. Players cannot have the same partner as in the immediately previous round.

## BeatTheBox Contract

1. Players remain in the same court group across rounds.
2. Partners rotate with fixed quartet cycle:
   - Cycle round 1: `AB vs CD`
   - Cycle round 2: `AC vs BD`
   - Cycle round 3: `AD vs BC`
3. Cycle repeats for later rounds.

## Verification Targets

- Backend unit tests for scheduling rules and tie-break determinism.
- Integration/contract tests for next-round endpoint behavior by mode.

## Verification Log Placeholders

- [ ] Americano movement and boundary clamping verified
- [ ] Americano overflow seeded determinism verified
- [ ] Mexicano ranking/tie-break and no-repeat partner constraints verified
- [ ] BeatTheBox fixed 3-step cycle verified
