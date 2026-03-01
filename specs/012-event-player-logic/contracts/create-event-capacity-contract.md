# Contract: Create Event Capacity Rules

## Purpose

Define required player-capacity behavior for event creation.

## Rules

1. Required players = selected courts * 4.
2. Create Event action is disabled unless assigned players exactly equal required players.
3. Capacity must recalculate immediately when courts or assignments change.

## UI Expectations

1. Assigned header shows `assigned / required` counter.
2. Courts section includes explicit "Courts" label.

## Verification Targets

- Frontend validation tests for enabled/disabled create-event behavior.
- UI tests for assigned counter and courts label presence.
