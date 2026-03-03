# Contract: Resume/Load Error Feedback

## Purpose

Define actionable error feedback requirements for resume and load flows.

## Rules

1. Resume/load failures provide actionable guidance (for example retry, return to slots, open preview).
2. UI must not surface only a generic `Network error` string for resume/load failures.
3. Error messages are state-aware (for example not found, not ongoing, transient unavailable).
4. Error feedback is visible in relevant UI surfaces without blocking recovery actions.

## Response Expectations

1. Error payloads include stable identifiers and human-readable guidance.
2. Frontend error handling maps failures to user-actionable messages consistently.

## Verification Targets

- Backend contract tests for structured failure responses.
- Frontend tests for actionable error rendering across preview/run resume paths.
