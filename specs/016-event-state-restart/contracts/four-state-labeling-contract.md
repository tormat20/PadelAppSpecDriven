# Contract: Four-State Labeling and Action Gating

## Purpose

Define organizer-facing labeling and execution action rules for `planned`, `ready`, `ongoing`, and `finished` states.

## Rules

1. Home Event Slots shows all four labels where applicable.
2. Action gating by state is fixed:
   - planned -> no run action
   - ready -> `Start Event`
   - ongoing -> `Resume Event` and `Restart Event`
   - finished -> `View Summary` (no start/resume)
3. Successful start transitions event to ongoing immediately.
4. Ongoing events auto-transition to finished when required rounds/matches complete.

## Response Expectations

1. Event list/detail responses include sufficient fields for deterministic label/action mapping.
2. Preview action rendering uses latest persisted state.

## Verification Targets

- Backend contract tests for state transition and action mapping payloads.
- Frontend tests for label rendering and action visibility by state.
