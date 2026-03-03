# Contract: Run-State Transition and Action Gating

## Purpose

Define canonical state transition and UI action behavior for `planned`, `ready`, and `ongoing` event execution states.

## Rules

1. Successful start transitions event to `ongoing` immediately.
2. `Start Event` is available only for ready events.
3. `Resume Event` is available only for ongoing events.
4. Planned events do not expose execution start/resume actions.
5. Event Slots surfaces all three labels (`planned`, `ready`, `ongoing`).

## Response Expectations

1. Event read/list responses include state values sufficient for consistent action gating.
2. Start/resume entry points return state-consistent payloads.

## Verification Targets

- Backend contract tests for state transition correctness.
- Frontend tests for label rendering and action gating.
