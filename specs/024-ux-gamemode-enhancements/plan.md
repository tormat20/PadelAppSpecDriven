# Implementation Plan: UX Fixes & Game Mode Enhancements

**Branch**: `024-ux-gamemode-enhancements` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/024-ux-gamemode-enhancements/spec.md`

## Summary

Nine stories covering: a CSS stacking-context fix for the UserMenu dropdown, splitting CourtGrid player
names into individual rows, opening the running event in a new browser window, adding a Team Mexicano
sub-mode (fixed partner pairs), a lifecycle guard for pre-start mode changes, a player substitution
mechanism for ongoing events, removing the hard-coded 6-round cap in Mexicano, a wins-and-best-match
tiebreaker hierarchy for Mexicano rankings, and three plain-language game-mode documentation files.
Frontend stories (S1–S3, S7 front) are CSS/JS only. Backend stories introduce two new DB tables,
two new repositories, two new API endpoints, and modifications to three services.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB (backend); React 18, React Router 6, Vite 5, Vitest 2, motion (frontend)  
**Storage**: DuckDB embedded — file-based, `?` positional params, `row[N]` index access  
**Testing**: pytest + FastAPI TestClient (backend); Vitest 2 (frontend)  
**Target Platform**: Linux/macOS server + modern browser  
**Project Type**: Web application (FastAPI backend + React SPA frontend)  
**Performance Goals**: <200ms p95 on all existing endpoints; no new performance requirements  
**Constraints**: Zero new npm packages; no `passlib` (use `bcrypt` directly); Windows PowerShell
uses `PYTHONPATH=. uv run ...`  
**Scale/Scope**: Single-file DuckDB; ~10–50 concurrent users; small event sizes (8–32 players)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Check | Status | Notes |
|-------|--------|-------|
| No new npm packages | ✅ PASS | All frontend work uses existing deps (`motion` already installed) |
| Backend pattern: routers→services→repositories→sql | ✅ PASS | Two new repos follow existing pattern exactly |
| Repo constructor `def __init__(self, conn):` untyped | ✅ PASS | Applied to all new repos |
| SQL params `?` positional, `row[N]` index | ✅ PASS | All new SQL follows this pattern |
| After INSERT re-query with `get()` | ✅ PASS | No `RETURNING` clause in new SQL |
| `load_sql()` from `app.repositories.base` | ✅ PASS | Used in all new repos |
| `services_scope()` is `@contextmanager` not `Depends` | ✅ PASS | New repos added to existing scope |
| Sync `def` router handlers | ✅ PASS | No `async def` in new routers |
| Tests: TestClient, sync `def test_*`, no asyncio | ✅ PASS | All new tests follow this |
| No `passlib` | ✅ PASS | No auth changes in this feature |
| Frontend: `features/<domain>/`, `pages/`, `components/` | ✅ PASS | New UI follows existing structure |

## Project Structure

### Documentation (this feature)

```text
specs/024-ux-gamemode-enhancements/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT yet created)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── db/
│   │   └── migrations/
│   │       ├── 008_team_mexicano.sql      ← NEW
│   │       └── 009_substitutions.sql      ← NEW
│   ├── domain/
│   │   ├── models.py                      ← MODIFIED (EventTeam, EventSubstitution, Event.is_team_mexicano)
│   │   └── enums.py                       ← UNCHANGED
│   ├── repositories/
│   │   ├── event_teams_repo.py            ← NEW
│   │   ├── substitutions_repo.py          ← NEW
│   │   ├── events_repo.py                 ← MODIFIED (is_team_mexicano column)
│   │   └── sql/
│   │       ├── events/
│   │       │   ├── create.sql             ← MODIFIED
│   │       │   ├── get_by_id.sql          ← MODIFIED
│   │       │   ├── list_all.sql           ← MODIFIED
│   │       │   └── update_setup.sql       ← MODIFIED
│   │       ├── event_teams/               ← NEW folder
│   │       │   ├── create.sql             ← NEW
│   │       │   ├── list_by_event.sql      ← NEW
│   │       │   └── delete_by_event.sql    ← NEW
│   │       └── substitutions/             ← NEW folder
│   │           ├── create.sql             ← NEW
│   │           └── list_by_event.sql      ← NEW
│   ├── services/
│   │   ├── event_service.py               ← MODIFIED (Team Mexicano validation, mode-change guard)
│   │   ├── mexicano_service.py            ← MODIFIED (fixed-pair scheduling)
│   │   ├── round_service.py               ← MODIFIED (remove Mexicano round cap)
│   │   └── summary_ordering.py            ← MODIFIED (tiebreaker hierarchy)
│   └── api/
│       ├── schemas/
│       │   └── events.py                  ← MODIFIED (isTeamMexicano field)
│       ├── routers/
│       │   └── events.py                  ← MODIFIED (new /teams, /substitute endpoints)
│       └── deps.py                        ← MODIFIED (new repos in services_scope)

frontend/
├── src/
│   ├── components/
│   │   ├── courts/
│   │   │   └── CourtGrid.tsx              ← MODIFIED (split player names)
│   │   └── nav/
│   │       └── CardNav.css                ← MODIFIED (overflow fix)
│   ├── styles/
│   │   └── components.css                 ← MODIFIED (dropdown z-index)
│   ├── pages/
│   │   ├── PreviewEvent.tsx               ← MODIFIED (window.open)
│   │   └── RunEvent.tsx                   ← MODIFIED (decouple Next/Finish, sub button)
│   └── lib/
│       ├── types.ts                        ← MODIFIED (isTeamMexicano, EventTeam, SubstitutePlayerPayload)
│       └── api.ts                          ← MODIFIED (setEventTeams, getEventTeams, substitutePlayer)

tests/
├── unit/
│   ├── test_summary_ordering.py            ← MODIFIED (tiebreaker tests)
│   ├── test_event_teams_repo.py            ← NEW
│   └── test_substitutions_repo.py          ← NEW
└── contract/
    ├── test_events_api_team_mexicano.py    ← NEW
    └── test_events_api_substitute.py      ← NEW

docs/
└── game-modes/                            ← NEW folder
    ├── mexicano.md                        ← NEW
    ├── winners-court.md                   ← NEW
    └── ranked-box.md                      ← NEW
```

**Structure Decision**: Web application layout (Option 2). Backend is `backend/`, frontend is `frontend/`.
Follows the existing project structure exactly. New repositories land in `backend/app/repositories/`,
new SQL in `backend/app/repositories/sql/<table>/`, new migrations in `backend/app/db/migrations/`.

## Complexity Tracking

> No constitution violations detected. No justification table required.
