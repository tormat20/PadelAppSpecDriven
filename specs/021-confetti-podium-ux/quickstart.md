# Quickstart: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Feature**: `021-confetti-podium-ux`  
**Date**: 2026-03-04

## Prerequisites

- Node.js 20+ and npm installed
- Python 3.12+ and a virtual environment activated for the backend
- Repository cloned and on branch `021-confetti-podium-ux`

## Install new dependency

```bash
cd frontend
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

## Run the app locally

```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

## Run tests

```bash
cd frontend
npm test
```

## Verify confetti (manual smoke test)

1. Create and complete a Mexicano or WinnersCourt event (run all rounds).
2. Navigate to the final summary page.
3. Confirm 10 confetti bursts fire over ~1 second on first load.
4. Reload — confetti fires again (once per mount).
5. Open an in-progress event summary — no confetti.

## Verify podium (manual smoke test)

1. Open the final summary of a Mexicano event → 3-position podium (1 player each) above the results table.
2. Open the final summary of a WinnersCourt event → 3-position podium (2 players each).
3. Open the final summary of a BeatTheBox event → no podium.

## Verify Create Event UX (manual smoke test)

1. Navigate to Events → Create.
2. On the Setup step: confirm "Choose mode" label above mode selector and "Choose date and time" label above date inputs.
3. Confirm "Today's date" button appears **above** the date field and is orange.
4. Click "Today's date" — date field sets to today.
5. Navigate to Roster step with 0 courts: confirm orange "Choose courts" hint visible.
6. Select 1 court — hint disappears. Confirm "Assign players" hint visible.
7. Assign the required number of players — "Assign players" hint disappears.
