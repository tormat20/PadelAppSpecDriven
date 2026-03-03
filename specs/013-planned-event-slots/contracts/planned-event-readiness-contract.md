# Contract: Planned Event Readiness Rules

## Purpose

Define canonical readiness behavior for planned-event setup and run eligibility.

## Rules

1. Event can be created with planning fields only: `name`, `mode`, `date`, `time`.
2. New events start with setup status `planned`.
3. Setup status transitions to `ready` only when full mode-specific requirements are satisfied, including required courts and exact player-count rules.
4. Setup status must be re-evaluated after any setup mutation.
5. If setup becomes incomplete after edits, status must revert to `planned`.
6. Run/start actions must be blocked while status is `planned`.

## Response Expectations

1. Event read/detail responses include:
   - `setupStatus` (`planned` or `ready`)
   - `missingRequirements` (empty only when ready)
2. Blocked start/run responses include stable missing-requirement identifiers/messages.

## Verification Targets

- Backend contract tests for create/update/start transitions.
- Frontend tests for status presentation and start-button gating.
