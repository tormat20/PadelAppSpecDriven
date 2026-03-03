# Contract: Edit Event Flow from Preview

## Purpose

Define edit-mode behavior for events opened from Preview Event.

## Rules

1. Preview Event exposes `Edit Event` action.
2. Edit Event routes to the existing create surface in edit mode with prefilled event values.
3. Edit mode shows `Save Changes` as the only primary save action.
4. Save Changes allows incomplete setup and keeps or sets status to planned when requirements are unmet.
5. Save Changes re-evaluates readiness immediately after save.

## Response Expectations

1. Save response includes updated `setupStatus` and readiness details.
2. Start Event remains unavailable when status is planned and available when status is ready.

## Verification Targets

- Frontend tests for navigation, primary action labeling, and start gating updates.
- Backend contract/integration tests for post-save readiness recalculation.
