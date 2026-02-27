# Progress UX QA Checklist

## Scope

- Feature: `001-event-progress-ux`
- Focus: setup listbox + schedule input, run-event court cards + winner state, progress summary behavior

## Automated Evidence

- [X] Frontend lint executed and result captured
- [X] Frontend tests executed and result captured
- [X] Backend tests executed and result captured

### Command Results

- `frontend`: `npm run lint` -> pass (`tsc --noEmit`)
- `frontend`: `npm run test` -> pass (22 files, 44 tests)
- `backend`: `PYTHONPATH=. uv run pytest tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py tests/contract/test_event_finish_api.py` -> pass (3 tests)

## Manual Verification

- [ ] Listbox suggestions appear from first character and narrow by prefix
- [ ] Keyboard and mouse can select a suggestion
- [ ] No-match state is clearly shown
- [ ] Date + 24-hour time input accepts valid values and blocks invalid values
- [ ] Court cards render with `images/courts/court-bg-removed.png`
- [ ] Team overlays show display names (not IDs)
- [ ] Team-side hover highlights only hovered side
- [ ] Team-side click opens result modal for that selected side
- [ ] Americano modal shows Win/Loss for selected side
- [ ] BeatTheBox modal shows Win/Loss/Draw for selected side
- [ ] Mexicano modal shows exactly 24 clickable score options
- [ ] Mexicano selected-side score `X` assigns opposing score `24 - X`
- [ ] Winner/result choice remains visibly selected until changed or submission
- [ ] In-progress summary renders matrix with `-` for unplayed entries
- [ ] Back navigation from summary returns to run-event context
- [ ] Completed event summary behavior remains available

## Notes

- [X] Add command outputs and screenshots/observations after implementation
- Manual UI walkthrough still pending (quickstart scenario checks not executed in browser session).
