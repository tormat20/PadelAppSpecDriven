# Quickstart: Event Progress UX Improvements

## Prerequisites

- Backend service running locally
- Frontend dev server running locally
- Test data with at least one in-progress event and one completed event

## 1) Run services

```bash
# backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# frontend (new terminal)
cd frontend
npm run dev
```

## 2) Validate setup suggestion and schedule UX

1. Open create-event flow.
2. Type one character in player input and verify listbox suggestions appear below input.
3. Continue typing and verify suggestion set narrows by case-insensitive prefix.
4. Use keyboard and mouse to select suggestions.
5. Set date and 24-hour time and verify valid/invalid handling.

## 3) Validate run-event court card behavior

Court image usage note:
- Expected asset path: `images/courts/court-bg-removed.png`
- Expected visual behavior: each court card shows the court image with side-positioned team display names overlaid on top.
- Fallback behavior: if the image fails to load, the card still preserves clear labels and click affordances.

1. Open run-event view with active matches.
2. Verify each court card uses the configured court image background and team overlays display names (not IDs).
3. Hover left/right team side and verify only hovered side highlights.
4. Click a side and verify result modal opens for the clicked side.
5. Verify mode-specific modal options:
   - Americano: Win/Loss
   - BeatTheBox: Win/Loss/Draw
   - Mexicano: exactly 24 clickable options
6. In Mexicano modal, choose score `X` and verify opposite side is set to `24 - X`.

## 4) Validate progress summary behavior

1. From in-progress event, open summary.
2. Verify progress matrix (players as rows, rounds/matches as cells) renders.
3. Verify unplayed cells display `-`.
4. Use Back and verify return to run-event context.

## 5) Validate completed summary compatibility

1. Open summary for completed event.
2. Verify final summary behavior remains available.
3. Confirm no regressions in scoring/progression outcomes.

## 6) Run automated checks

```bash
cd frontend
npm run lint
npm run test

cd ../backend
PYTHONPATH=. uv run pytest tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py
```
