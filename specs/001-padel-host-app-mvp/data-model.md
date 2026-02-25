# Data Model - Padel Host App (MVP)

## 1) Player
- **Purpose**: Persistent identity used across events.
- **Fields**:
  - `id` (uuid or bigint, PK)
  - `display_name` (text, unique, required)
  - `global_ranking_score` (int, default 0)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **Validation**:
  - `display_name` length 2..60
  - no duplicates (case-insensitive uniqueness recommended)

## 2) Event
- **Purpose**: Container for one host-run competition session.
- **Fields**:
  - `id` (uuid or bigint, PK)
  - `event_name` (text, required)
  - `event_type` (enum: `Americano|Mexicano|BeatTheBox`)
  - `event_date` (date, required)
  - `status` (enum: `Lobby|Preview|Running|Finished`)
  - `round_count` (int; 6 for Americano/Mexicano, 3 for BeatTheBox)
  - `round_duration_minutes` (int; 15 or 30)
  - `current_round_number` (int, nullable before start)
  - `created_at`, `updated_at`
- **Validation**:
  - `event_name` length 3..120
  - `event_date` valid ISO date

## 3) EventCourt
- **Purpose**: Selected courts for an event.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `court_number` (int in 1..7)
- **Constraints**:
  - unique (`event_id`, `court_number`)

## 4) EventPlayer
- **Purpose**: Membership of players in an event.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `player_id` (FK -> Player)
  - `seed_order` (int, optional)
- **Constraints**:
  - unique (`event_id`, `player_id`)

## 5) Round
- **Purpose**: One phase in an event.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `round_number` (int >= 1)
  - `status` (enum: `Pending|Running|Completed`)
  - `starts_at`, `ends_at` (nullable timestamps)
- **Constraints**:
  - unique (`event_id`, `round_number`)

## 6) Match
- **Purpose**: Court-level game in a round.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `round_id` (FK -> Round)
  - `court_number` (int 1..7)
  - `team1_player1_id` (FK -> Player)
  - `team1_player2_id` (FK -> Player)
  - `team2_player1_id` (FK -> Player)
  - `team2_player2_id` (FK -> Player)
  - `result_type` (enum: `WinLoss|Score24|WinLossDraw`)
  - `winner_team` (nullable int: 1/2)
  - `is_draw` (bool default false)
  - `team1_score` (nullable int)
  - `team2_score` (nullable int)
  - `status` (enum: `Pending|Completed`)
  - `created_at`, `updated_at`
- **Validation**:
  - exactly 4 distinct players
  - Mexicano: `team1_score + team2_score = 24`
  - WinLossDraw: `is_draw=true` implies `winner_team is null`

## 7) PlayerRoundScore
- **Purpose**: Per-player score impact for one round.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `round_id` (FK -> Round)
  - `player_id` (FK -> Player)
  - `score_delta` (int)
  - `score_total_in_event` (int snapshot)
- **Constraints**:
  - unique (`round_id`, `player_id`)

## 8) PlayerEventStanding
- **Purpose**: Final and intermediate event-local leaderboard.
- **Fields**:
  - `id` (PK)
  - `event_id` (FK -> Event)
  - `player_id` (FK -> Player)
  - `total_score` (int)
  - `rank_position` (nullable int until finish)
- **Constraints**:
  - unique (`event_id`, `player_id`)

## Relationships
- Event 1..* EventCourt
- Event 1..* EventPlayer
- Event 1..* Round
- Round 1..* Match
- Round 1..* PlayerRoundScore
- Event 1..* PlayerEventStanding
- Player participates via EventPlayer; appears in Match + score tables.

## State Transitions

### Event status
- `Lobby -> Preview -> Running -> Finished`
- Invalid transitions blocked (e.g., `Lobby -> Finished`).

### Round status
- `Pending -> Running -> Completed`
- Round can move to `Completed` only when all matches in round are completed.

### Match status
- `Pending -> Completed`
- Completion requires valid result payload according to event mode.
