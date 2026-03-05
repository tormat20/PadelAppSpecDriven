# Implementation Plan: Player Stats, Search & Monthly Leaderboards

**Branch**: `022-player-stats-search` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/022-player-stats-search/spec.md`

## Summary

Add a "Search Player" 4th nav card, a player search page, a per-player statistics
page (all-time Mexicano score, BeatTheBox score, events attended, WinnersCourt
match record + doughnut chart, BeatTheBox win/loss/draw doughnut chart), and two
monthly leaderboards on the home page (Player of the Month + Mexicano Player of the
Month).

Backend: new DuckDB migration (3 tables), new `PlayerStatsRepository`, new
`PlayerStatsService`, new `/players/{id}/stats` endpoint, new
`/leaderboards/player-of-month` and `/leaderboards/mexicano-of-month` endpoints.
Stats are written idempotently at event finalization.
Frontend: two new pages (`SearchPlayer`, `PlayerStats`), two new feature helper
modules (SVG doughnut `chartData.ts`, `formatStats.ts`, `rankLeaderboard.ts`), home
page leaderboard sections, 4th nav card, 2 new routes, 3 new test files.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.12 (backend)  
**Primary Dependencies**: React 18.3, React Router DOM 6, Vite 5, Vitest 2, FastAPI, Pydantic v2, DuckDB  
**Storage**: DuckDB-backed repositories; migration `005_player_stats.sql` adds 3 new tables  
**Testing**: Vitest 2 (frontend unit tests in `frontend/tests/`); pytest (backend integration tests in `backend/tests/`)  
**Target Platform**: Web (desktop-first, responsive)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Search results visible within one animation frame per keystroke (in-memory filter from pre-fetched player list); stats page data fetched once on mount  
**Constraints**: Zero new frontend dependencies (inline SVG doughnut); stats writes are idempotent (each event credited at most once per player)  
**Scale/Scope**: ~20 files touched/created across backend and frontend

## Constitution Check

No violations. All changes are additive. The three new DB tables have no foreign
key constraints on the existing schema. The `finish_event` hook is the canonical
write point — injecting `PlayerStatsService` there is the minimal, correct change.
No new packages added.

## Project Structure

### Documentation (this feature)

```text
specs/022-player-stats-search/
├── plan.md              ← this file
├── research.md          ← Phase 0 codebase findings
├── data-model.md        ← entity shapes and API contract
├── quickstart.md        ← local setup notes
├── contracts/
│   └── api.md           ← endpoint request/response shapes
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
backend/
├── app/
│   ├── db/
│   │   └── migrations/
│   │       └── 005_player_stats.sql               ← NEW: 3 new tables
│   ├── repositories/
│   │   ├── player_stats_repo.py                   ← NEW
│   │   └── sql/
│   │       └── player_stats/                      ← NEW: 7 SQL files
│   │           ├── is_event_applied.sql
│   │           ├── mark_event_applied.sql
│   │           ├── upsert_player_stats.sql
│   │           ├── upsert_monthly_player_stats.sql
│   │           ├── get_player_stats.sql
│   │           ├── get_player_of_month.sql
│   │           └── get_mexicano_of_month.sql
│   ├── services/
│   │   ├── player_stats_service.py                ← NEW
│   │   └── summary_service.py                     ← MODIFY: inject + call apply_event_stats
│   └── api/
│       ├── deps.py                                ← MODIFY: wire new repo + service
│       ├── schemas/
│       │   └── stats.py                           ← NEW: PlayerStatsResponse, LeaderboardResponse
│       └── routers/
│           ├── players.py                         ← MODIFY: add GET /{id}/stats endpoint
│           └── leaderboards.py                    ← NEW: player-of-month + mexicano-of-month
│   └── main.py                                    ← MODIFY: include leaderboards router

frontend/
├── src/
│   ├── lib/
│   │   ├── types.ts                               ← MODIFY: add PlayerStats, LeaderboardEntry, Leaderboard
│   │   └── api.ts                                 ← MODIFY: add getPlayerStats, getPlayerOfMonthLeaderboard, getMexicanoOfMonthLeaderboard
│   ├── features/
│   │   ├── player-stats/
│   │   │   ├── chartData.ts                       ← NEW: buildDoughnutSegments()
│   │   │   └── formatStats.ts                     ← NEW: formatStatValue()
│   │   └── leaderboards/
│   │       └── rankLeaderboard.ts                 ← NEW: rankLeaderboardEntries()
│   ├── components/
│   │   └── nav/
│   │       └── CardNav.tsx                        ← MODIFY: add 4th nav card
│   ├── pages/
│   │   ├── Home.tsx                               ← MODIFY: replace stub body with leaderboard sections
│   │   ├── SearchPlayer.tsx                       ← NEW
│   │   └── PlayerStats.tsx                        ← NEW
│   ├── styles/
│   │   └── components.css                         ← MODIFY: add .card-nav-card--search colour class + leaderboard + stats page styles
│   └── app/
│       └── routes.tsx                             ← MODIFY: add /players/search and /players/:playerId/stats routes
└── tests/
    ├── player-stats-chart-data.test.ts             ← NEW
    ├── player-stats-format.test.ts                 ← NEW
    └── leaderboard-ranking.test.ts                 ← NEW
```

**Structure Decision**: Web application (Option 2). Backend follows the existing
`routers/ → services/ → repositories/ → sql/` pattern. Frontend follows the
`features/<domain>/`, `pages/`, `components/` layout established by prior features.

## Complexity Tracking

No constitution violations — table not required.
