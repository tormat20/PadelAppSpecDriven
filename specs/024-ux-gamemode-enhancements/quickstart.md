# Quickstart: UX Fixes & Game Mode Enhancements (024)

**Branch**: `024-ux-gamemode-enhancements`

---

## Prerequisites

- Python 3.12+ with `uv` installed
- Node.js 20+ with `npm`
- DuckDB (embedded — no separate server needed)

---

## Running the Application

### Backend

```bash
# From repo root
PYTHONPATH=. uv run uvicorn app.main:app --reload
```

Backend starts at `http://127.0.0.1:8000`

### Frontend

```bash
# From repo root
cd frontend
npm run dev
```

Frontend starts at `http://localhost:5173`

---

## Running the Test Suite

```bash
# From repo root — runs all tests and lint
npm test && npm run lint
```

Backend tests only:
```bash
PYTHONPATH=. uv run pytest tests/ -v
```

Frontend tests only:
```bash
cd frontend && npm run test
```

---

## Applying Migrations

Migrations run automatically on backend startup via `backend/app/db/connection.py`. After
pulling changes that include new migration files, simply restart the backend server — the
new tables/columns will be created automatically.

New migrations for this feature:
- `backend/app/db/migrations/008_team_mexicano.sql`
- `backend/app/db/migrations/009_substitutions.sql`

---

## Testing Feature 024 Manually

### Story 1 — UserMenu dropdown (CSS fix)
1. Log in with an existing user
2. Click the user pill in the top navigation bar
3. Confirm the dropdown appears above the card-nav panel (not hidden behind it)
4. Click "Sign out" to verify the action works

### Story 2 — Court card player names
1. Start any event (Mexicano or WinnersCourt) with players having 10+ character names
2. Navigate to the running event view
3. Confirm each side of each court card shows two **separate** stacked name rows,
   not a single combined "Alice + Bob" button

### Story 3 — Open in new window
1. Create and prepare a Mexicano event (add players + courts → status becomes "ready")
2. Click "Start Event" on the preview page
3. Confirm a new browser tab/window opens at `/events/{id}/run`
4. Confirm the original tab stays on the preview page

### Story 4 — Team Mexicano
1. Go to Create Event → select Mexicano
2. Toggle "Team Mexicano" on (orange toggle)
3. Add an even number of players (e.g. 8)
4. A new "Assign Teams" step appears — pair the players into 4 fixed pairs
5. Start the event — confirm all rounds keep the same partner pairings
6. Try to start with an odd number of players — confirm a blocking message appears

### Story 5 — Change mode before start
1. Create a Mexicano event (status: planned or ready)
2. Go to Edit Event
3. Change the event type to WinnersCourt — confirm the change saves
4. Start the event and verify WinnersCourt scheduling applies
5. Start an event, then try to edit the event type — confirm it is blocked (409 error)

### Story 6 — Substitute player
1. Start a Mexicano event
2. Complete round 1
3. Click "Substitute Player" button on the run view
4. Search for a player (or create a new one)
5. Confirm the departing player is replaced from round 2 onwards
6. Finish the event — confirm the departing player's stats show only round 1

### Story 7 — Unlimited rounds
1. Start a Mexicano event (round_count defaults to 6 in DB)
2. Play through all 6 rounds
3. Confirm "Next Round" is still available after round 6
4. Play rounds 7 and 8 successfully
5. Click "Finish" to end the event

### Story 8 — Mexicano tiebreaker
1. Set up a Mexicano event where two players end with identical total scores
2. Give one player more wins than the other
3. View the event summary — confirm the higher-wins player ranks above the other
4. If wins are also equal, confirm the higher best-match score player ranks first

### Story 9 — Documentation files
```bash
ls docs/game-modes/
# Should show: mexicano.md  winners-court.md  ranked-box.md
```

---

## Key Files Modified by This Feature

### Backend
- `backend/app/db/migrations/008_team_mexicano.sql` — new migration
- `backend/app/db/migrations/009_substitutions.sql` — new migration
- `backend/app/domain/models.py` — `Event`, `EventTeam`, `EventSubstitution` models
- `backend/app/domain/enums.py` — no changes
- `backend/app/repositories/event_teams_repo.py` — new repo
- `backend/app/repositories/substitutions_repo.py` — new repo
- `backend/app/repositories/events_repo.py` — updated `get`, `create`, `update_setup`
- `backend/app/services/event_service.py` — Team Mexicano setup validation, mode-change guard
- `backend/app/services/round_service.py` — remove Mexicano round cap
- `backend/app/services/mexicano_service.py` — Team Mexicano scheduling (fixed pairs)
- `backend/app/services/summary_ordering.py` — Mexicano tiebreaker hierarchy
- `backend/app/api/schemas/events.py` — `isTeamMexicano` field
- `backend/app/api/routers/events.py` — new `/teams` and `/substitute` endpoints
- `backend/app/api/deps.py` — add new repos to `services_scope`

### Frontend
- `frontend/src/components/nav/CardNav.css` — overflow fix for UserMenu
- `frontend/src/styles/components.css` — dropdown z-index
- `frontend/src/components/courts/CourtGrid.tsx` — split player names
- `frontend/src/pages/PreviewEvent.tsx` — `window.open()` for start
- `frontend/src/pages/RunEvent.tsx` — decouple Next/Finish buttons; substitute player UI
- `frontend/src/lib/types.ts` — `isTeamMexicano`, `EventTeam`, `SubstitutePlayerPayload`
- `frontend/src/lib/api.ts` — `setEventTeams`, `getEventTeams`, `substitutePlayer` functions

### Docs
- `docs/game-modes/mexicano.md`
- `docs/game-modes/winners-court.md`
- `docs/game-modes/ranked-box.md`
