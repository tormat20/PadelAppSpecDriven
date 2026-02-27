# Quickstart: Event Setup Label + Run Card Transparency + Inline Team Result Badges

## 1) Validate event setup player section

1. Open create-event page.
2. Verify section heading reads `Players` above add/search controls.
3. Assign multiple players and confirm assigned list expands downward without clipping.

## 2) Validate inline mirrored results in run-event

1. Start or resume an event and open run-event view.
2. For Americano, select `Win` on one side and verify opposite side displays `Loss` inside its button.
3. For Americano, select `Loss` and verify opposite side displays `Win`.
4. For BeatTheBox, select `Draw` and verify both sides display `Draw`.
5. For Mexicano, select score `X` and verify selected side shows `X` while opposite side shows `24 - X`.
6. Confirm result values appear on the right side of team buttons.
7. Confirm no muted helper text appears below court card.
8. Confirm changing a selection updates both team badges to the latest mirrored state.

## 3) Validate court image transparency/readability

1. In run-event cards, verify court image is clearer than previous overlay-heavy state.
2. Verify team buttons remain tinted and readable.

## 4) Regression checks

1. Submit results for all matches in a round.
2. Verify progression and finish flow behavior remains unchanged.

## 5) Automated checks

```bash
cd frontend
npm run lint
npm run test

cd ../backend
PYTHONPATH=. uv run pytest tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py tests/contract/test_event_finish_api.py
```
