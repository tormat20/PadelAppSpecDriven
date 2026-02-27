# UX Polish QA Checklist

## Scope

- Feature: `002-run-result-badges`
- Focus: inline mirrored team-result badges, setup player section clarity, court-card transparency polish

## Automated Evidence

- [X] Frontend lint executed and result captured
- [X] Frontend tests executed and result captured
- [X] Backend regression contract tests executed and result captured

### Command Results

- `frontend`: `npm run lint` -> pass (`tsc --noEmit`)
- `frontend`: `npm run test` -> pass (22 files, 51 tests)
- `backend`: `PYTHONPATH=. uv run pytest tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py tests/contract/test_event_finish_api.py` -> pass (3 tests)

## Manual Verification

- [ ] Create-event player section heading reads `Players`
- [ ] Assigned-player list expands downward without clipping in normal setup usage
- [ ] Run-event cards show no muted helper text below court cards
- [ ] Team buttons show right-aligned inline result badges after selection
- [ ] Mexicano badge values mirror as `X` and `24 - X`
- [ ] Americano/BeatTheBox badges mirror as `Win/Loss`, `Loss/Win`, and `Draw/Draw` where valid
- [ ] Court image remains clearly visible after overlay reduction
- [ ] Team button tint/readability remains clear on desktop and mobile

## Notes

- [X] Attach command outputs and manual observations after implementation
- Manual browser walkthrough remains recommended before final sign-off.
