# Quickstart: Normalized Court Score and Score Distribution Histograms

**Branch**: `046-court-score-distribution`
**Phase**: 1 — Design

---

## Prerequisites

- Python 3.12 virtualenv active with backend dependencies installed:
  `cd backend && pip install -e .[dev]`
- Node dependencies installed:
  `cd frontend && npm install`

---

## Running the dev environment

```bash
# Backend (from repo root)
cd backend && PYTHONPATH=. uvicorn app.main:app --reload

# Frontend (from repo root, separate terminal)
cd frontend && npm run dev
```

---

## Targeted test commands for this feature

These are the test files directly related to this feature. Run them first after any change.

```bash
# Backend — unit tests for normalization + distribution logic
cd backend && PYTHONPATH=. pytest tests/unit/test_court_score_normalization.py -v

# Backend — API contract tests for the deep-dive endpoint
cd backend && PYTHONPATH=. pytest tests/contract/test_player_stats_deep_dive_api.py -v

# Frontend — chartData unit tests (includes new buildBarSegments distribution tests)
cd frontend && npm test -- --run tests/player-stats-chart-data.test.ts
```

---

## Full regression suites

Run these before committing to confirm nothing was broken.

```bash
# Backend full suite
cd backend && PYTHONPATH=. pytest

# Frontend full suite
cd frontend && npm test

# Frontend lint + type check
cd frontend && npm run lint
```

---

## Manual verification checklist

After starting both dev servers, open `http://localhost:5173` and navigate to a player with
existing Mexicano match history.

1. Open the **Deep Dive** panel and switch to the **Mexicano** tab.
2. Confirm the court chart is labelled **"Avg court-score per round"** (not "Avg court per round").
3. Confirm the Y-axis on the court chart shows **0 to 10** (not 1 to 7).
4. Confirm the overall average stat below the chart reads a value between 0 and 10.
5. Confirm a **"Score distribution — All courts"** bar chart appears below the court chart.
6. Confirm the distribution X-axis spans **0–24** (25 bars).
7. Confirm **per-court distribution charts** appear for each court that has data, labelled "Court N".
8. Confirm courts with no matches do **not** appear as distribution charts.
9. On a narrow viewport, confirm the distribution charts are **horizontally scrollable**.
10. Open the **Americano** and **Team Mexicano** tabs and confirm the same charts appear there.

---

## Key files to edit

| File | What changes |
|---|---|
| `backend/app/api/schemas/stats.py` | Rename `RoundAvgCourt`; add `RoundAvgCourtScore`, `ScoreDistEntry`, `ScoreDistPerCourt`; update `Score24ModeStats` |
| `backend/app/services/player_stats_service.py` | Add `_normalize_court_score()`; update `_compute_score24_stats()`, `_empty_score24_stats()`, `_compute_deep_dive()`; update `get_player_deep_dive()` |
| `frontend/src/lib/types.ts` | Rename `RoundAvgCourt` → `RoundAvgCourtScore`; add `ScoreDistEntry`, `ScoreDistPerCourt`; update `Score24ModeStats` |
| `frontend/src/pages/PlayerStats.tsx` | Update `CourtLineChart` (Y-axis 0–10, new props); add `ScoreDistChart` component; update `Score24Tab` to render both new charts |
| `backend/tests/unit/test_court_score_normalization.py` | NEW — unit tests for `_normalize_court_score` + distribution building |
| `backend/tests/contract/test_player_stats_deep_dive_api.py` | NEW — contract tests for the full endpoint response shape |
| `frontend/tests/player-stats-chart-data.test.ts` | Add `buildBarSegments` tests covering the 25-bar distribution use case |

---

## Normalization formula reference

```python
def _normalize_court_score(court_number: int, sorted_courts: list[int]) -> float:
    if len(sorted_courts) <= 1:
        return 10.0
    rank = sorted_courts.index(court_number)
    return (rank / (len(sorted_courts) - 1)) * 10.0
```

Examples:
- `[2,3,4,5,6]`, court 4 (rank 2) → `(2/4)*10 = 5.0`
- `[1,3,4,5,7]`, court 3 (rank 1) → `(1/4)*10 = 2.5`
- `[4]`, court 4 → `10.0`
