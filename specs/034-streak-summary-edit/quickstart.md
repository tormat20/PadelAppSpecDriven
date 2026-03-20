# Quickstart: Ongoing Summary and Streak Badges

## Goal

Validate that inline summary, score correction, and streak/badge behavior work correctly during ongoing event operation.

## Prerequisites

- Backend running locally
- Frontend running locally
- Admin/host user available
- Event with enough players to progress through multiple matches

## Validation Flow

1. Create and start a new event.
2. Enter several match results so standings exist.
3. From ongoing event screen, select `View Summary`.
4. Confirm summary appears inline (same page) and event context is preserved.
5. Edit one recorded score in inline summary and save.
6. Confirm standings refresh immediately and no page navigation occurs.
7. Build one player to 3 consecutive wins; verify fire streak indicator appears.
8. Build one player to 3 consecutive losses; verify snowflake indicator appears.
9. Submit a result that breaks either streak; verify indicator removal/update.
10. Verify winning score values are visually emphasized in ongoing score displays.
11. Verify recent-winner recognition icon now renders as crown instead of fire.

## Negative Checks

- Attempt invalid score correction: save must be rejected with clear error.
- Attempt correction without required permission: action must be denied.
- Simulate concurrent edit conflict (if possible): user should see conflict outcome, not silent overwrite.

## Regression Targets

- Starting and progressing rounds still works.
- Existing summary route behavior (outside ongoing inline view) remains functional where applicable.
- Existing result validation rules still apply to both normal entry and corrections.

## Validation Log (2026-03-19)

- Frontend typecheck: `npx tsc --noEmit` passed.
- Frontend suite: `npm test -- --run` passed (75 files, 429 tests).
- Backend suite: `PYTHONPATH=. uv run python -m pytest tests/ -q` passed (153 tests).
- Manual scenario sweep (steps 1-11): pending host-driven UI verification in a live-running session.
