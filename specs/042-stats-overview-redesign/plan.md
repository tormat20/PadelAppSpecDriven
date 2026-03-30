# Implementation Plan: Player Stats Overview Redesign

**Branch**: `042-stats-overview-redesign` | **Date**: 2026-03-30 | **Spec**: `specs/042-stats-overview-redesign/spec.md`
**Input**: Feature specification from `specs/042-stats-overview-redesign/spec.md`

## Summary

Redesign the player stats page with four coordinated changes: replace the flat overview strip with a tabbed Overview panel (5-card "All Stats" default + per-mode WDL tabs); remove two standalone summary sections (WinnersCourt, Ranked Box); replace proportional stacked bars in RB/WC deep-dive tabs with grouped absolute-count bars; and split Americano score accumulation into its own DB column separate from Mexicano.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)
**Primary Dependencies**: FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2
**Storage**: DuckDB — new `americano_score_total` column via migration 019
**Testing**: `pytest` (backend), `vitest` + `tsc --noEmit` (frontend)
**Target Platform**: Web application (desktop-first, mobile supported)
**Project Type**: Web application (`backend/` + `frontend/`)
**Performance Goals**: No new API calls introduced; overview tab switches are purely in-memory state changes
**Constraints**: `buildStackedBars` must not be deleted; no external charting library; changes scoped to player stats page and related backend only
**Scale/Scope**: Single stats page + one backend migration + one service method change

## Constitution Check

- Constitution file `.specify/memory/constitution.md` is a placeholder template with no enforceable principles.
- Gate result: **PASS** (no constitutional blockers).
- Enforced quality gates:
  - Frontend: `npm run lint`, targeted player-stats chart data tests, full Vitest pass.
  - Backend: `pytest` coverage for americano score split and migration correctness.
  - Product gate: existing deep-dive behavior must not regress.

## Project Structure

### Documentation (this feature)

```text
specs/042-stats-overview-redesign/
├── spec.md
├── plan.md                  # This file
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── routers/players.py          # Add americano_score_total to response
│   │   └── schemas/stats.py            # Add americano_score_total field
│   ├── repositories/
│   │   ├── player_stats_repo.py        # Add column to upsert/select
│   │   └── sql/player_stats/
│   │       ├── upsert_player_stats.sql # Add 14th column
│   │       └── get_player_stats.sql    # Add to SELECT
│   └── services/
│       └── player_stats_service.py     # Route Americano into new column
└── app/db/migrations/
    └── 019_americano_score_split.sql   # New column + default 0

frontend/
├── src/
│   ├── lib/
│   │   ├── types.ts                    # Add americanoScoreTotal to PlayerStats
│   │   └── api.ts                      # Map new field in getPlayerStats()
│   ├── features/player-stats/
│   │   └── chartData.ts                # Add buildGroupedBars(); keep buildStackedBars
│   └── pages/
│       └── PlayerStats.tsx             # Tabbed Overview; remove standalone sections; GroupedBarChart
└── tests/
    └── player-stats-chart-data.test.ts # Tests for buildGroupedBars
```

**Structure Decision**: Extend existing layered backend (router → service → repository → SQL) and the existing `PlayerStats.tsx` page component. No new files required except the DB migration and grouped bar test additions.

## Detailed Design Notes

### Phase 1 — DB migration (019)

New column: `ALTER TABLE player_stats ADD COLUMN americano_score_total INTEGER NOT NULL DEFAULT 0;`

Migration file: `backend/app/db/migrations/019_americano_score_split.sql`

Current latest migration: `018_players_drop_unique_display_name.sql`

### Phase 2 — Backend score split

File: `backend/app/services/player_stats_service.py`

`_accumulate_match()` currently routes all `SCORE_24` event deltas into `mexicano_score_delta`. Change: check `event_type == EventType.AMERICANO` → add to `americano_score_total`; otherwise keep adding to `mexicano_score_total`.

Files changed:
- `backend/app/repositories/sql/player_stats/upsert_player_stats.sql` — 13 → 14 positional `?` params
- `backend/app/repositories/sql/player_stats/get_player_stats.sql` — new column in SELECT, becomes `row[13]`
- `backend/app/repositories/player_stats_repo.py` — pass 14th arg; map `row[13]` on read
- `backend/app/api/schemas/stats.py` — add `americano_score_total: int` field to `PlayerStatsResponse`
- `backend/app/api/routers/players.py` — pass new field when constructing `PlayerStatsResponse`

### Phase 3 — Frontend type and API

- `frontend/src/lib/types.ts` — add `americanoScoreTotal: number` to `PlayerStats` interface
- `frontend/src/lib/api.ts` — map `data.americano_score_total` → `americanoScoreTotal` in `getPlayerStats()`

### Phase 4 — Grouped bar chart helper

File: `frontend/src/features/player-stats/chartData.ts`

New export: `buildGroupedBars(rounds: RoundWDL[], showDraw: boolean): GroupedBarData`

- `showDraw=true` (RB): 3 sub-bars per round — Win / Draw / Loss
- `showDraw=false` (WC): 2 sub-bars per round — Win / Loss
- Bar height = `(count / globalMaxCount) * plotH`; globalMaxCount = max across all outcomes and all rounds
- Zero-count bars omitted
- `buildStackedBars` untouched

Test: `frontend/tests/player-stats-chart-data.test.ts` — add `buildGroupedBars` coverage

### Phase 5 — PlayerStats.tsx layout changes

**Overview panel (tabbed)**
- Replace flat 4-card strip (`statsCards` section) with `<OverviewPanel>` containing pill tabs
- "All Stats" tab: 5 StatCards (Events Attended, Event Wins, Mexicano Total, Americano Total, RB Score)
- Mode tabs: pull WDL from `deepDive?.mexicano.matchWdl` etc.; show "Loading…" if `deepDive` is null

**Remove standalone sections**
- Delete the WinnersCourt standalone `<section>` (currently ~lines 677–697)
- Delete the Ranked Box standalone `<section>` (currently ~lines 699–722)

**Grouped bar chart in DeepDive tabs**
- `WinnersCourtTab`: replace `<StackedBarChart>` call with `<GroupedBarChart>` using `buildGroupedBars(..., false)`
- `RankedBoxTab`: replace `<StackedBarChart>` call with `<GroupedBarChart>` using `buildGroupedBars(..., true)`
- `DeepDivePanel` gains `stats: PlayerStats` prop to pass WC summary fields to `WinnersCourtTab`

**GroupedBarChart SVG component** (inline in PlayerStats.tsx):
- Each round slot width divided evenly among N sub-bars
- Sub-bar width = `slotW / N - gap`
- Bar rect grows upward from shared baseline
- Round label centred below group

## Complexity Tracking

No constitution-driven complexity exemptions required.
