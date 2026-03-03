# Contract: Planned Event Warning and Disambiguation

## Purpose

Define non-blocking warning behavior for planning scenarios that are allowed but require operator visibility.

## Rules

1. Past schedule values are allowed for planned events but must show a clear warning in create/edit flows.
2. Duplicate planned events (same normalized name + date + time) are allowed.
3. Duplicate creation/edit must show duplicate warning feedback.
4. List and detail views must include enough identifying information to distinguish duplicates.

## UI/Behavior Expectations

1. Warnings do not disable save when required planning fields are valid.
2. Warning text is visible near relevant fields and announced non-disruptively.
3. Duplicate warning appears at the time of save attempt or immediate validation.

## Verification Targets

- Frontend tests for warning visibility and save behavior.
- Contract/integration tests verifying duplicate events are persisted and surfaced distinctly.
