# Contract: Resume Progress Restoration

## Purpose

Define required persisted data and restore behavior for resumable ongoing events.

## Rules

1. Resume does not depend on browser-only transient state.
2. Resume restores persisted current round context.
3. Resume restores persisted created matches for current context.
4. Resume preserves completed results and pending matches exactly as persisted.
5. Navigation away and page reload do not lose ongoing progress reconstruction ability.

## Response Expectations

1. Resume/load payloads include fields needed to rebuild in-progress run UI.
2. Persisted state remains source-of-truth when client cache differs.

## Verification Targets

- Backend integration tests for round/match/result restoration.
- Frontend integration tests for resume after navigation/reload.
