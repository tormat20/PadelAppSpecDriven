# Progress Summary Contract

## Purpose

Define externally visible behavior for setup suggestions, scheduling input, run-event card interactions, and summary behavior during in-progress and completed events.

## Setup Interaction Contract

### Player Suggestions
1. Suggestions render in an inline listbox under the input.
2. Suggestions begin after first typed character.
3. Matching uses case-insensitive prefix logic.
4. Suggestions are keyboard and mouse selectable.
5. No-match state is explicitly shown.

### Event Schedule
1. Setup captures both date and time.
2. Time semantics follow 24-hour range 00:00-23:59.
3. Invalid or missing schedule values block valid submission.

## Run-Event Interaction Contract

1. Each court match card displays provided court image context.
2. Team/player groupings are clearly visible and clickable.
3. Team winner selection remains visibly highlighted until changed or submitted.

## Summary Behavior Contract

### In-progress events
1. Summary access must return a progress summary view (not finish-only error).
2. View renders players as rows and round/match statuses as cells.
3. Unplayed statuses render as `-`.
4. Back action returns host to run-event flow.

### Completed events
1. Existing final summary behavior remains available.
2. Existing consumers of completed-summary contract continue to function.

## Compatibility Contract

1. If API behavior changes for in-progress summary support, completed-summary consumers remain backward compatible.
2. Existing event creation constraints and scoring/progression rules remain unchanged.

## Verification Matrix

- Suggestion listbox appears from first character and narrows correctly.
- Date-time 24-hour input accepted and validated.
- Winner state remains visibly selected before submission.
- In-progress summary renders matrix with `-` placeholders.
- Back navigation from progress summary returns to run-event context.
- Completed summary consumers remain unaffected.

## Verification Log Placeholders

- [X] Contract check: in-progress summary access returns progress mode (no finish-only error)
- [X] Contract check: completed summary access still returns final summary payload shape
- [X] Contract check: summary mode discriminator is present and stable for frontend mode handling
- [X] Contract check: no regressions in existing summary consumers/tests

### Evidence

- `backend/tests/contract/test_progress_summary_api.py` validates in-progress summary returns `mode=progress` and matrix cells.
- `backend/tests/contract/test_completed_summary_compatibility.py` validates `POST /events/{id}/finish` compatibility and `GET /events/{id}/summary` final mode payload.
- `frontend/src/pages/Summary.tsx` uses mode-discriminated rendering with `mode === "progress"` and final fallback.
- Verification rerun: `PYTHONPATH=. uv run pytest tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py tests/contract/test_event_finish_api.py` passed on 2026-02-26.
