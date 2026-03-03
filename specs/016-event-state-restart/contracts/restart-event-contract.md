# Contract: Restart Event Behavior

## Purpose

Define the confirmed restart flow for ongoing events.

## Rules

1. `Restart Event` is available only for ongoing events.
2. Restart requires explicit organizer confirmation.
3. On confirmed restart, prior round/match run progress and results for that event are cleared.
4. Event setup data (name, mode, date/time, courts, players) is preserved.
5. Event returns to ready state and organizer is navigated back to Preview with `Start Event` available.

## Response Expectations

1. Restart response includes updated state consistent with ready setup.
2. Subsequent run start creates fresh progress from preserved setup.

## Verification Targets

- Backend integration tests for run-progress reset and setup preservation.
- Frontend tests for confirmation flow and post-restart navigation/action state.
