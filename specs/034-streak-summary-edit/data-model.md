# Data Model: Ongoing Summary and Streak Badges

## Overview

This feature extends existing ongoing-event projections with streak indicators, inline summary UI state, and score-correction audit details.

## Entities

## 1) PlayerEventMomentum

- **Purpose**: Derived per-player momentum status during one ongoing event.
- **Key Fields**:
  - `eventId` (string, required)
  - `playerId` (string, required)
  - `consecutiveWins` (integer >= 0)
  - `consecutiveLosses` (integer >= 0)
  - `streakState` (enum: `none | hot | cold`)
  - `lastEvaluatedAt` (datetime)
- **Validation Rules**:
  - `hot` requires `consecutiveWins >= 3` and `consecutiveLosses == 0`
  - `cold` requires `consecutiveLosses >= 3` and `consecutiveWins == 0`
  - `none` applies for all other states
- **Relationships**:
  - Derived from ordered `MatchResult` records for the same `eventId`

## 2) OngoingInlineSummaryView

- **Purpose**: UI view state for expandable summary in active event screen.
- **Key Fields**:
  - `eventId` (string, required)
  - `isExpanded` (boolean)
  - `standingsRows` (collection of projected standings)
  - `scoreRows` (collection of projected match scores)
  - `editableMatchIds` (set of match ids user can edit)
  - `lastRefreshAt` (datetime)
- **Validation Rules**:
  - `eventId` must match current ongoing event context
  - `editableMatchIds` limited by existing authorization and event lifecycle rules

## 3) MatchResultCorrection

- **Purpose**: Represents a host/admin correction to an already-saved result.
- **Key Fields**:
  - `eventId` (string, required)
  - `matchId` (string, required)
  - `beforeScore` (structured score payload, required)
  - `afterScore` (structured score payload, required)
  - `editedByUserId` (string, required)
  - `editedAt` (datetime, required)
  - `status` (enum: `applied | rejected_conflict | rejected_validation`)
  - `reason` (optional text)
- **Validation Rules**:
  - `afterScore` must satisfy existing match score validation rules
  - `editedByUserId` must have existing result-edit permission
  - Conflict status returned when submitted base state is stale
- **Relationships**:
  - Updates one `MatchResult`
  - Triggers refresh of standings and `PlayerEventMomentum`

## 4) RecognitionBadgeProjection

- **Purpose**: Render-ready badge set for each player in relevant views.
- **Key Fields**:
  - `playerId` (string)
  - `badges` (list of enums)
  - `recentWinnerBadge` (enum: `none | crown`)
  - `momentumBadge` (enum: `none | fire | snowflake`)
- **Validation Rules**:
  - Recent winner badge uses current qualification logic but maps to crown icon
  - Momentum badge is mutually exclusive between fire and snowflake

## State Transitions

## A) Momentum State Transition (per player per event)

1. `none` -> `hot` when win sequence reaches 3+
2. `none` -> `cold` when loss sequence reaches 3+
3. `hot` -> `none` when next outcome is non-win
4. `cold` -> `none` when next outcome is non-loss
5. Any correction event replays the ordered sequence and recalculates final state

## B) Inline Summary View State

1. `collapsed` -> `expanded` on "View Summary"
2. `expanded` -> `savingEdit` on score edit save action
3. `savingEdit` -> `expanded` on success with refreshed projections
4. `savingEdit` -> `expanded` on failure with error message and unchanged saved values

## C) Match Result Correction State

1. `submitted` -> `applied` when validation and concurrency checks pass
2. `submitted` -> `rejected_validation` when score format/rules fail
3. `submitted` -> `rejected_conflict` when base match state changed before save

## Derived Projections

- Standings projection must be refreshed after any applied correction.
- Momentum projection must be recomputed after new result submission and after any correction.
- Badge projection must reflect both recent-winner and momentum outputs on refresh.
