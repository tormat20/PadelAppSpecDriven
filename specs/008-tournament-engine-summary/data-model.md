# Data Model: Tournament Engine and Round Summary Overhaul

## Entities

### 1) CourtLadder
- **Purpose**: Ordered court set for one event, used for movement and boundary clamping.
- **Fields**:
  - `eventId`: owning event identifier
  - `orderedCourts`: ascending unique court numbers selected for event
  - `topCourt`: highest value in `orderedCourts`
  - `bottomCourt`: lowest value in `orderedCourts`
- **Validation rules**:
  - `orderedCourts` must be non-empty.
  - `topCourt` and `bottomCourt` are derived from `orderedCourts`.

### 2) PlayerStandingSnapshot
- **Purpose**: Deterministic ranking basis before generating a new round.
- **Fields**:
  - `playerId`
  - `cumulativePoints`
  - `previousRoundRank`
  - `previousCourtNumber`
- **Validation rules**:
  - Mexicano ordering uses `(cumulativePoints desc, previousRoundRank asc, playerId asc)`.
  - Snapshot must be complete for all active event players.

### 3) RoundAssignment
- **Purpose**: Output plan for one round before persistence.
- **Fields**:
  - `roundNumber`
  - `matches[]`
  - `mode`
- **Validation rules**:
  - Every player appears exactly once in the round.
  - Each match contains exactly 4 distinct players split into 2 teams.

### 4) MatchAssignment
- **Purpose**: Single court pairing in a planned round.
- **Fields**:
  - `courtNumber`
  - `team1`: tuple of two player IDs
  - `team2`: tuple of two player IDs
  - `resultType`
- **Validation rules**:
  - `courtNumber` must exist in event `CourtLadder`.
  - Team tuples cannot share players.

### 5) PartnerHistory
- **Purpose**: Immediate prior-round partner lookup used by Mexicano anti-repeat pairing and BeatTheBox cycle continuity.
- **Fields**:
  - `playerId`
  - `lastRoundPartnerId`
  - `lastRoundNumber`
- **Validation rules**:
  - Mexicano next round must not pair player with `lastRoundPartnerId`.
  - BeatTheBox cycle mapping should evolve from previous cycle step.

### 6) SummaryRoundCell
- **Purpose**: Final summary per-player, per-round numeric value.
- **Fields**:
  - `playerId`
  - `roundNumber`
  - `value` (numeric string in API/UI payload)
- **Validation rules**:
  - Exactly one round cell per player per completed round.
  - `Total` equals numeric sum of a player's round cells.

## Relationships

- `CourtLadder` constrains legal `MatchAssignment.courtNumber` values.
- `PlayerStandingSnapshot` feeds `RoundAssignment` ordering for Mexicano and overflow handling for Americano.
- `PartnerHistory` constrains team construction in `RoundAssignment`.
- `RoundAssignment.matches` become persisted matches used to derive `SummaryRoundCell` values.

## State Transitions

### Round Generation
1. `current_round_completed`
2. `standing_snapshot_built`
3. `mode_rules_applied`
4. `assignment_validated`
5. `next_round_persisted`

### Summary Rendering
1. `finished_event_loaded`
2. `round_columns_built`
3. `player_round_cells_aggregated`
4. `total_computed`
5. `matrix_returned`
