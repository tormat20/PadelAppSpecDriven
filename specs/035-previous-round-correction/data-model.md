# Data Model: Previous Round Correction Flow

## Overview

This feature extends ongoing-event runtime state with reversible round navigation semantics and deterministic downstream regeneration after prior-round score correction.

## Entities

## 1) RoundNavigationState

- **Purpose**: Represents current host-visible position in an ongoing event timeline.
- **Key Fields**:
  - `eventId` (string, required)
  - `currentRoundNumber` (integer >= 1)
  - `canGoPrevious` (boolean)
  - `canGoNext` (boolean)
  - `boundaryWarning` (optional warning message)
- **Validation Rules**:
  - `canGoPrevious` is false when `currentRoundNumber == 1`
  - `boundaryWarning` only populated for blocked previous action at round boundary

## 2) RoundResultSnapshot

- **Purpose**: Persisted saved result state for one round used as source for reassignment.
- **Key Fields**:
  - `eventId` (string, required)
  - `roundNumber` (integer >= 1)
  - `matchResults` (collection of match result values)
  - `savedAt` (datetime)
  - `savedByUserId` (string)
- **Validation Rules**:
  - Round snapshot must satisfy existing per-mode score validation
  - Snapshot for round must exist before generating a dependent next round

## 3) DownstreamRebuildWindow

- **Purpose**: Defines which generated rounds become invalid after correction.
- **Key Fields**:
  - `eventId` (string)
  - `fromRoundNumber` (integer >= 1)
  - `invalidatedRoundNumbers` (ordered list of integers)
  - `rebuildStatus` (enum: `pending | rebuilt | failed`)
- **Validation Rules**:
  - `fromRoundNumber` is the corrected round
  - Every invalidated round number is greater than `fromRoundNumber`

## 4) RunActionLayoutState

- **Purpose**: Contracted action placement model for run-page controls.
- **Key Fields**:
  - `topRowLeftAction` (`PreviousRound`)
  - `topRowRightAction` (`NextMatch`)
  - `bottomRowActions` (`ViewSummary`, `FinishEvent`)
  - `finishEnabled` (boolean)
- **Validation Rules**:
  - Top-row action order remains fixed
  - Finish enabled state follows existing completion logic

## State Transitions

## A) Navigation Transition

1. `Round N` -> `Round N-1` on Previous Round if `N > 1`
2. `Round 1` + Previous Round attempt -> remain `Round 1` with warning

## B) Correction/Rebuild Transition

1. Host edits score in prior round context
2. Correction accepted -> mark downstream rounds invalid
3. Rebuild next round(s) from corrected source
4. Resume forward navigation from rebuilt state

## C) Action Availability Transition

1. `Previous Round` disabled at boundary
2. `Next Match` enabled only when current round completion criteria are met
3. `Finish Event` enabled only when existing finish rules are met

## Derived Behaviors

- Corrected prior-round score becomes authoritative input for future assignment logic.
- Any downstream assignments generated from pre-correction data are replaced.
- Inline summary remains display-focused, without separate recorded-score edit list.
