# Quickstart: Previous Round Correction Flow

## Goal

Validate backward navigation, prior-round correction, downstream round regeneration, and updated run-page action layout.

## Prerequisites

- Backend and frontend running locally
- Admin/host account
- Ongoing event with at least 2 rounds generated

## Validation Steps

1. Start an event and submit all Round 1 scores.
2. Advance to Round 2 and confirm players are reassigned.
3. In run action panel, verify top row is `Previous Round` (left) and `Next Match` (right).
4. Verify second row (same panel) shows `View Summary` and `Finish Event`.
5. Click `Previous Round`; confirm Round 1 view loads with saved result values.
6. Edit one score that materially changes ordering.
7. Click `Next Match`; confirm Round 2 assignments are regenerated from corrected Round 1.
8. Open `View Summary`; confirm no separate recorded-scores edit list appears below summary table.
9. Navigate back repeatedly until Round 1 and verify further `Previous Round` is blocked with orange warning message.

## Negative Checks

- Attempt invalid score correction in prior round -> must reject and keep saved results.
- Simulate stale/conflicting update -> must reject with clear retry guidance.
- Attempt finish before finish conditions -> finish remains disabled/blocked by existing rules.

## Regression Targets

- Normal forward round progression still works when no corrections occur.
- Existing scoring logic, ranking logic, and tie-breakers remain unchanged.
- Existing summary visibility behavior remains stable except removal of duplicate recorded-scores edit section.

## Validation Results (2026-03-20)

- `frontend`: `npm run lint` passed (`tsc --noEmit`).
- `frontend`: `npm test` passed (75 files, 429 tests).
- `backend`: `PYTHONPATH=. pytest tests/contract/test_rounds_api.py` passed (3 tests).
- `backend`: `PYTHONPATH=. pytest` passed (157 tests).
- Round-1 blocked previous-round messaging is rendered with existing `warning-text` orange style in `RunEvent.tsx`.
