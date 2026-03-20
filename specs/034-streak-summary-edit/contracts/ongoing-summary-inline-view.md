# Contract: Ongoing Event Inline Summary and Score Correction

## Purpose

Define the expected behavior contract for viewing and editing summary data while an event is ongoing, without route navigation away from the active event context.

## Interaction Contract

## 1) Toggle Inline Summary

- **Trigger**: Host selects `View Summary` from ongoing event actions.
- **Expected Result**:
  - Summary content expands on the same ongoing-event screen.
  - Current event and round context remain active.
  - Host can collapse the summary and continue running rounds.

## 2) Display Summary Data

- **Input Context**: Active ongoing event identifier.
- **Expected Data Surface**:
  - Current standings rows
  - Recorded match score rows
  - Winner score emphasis for recorded outcomes
  - Per-player streak indicators where applicable

## 3) Edit Existing Match Score

- **Trigger**: Host selects `Edit` on a score row inside inline summary.
- **Edit Form Contract**:
  - Must allow updating previously saved match score values.
  - Must validate score input with the same business rules as normal result entry.

## Save Outcome Contract

- **Success**:
  - Updated score persists.
  - Standings, streak markers, and badge projections refresh in the inline summary.
  - Ongoing event context is unchanged.

- **Validation Failure**:
  - Save is rejected.
  - Clear error message shown.
  - Previously saved score remains unchanged.

- **Concurrency Conflict**:
  - Save is rejected with conflict outcome.
  - User is informed data changed and must refresh/retry.
  - No silent overwrite.

## Authorization Contract

- Only users with existing score-edit permission for ongoing events can submit score corrections.
- Unauthorized attempts return a denied outcome and no persisted changes.

## Audit Contract

Each accepted score correction records:
- prior score values
- corrected score values
- editor identity
- correction timestamp
