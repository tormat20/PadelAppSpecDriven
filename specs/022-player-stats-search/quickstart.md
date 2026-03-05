# Quickstart: Player Stats, Search & Monthly Leaderboards

**Feature**: `022-player-stats-search`  
**Date**: 2026-03-05

## Prerequisites

- Node.js 20+ and npm installed
- Python 3.12+ with a virtual environment activated for the backend
- Repository cloned and on branch `022-player-stats-search`

## No New Dependencies

No new npm or Python packages are required. The feature uses:
- Inline SVG for doughnut charts (zero-dep, no `chart.js` or `recharts`)
- All existing backend libraries (FastAPI, DuckDB, Pydantic v2)

## Run the App Locally

```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload
```

The backend will run the new migration (`005_player_stats.sql`) automatically on
startup, creating the three new tables: `player_stats`, `monthly_player_stats`,
`player_stats_event_log`.

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

## Run Tests

```bash
# Frontend unit tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

## Verify Player Search (manual smoke test)

1. Open the navigation menu (hamburger).
2. Confirm a 4th card "Search Player" is visible.
3. Tap "Search Player" — lands on `/players/search`.
4. Type a partial player name — matching names appear as you type.
5. Type something with no match — "no players found" message appears.
6. Tap a player name — navigates to `/players/<id>/stats`.

## Verify Player Stats Page (manual smoke test)

1. Create and finish a Mexicano event (all rounds complete → tap Finish).
2. Navigate to Search Player → search for a participant.
3. Tap their name → `/players/<id>/stats`.
4. Confirm:
   - Their Mexicano score total is non-zero and matches the sum from the Summary page.
   - Events attended = 1.
   - WinnersCourt and BeatTheBox stats = 0 (no such events played).
5. Navigate to a player who has never played → all zeros, no errors or blank screen.

## Verify Monthly Leaderboards (manual smoke test)

1. Finish one or more events in the current calendar month.
2. Navigate to the home page (`/`).
3. Confirm "Player of the Month" leaderboard shows participating players ranked by
   events played.
4. Confirm "Mexicano Player of the Month" leaderboard shows only players who
   participated in Mexicano events, ranked by score.
5. If no events have been finalized this month, confirm both leaderboards show an
   empty state message.

## Database Inspection

To inspect the new tables directly (DuckDB CLI or any DuckDB-compatible tool):

```bash
cd backend
python -c "
import duckdb
conn = duckdb.connect('padel.duckdb')
print(conn.execute('SELECT * FROM player_stats LIMIT 10').fetchall())
print(conn.execute('SELECT * FROM monthly_player_stats LIMIT 10').fetchall())
print(conn.execute('SELECT * FROM player_stats_event_log').fetchall())
"
```
