# Implementation Plan: Player Management & Reset Controls (033)

**Branch**: `033-player-management-reset` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-player-management-reset/spec.md`

---

## Summary

Add admin controls to reset all player stats or delete all players from Account Settings, and add per-player delete with edit mode to the Player Search page. Three new backend endpoints (all admin-only) plus a reusable `ConfirmDialog` component handle the destructive operations. No schema migrations required.

---

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)
**Primary Dependencies**: FastAPI, DuckDB (backend); React Router DOM 6, Vite 5, Vitest 2 (frontend)
**Storage**: DuckDB via existing repositories — no new tables, no migration
**Testing**: pytest (backend), Vitest (frontend)
**Target Platform**: Linux server (backend), browser SPA (frontend)
**Project Type**: Web application (REST API + React SPA)
**Performance Goals**: Admin operations complete in < 1s for typical player counts (< 1000 rows)
**Constraints**: All CSS via design tokens (`var(--color-*)`); no hardcoded hex; no new npm packages
**Scale/Scope**: ~3 new backend endpoints, ~1 new React component, ~2 modified pages, 1 new test file per layer

---

## Constitution Check

- No new npm packages required (ConfirmDialog uses existing DOM/CSS patterns)
- No schema migration (all operations on existing tables)
- All endpoints admin-only (`require_admin` dependency)
- All interactive buttons use `withInteractiveSurface()`
- Tests follow pure-function export + Vitest unit test pattern
- No `sessionStorage`/`document` usage in test files

---

## Project Structure

### Documentation (this feature)

```text
specs/033-player-management-reset/
├── plan.md                                        # This file
├── spec.md                                        # Feature spec (4 user stories)
├── research.md                                    # Phase 0 output
├── data-model.md                                  # Phase 1 output
├── quickstart.md                                  # Phase 1 output
├── checklists/
│   └── requirements.md
└── contracts/
    ├── backend-player-delete-endpoints.md         # 3 API endpoint contracts
    ├── frontend-confirm-dialog-and-css.md         # ConfirmDialog + CSS
    └── frontend-account-settings-and-search.md   # Page-level contracts
```

### Source Code (this feature)

```text
backend/
├── app/
│   ├── api/
│   │   └── routers/
│   │       ├── admin.py            # NEW — POST /admin/players/reset-stats, DELETE /admin/players
│   │       └── players.py          # MODIFIED — add DELETE /{player_id}
│   ├── main.py                     # MODIFIED — register admin router
│   ├── api/deps.py                 # MODIFIED — pass player_stats_repo to PlayerService
│   ├── repositories/
│   │   ├── players_repo.py         # MODIFIED — delete(), delete_all()
│   │   └── player_stats_repo.py    # MODIFIED — reset_all_stats()
│   └── services/
│       └── player_service.py       # MODIFIED — delete_player(), delete_all_players(), reset_all_player_stats()
└── tests/
    └── test_player_delete.py       # NEW — 8 test cases

frontend/
├── src/
│   ├── components/
│   │   └── ConfirmDialog.tsx       # NEW — reusable modal confirmation component
│   ├── pages/
│   │   ├── AccountSettings.tsx     # MODIFIED — Player Management section (US1, US2)
│   │   └── SearchPlayer.tsx        # MODIFIED — richer rows, edit mode, per-player delete (US3, US4)
│   ├── lib/
│   │   └── api.ts                  # MODIFIED — deletePlayer(), resetAllPlayerStats(), deleteAllPlayers()
│   └── styles/
│       └── components.css          # MODIFIED — .button--danger, .confirm-dialog*, settings/search layout
└── tests/
    └── player-search-filter.test.ts  # NEW — unit tests for exported filterPlayers()
```

**Structure Decision**: Web application (Option 2) — separate `backend/` and `frontend/` directories matching the existing repo layout.

---

## Complexity Tracking

> No constitution violations. All patterns follow existing codebase conventions.
