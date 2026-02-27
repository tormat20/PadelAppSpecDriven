# Quickstart: Summary Rank Column and Mode-Specific Ordering Rules

## 1) Validate rank column layout

1. Open a progress summary and confirm leftmost column is `Rank`.
2. Open a final summary and confirm column order is `Rank`, `Player`, `R1..Rn`, `Total`.

## 2) Validate Mexicano final ordering and tie ranks

1. Use a Mexicano fixture with tied top totals.
2. Confirm rows are sorted by total descending.
3. Confirm tie display uses competition ranking (`1,1,3,4...`).

## 3) Validate Americano final ordering

1. Use an Americano fixture with multiple courts in final round.
2. Confirm ordering processes courts from highest to lowest.
3. Confirm each court contributes winners first, then losers.
4. Confirm players within winners/losers slots are alphabetically ordered by display name.

## 4) Validate BeatTheBox points and grouping

1. Use a BeatTheBox final fixture.
2. Confirm round cells display numeric points per round.
3. Confirm total equals sum of round points.
4. Confirm row grouping/order follows global carry-over score progression court-group priority.

## 5) Regression checks

1. Confirm crowns still render according to existing crown rules.
2. Confirm event lifecycle flows (start/run/next/finish/summary) continue working.

## 6) Automated verification

```bash
# Frontend
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend
npm run lint
npm run test

# Backend
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend
PYTHONPATH=. uv run pytest tests/contract tests/integration
```
