# Contract: Dual Create Actions

## Purpose

Define expected behavior differences between `Create Event` and `Create Event Slot`.

## Rules

1. Create Event must be available only when mode-specific setup requirements are fully satisfied.
2. Create Event Slot must be available when planning fields are valid.
3. Create Event Slot always saves using planning fields only and ignores courts/players currently selected in form state.
4. Create Event creates ready events when setup requirements are met.
5. Create Event Slot creates planned events.

## Response Expectations

1. Both create outcomes return event with `setupStatus`.
2. Slot-create responses never derive ready status from incidental form setup selections.

## Verification Targets

- Frontend tests for action enable/disable and submission semantics.
- Backend contract tests for strict create and slot-create result states.
