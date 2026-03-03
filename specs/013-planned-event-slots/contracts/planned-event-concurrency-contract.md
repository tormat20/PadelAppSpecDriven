# Contract: Planned Event Concurrent Update Handling

## Purpose

Prevent silent overwrite when multiple organizers edit the same planned event.

## Rules

1. Every mutable event payload carries an expected version token.
2. Server accepts update only when expected version matches current stored version.
3. On mismatch, server rejects update as conflict (no partial write).
4. Conflict response instructs client to refresh/retry with latest data.

## Response Expectations

1. Successful write returns updated version.
2. Conflict response includes:
   - conflict code
   - current version
   - user-facing refresh/retry guidance

## Verification Targets

- Backend contract/integration tests for stale write rejection.
- Frontend tests for conflict messaging and retry path.
