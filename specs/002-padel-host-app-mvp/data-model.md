# Data Model - Padel Host App (MVP)

## 1) Player
- **Purpose**: Persistent participant identity used across all events.
- **Fields**:
  - `id` (uuid, PK)
  - `display_name` (text, required)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **Validation**:
  - `display_name` length 2..60
  - unique display name recommended (case-insensitive)

## 2) GlobalRanking
- **Purpose**: Persistent Beat the Box score for each player across events.
- **Fields**:
  - `player_id` (uuid, PK, FK -> Player)
  - `points_total` (integer, default 0)
  - `updated_at` (timestamp)
- **Validation**:
  - one row per player

## 3) Event
- **Purpose**: Single hosted competition session.
- **Fields**:
  - `id` (uuid, PK)
  - `name` (text, required)
  - `event_type` (enum: `Americano|Mexicano|BeatTheBox`)
  - `event_date` (date, required)
  - `status` (enum: `Lobby|Preview|Running|Finished`)
  - `total_rounds` (integer)
  - `round_duration_minutes` (integer)
  - `current_round_index` (integer, nullable before start)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **Validation**:
  - `name` length 3..120
  - Americano/Mexicano: `total_rounds=6`, `round_duration_minutes=15`
  - BeatTheBox: `total_rounds=3`, `round_duration_minutes=30`

## 4) EventCourt
- **Purpose**: Courts selected for a specific event.
- **Fields**:
  - `event_id` (uuid, FK -> Event)
  - `court_number` (int 1..7)
- **Constraints**:
  - PK (`event_id`, `court_number`)

## 5) EventPlayer
- **Purpose**: Player membership in an event.
- **Fields**:
  - `event_id` (uuid, FK -> Event)
  - `player_id` (uuid, FK -> Player)
  - `join_order` (integer)
- **Constraints**:
  - PK (`event_id`, `player_id`)

## 6) Round
- **Purpose**: Numbered round in an event.
- **Fields**:
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> Event)
  - `round_index` (integer, starts at 1)
  - `status` (enum: `Pending|Running|Completed`)
  - `started_at` (timestamp, nullable)
  - `completed_at` (timestamp, nullable)
- **Constraints**:
  - unique (`event_id`, `round_index`)

## 7) Match
- **Purpose**: One 2v2 match on a court for a round.
- **Fields**:
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> Event)
  - `round_id` (uuid, FK -> Round)
  - `court_number` (int 1..7)
  - `team_a_player_1_id` (uuid, FK -> Player)
  - `team_a_player_2_id` (uuid, FK -> Player)
  - `team_b_player_1_id` (uuid, FK -> Player)
  - `team_b_player_2_id` (uuid, FK -> Player)
  - `input_mode` (enum: `WinLoss|Score24|WinLossDraw`)
  - `winner_team` (nullable int: 1 or 2)
  - `is_draw` (boolean, default false)
  - `score_a` (nullable integer)
  - `score_b` (nullable integer)
  - `status` (enum: `Pending|Completed`)
  - `completed_at` (timestamp, nullable)
- **Validation**:
  - exactly 4 distinct players per match
  - Mexicano: `score_a + score_b = 24`
  - Draw requires `winner_team` null

## 8) PlayerRoundScore
- **Purpose**: Per-player score delta and running event total for each round.
- **Fields**:
  - `event_id` (uuid, FK -> Event)
  - `round_id` (uuid, FK -> Round)
  - `player_id` (uuid, FK -> Player)
  - `score_delta` (integer)
  - `event_total_after_round` (integer)
- **Constraints**:
  - PK (`round_id`, `player_id`)

## 9) EventStanding
- **Purpose**: Final event leaderboard snapshot.
- **Fields**:
  - `event_id` (uuid, FK -> Event)
  - `player_id` (uuid, FK -> Player)
  - `total_points` (integer)
  - `rank_position` (integer)
- **Constraints**:
  - PK (`event_id`, `player_id`)

## 10) RankingLedger
- **Purpose**: Auditable Beat the Box global ranking changes per match result.
- **Fields**:
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> Event)
  - `round_id` (uuid, FK -> Round)
  - `match_id` (uuid, FK -> Match)
  - `player_id` (uuid, FK -> Player)
  - `delta_points` (integer)
  - `total_after_update` (integer)
  - `created_at` (timestamp)

## Relationships
- Event 1..* EventCourt
- Event 1..* EventPlayer
- Event 1..* Round
- Round 1..* Match
- Round 1..* PlayerRoundScore
- Event 1..* EventStanding
- Player 1..1 GlobalRanking
- Player 1..* RankingLedger entries

## State Transitions

### Event status
- `Lobby -> Preview -> Running -> Finished`
- Invalid transitions are rejected (for example `Lobby -> Finished`).

### Round status
- `Pending -> Running -> Completed`
- Round becomes `Completed` only when all matches in round are completed.

### Match status
- `Pending -> Completed`
- Completion requires valid mode-specific result payload.
