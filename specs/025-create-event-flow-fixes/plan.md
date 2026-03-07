# Implementation Plan: Create Event Flow Fixes & UX Improvements

**Branch**: `025-create-event-flow-fixes` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/025-create-event-flow-fixes/spec.md`

## Summary

Seven stories fixing two confirmed bugs and adding five UX improvements to the Create Event stepper.
Backend work is minimal (one migration, one defensive code path, one new integration test).
Frontend work is the bulk: two bug fixes in `CreateEvent.tsx`, four additive UX features in
`CreateEvent.tsx`, a new global `ToastProvider` context wired at `AppShell` level, and toast calls
in `PlayerSelector.tsx`. No new DB tables, no new API endpoints, no new npm packages.

**Bug 1 — "Event Already Started"**: The root cause is corrupt DB state (4 events with
`status='Lobby'` but existing rounds) compounded by a code-level gap in `start_event()`:
`lifecycle_status == "ready"` but `current_round` is already set → the guard at line 289 raises
`EVENT_ALREADY_STARTED` instead of recovering. Fix is a data migration + a two-line code fix +
a frontend pre-check.

**Bug 2 — UUIDs in Assign Teams**: The `playerById` lookup is built from `assignedPlayers` which is
seeded from `loadDraftPlayers()` (localStorage). Stale pre-`displayName` entries contain only `id`.
Fix is a `useEffect` that strips invalid entries on mount.

**Features 1–5**: All confined to `CreateEvent.tsx` (auto-suffix, edit-mode auto-name, slot button,
guardrails) and a new `ToastProvider` component (toast system).

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x / React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB (backend); React 18, React Router 6, Vite 5, Vitest 2 (frontend)  
**Storage**: DuckDB embedded — `?` positional params, `row[N]` index access, re-query after INSERT  
**Testing**: pytest + FastAPI TestClient, sync `def test_*`, no asyncio (backend); Vitest 2 (frontend)  
**Target Platform**: Linux/macOS server + modern browser  
**Project Type**: Web application (FastAPI backend + React SPA frontend)  
**Performance Goals**: <200ms p95 on all existing endpoints; no new performance requirements  
**Constraints**: Zero new npm packages; Windows PowerShell uses `PYTHONPATH=. uv run ...`; `manuallyEditedName` MUST be `useRef` not `useState`  
**Scale/Scope**: Single-file DuckDB; ~10–50 concurrent users; small event sizes (8–32 players)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Check | Status | Notes |
|-------|--------|-------|
| No new npm packages | ✅ PASS | Pure React context + CSS for toast system |
| Backend pattern: routers→services→repositories→sql | ✅ PASS | Only `event_service.py` touched — no new repos |
| Repo constructor `def __init__(self, conn):` untyped | ✅ PASS | No new repos |
| SQL params `?` positional, `row[N]` index | ✅ PASS | Migration uses standard DuckDB SQL |
| After INSERT re-query with `get()` | ✅ PASS | No new INSERTs in service logic |
| `load_sql()` from `app.repositories.base` | ✅ PASS | No new SQL files in repos |
| `services_scope()` is `@contextmanager` | ✅ PASS | No new repos added to scope |
| Sync `def` router handlers | ✅ PASS | No new router handlers |
| Tests: TestClient, sync `def test_*`, no asyncio | ✅ PASS | New integration test follows existing pattern |
| No `passlib` | ✅ PASS | No auth changes |
| `manuallyEditedName` must be `useRef<boolean>` | ✅ PASS | Explicitly required in spec FR-009 |
| Pre-existing LSP errors not touched | ✅ PASS | `users_repo.py:16`, `round_service.py:62` left alone |

## Research Notes

### Backend — `start_event()` gap (line 289 of `event_service.py`)

The check order at lines 262–294 is:
1. `derive_lifecycle_status()` — pure status-based, ignores the `rounds` table
2. If `ongoing` → return existing round (happy path)
3. If `finished` → error
4. If `planned` → error
5. **Line 289**: `if current_round:` → raise `EVENT_ALREADY_STARTED`  ← BUG

For corrupt events (`status='Lobby'`, round exists), `derive_lifecycle_status` returns `"ready"`, we
fall through to line 289, and we throw. The fix: in the `"ready"` branch, if `current_round` already
exists, treat as a recovery case — set `status='Running'` via `events_repo.update_status()` and return
the existing round (mirroring the `"ongoing"` happy path). The data migration also independently fixes
the DB, making the code path a defence-in-depth measure for any future corrupt entries.

### Frontend — `CreateEvent.tsx` key existing patterns

| Pattern | Location | Notes |
|---------|----------|-------|
| `isEditMode = editEventId.length > 0` | line 42 | Boolean derived from URL param |
| Auto-name effect guard: `if (isEditMode) return` | line 132 | This is the guard to remove |
| `loadDraftPlayers` seeding `assignedPlayers` | line 59 | `useState(loadDraftPlayers)` — no validation |
| `isTeamMexicano` state | line 57 | `useState(false)` |
| `step1Error`, `step2Error`, `step3Error` | lines 48–50 | Error slots per step |
| `handleStartEvent` | line 258 | Uses `window.open` + fallback; needs pre-check |
| `stepper-divider` `<hr>` pattern | lines 371, 417, 520, 587 | Existing separator pattern |
| `playerById` built from `assignedPlayers` | line 446 | Used in Step 3 Assign Teams |

### Frontend — `AppShell.tsx`

The `AppShell` wraps the router outlet. `ToastProvider` should wrap the entire content of `AppShell`
so toasts are globally available. The `useToast()` hook is consumed in `CreateEvent.tsx` and
`PlayerSelector.tsx`.

### Migration naming

Last migration is `009_substitutions.sql`. The next is `010_fix_corrupt_event_status.sql`.

## Data Model

No schema changes. The migration is a pure data fix:

```sql
-- 010_fix_corrupt_event_status.sql
UPDATE events
SET status = 'Running'
WHERE status = 'Lobby'
  AND id IN (
    SELECT DISTINCT event_id FROM rounds
  );
```

No new tables. No column additions.

## API Contracts

No new endpoints. No changes to existing response shapes.

The only observable API change: `POST /api/v1/events/{id}/start` on a previously-corrupt event now
returns `200 OK` with `{ event_id, round_number, matches }` instead of `409 EVENT_ALREADY_STARTED`.

## Project Structure

### Documentation (this feature)

```text
specs/025-create-event-flow-fixes/
├── plan.md              ← This file
├── spec.md              ← Written
└── tasks.md             ← /speckit.tasks output (next step)
```

### Source Code (files to be modified or created)

```text
backend/
├── app/
│   ├── db/
│   │   └── migrations/
│   │       └── 010_fix_corrupt_event_status.sql   ← NEW
│   └── services/
│       └── event_service.py                        ← MODIFIED (start_event recovery path ~line 289)
└── tests/
    └── integration/
        └── test_start_event_corrupt_state.py       ← NEW

frontend/
└── src/
    ├── app/
    │   └── AppShell.tsx                            ← MODIFIED (wrap with ToastProvider)
    ├── components/
    │   ├── toast/
    │   │   ├── ToastProvider.tsx                   ← NEW
    │   │   └── Toast.css                           ← NEW
    │   └── players/
    │       └── PlayerSelector.tsx                  ← MODIFIED (fire toast on player created)
    └── pages/
        └── CreateEvent.tsx                         ← MODIFIED (BUG-2, FEAT-1–4 + toast calls)
```

**Structure Decision**: Web application layout. Follows existing project structure exactly.
New `toast/` folder lands under `frontend/src/components/` alongside existing component folders.
No new SQL directories or backend folders needed.

## Complexity Tracking

> No constitution violations detected. No justification table required.
