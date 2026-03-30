# Tasks: Player Stats Overview Redesign

**Input**: Design documents from `specs/042-stats-overview-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Include targeted tests for the new `buildGroupedBars` helper and the americano score split service logic.

**Organization**: Tasks are grouped by user story / phase to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`–`[US4]`)
- Include exact file paths in every task description

---

## Phase 1: Foundational — DB Migration & Backend Score Split (Blocking)

**Purpose**: Introduce `americano_score_total` column and route Americano event scores to it. This blocks US4 and the "All Stats" tab Americano card.

**⚠️ CRITICAL**: Backend score-split work must complete before frontend can show separate Americano totals.

- [ ] T001 [US4] Write DB migration adding `americano_score_total INTEGER NOT NULL DEFAULT 0` to `player_stats` table in `backend/app/db/migrations/019_americano_score_split.sql`
- [ ] T002 [US4] Update `upsert_player_stats.sql` to include `americano_score_total` as 14th positional param in `backend/app/repositories/sql/player_stats/upsert_player_stats.sql`
- [ ] T003 [US4] Update `get_player_stats.sql` SELECT to include `americano_score_total` (becomes `row[13]`) in `backend/app/repositories/sql/player_stats/get_player_stats.sql`
- [ ] T004 [US4] Update `player_stats_repo.py` to pass 14th upsert arg and map `row[13]` → `americano_score_total` on read in `backend/app/repositories/player_stats_repo.py`
- [ ] T005 [US4] Add `americano_score_total: int` field to `PlayerStatsResponse` schema in `backend/app/api/schemas/stats.py`
- [ ] T006 [US4] Pass `americano_score_total` when constructing `PlayerStatsResponse` in `backend/app/api/routers/players.py`
- [ ] T007 [US4] In `player_stats_service.py` `_accumulate_match()`: route `EventType.AMERICANO` deltas to `americano_score_total` instead of `mexicano_score_total` in `backend/app/services/player_stats_service.py`

**Checkpoint**: `GET /players/{id}/stats` response includes `americano_score_total`. Backend pytest suite passes.

---

## Phase 2: Frontend Type & API Layer

**Purpose**: Expose the new backend field to the frontend. Blocks the "All Stats" tab Americano card and the US4 acceptance test.

- [ ] T008 [P] [US4] Add `americanoScoreTotal: number` to `PlayerStats` interface in `frontend/src/lib/types.ts`
- [ ] T009 [P] [US4] Map `data.americano_score_total` → `americanoScoreTotal` in `getPlayerStats()` in `frontend/src/lib/api.ts`

**Checkpoint**: TypeScript compiles; `getPlayerStats()` returns `americanoScoreTotal`.

---

## Phase 3: Grouped Bar Chart Helper (US3)

**Purpose**: Add `buildGroupedBars` to `chartData.ts` for use in RB and WC deep-dive tabs. `buildStackedBars` is NOT removed.

**Goal**: Pure helper function with full unit test coverage before any UI wiring.

### Tests for US3

- [ ] T010 [P] [US3] Add `buildGroupedBars` unit tests (3-bar RB case, 2-bar WC case, zero-count bar omission, single-round case, shared Y scale) in `frontend/tests/player-stats-chart-data.test.ts`

### Implementation for US3

- [ ] T011 [US3] Add `GroupedBarData` and `GroupedBar` types and export `buildGroupedBars(rounds, showDraw)` to `frontend/src/features/player-stats/chartData.ts` — do NOT remove `buildStackedBars`

**Checkpoint**: `npm test -- --run tests/player-stats-chart-data.test.ts` passes with new grouped bar cases.

---

## Phase 4: User Story 1 — Tabbed Overview Panel

**Goal**: Replace the flat 4-card strip with a tabbed `<OverviewPanel>` in `PlayerStats.tsx`. "All Stats" shows 5 cards; mode tabs show WDL from `deepDive`.

**Independent Test**: Load `/players/:id/stats`. Verify tab pills render, "All Stats" shows 5 cards (Mexicano Total + Americano Total both present), mode tabs show WDL cards, "Loading…" placeholder shown when deepDive is null.

- [ ] T012 [US1] Add `OverviewPanel` component (tab state, pill rendering, conditional card layout) inline in `frontend/src/pages/PlayerStats.tsx` — "All Stats" tab shows Events Attended, Event Wins, Mexicano Total, Americano Total, RB Score using `stats` fields
- [ ] T013 [US1] Wire mode tabs ("Mexicano", "Americano", "Team Mexicano") to show WDL StatCards sourced from `deepDive?.mexicano.matchWdl`, `deepDive?.americano.matchWdl`, `deepDive?.teamMexicano.matchWdl` in `frontend/src/pages/PlayerStats.tsx`
- [ ] T014 [US1] Show `<p className="muted">Loading…</p>` when `deepDive` is `null` and a mode tab is active in `frontend/src/pages/PlayerStats.tsx`

**Checkpoint**: Overview panel renders with correct default tab and tab switching works without crash.

---

## Phase 5: User Story 2 — Remove Standalone Summary Sections

**Goal**: Delete the WinnersCourt and Ranked Box standalone `<section>` elements from `PlayerStats.tsx`.

**Independent Test**: Load stats page; confirm no standalone WC or RB section in DOM; Deep Dive tabs still render WC/RB content.

- [ ] T015 [US2] Remove standalone WinnersCourt `<section>` (~lines 677–697) from `frontend/src/pages/PlayerStats.tsx`
- [ ] T016 [US2] Remove standalone Ranked Box `<section>` (~lines 699–722) from `frontend/src/pages/PlayerStats.tsx`
- [ ] T017 [US2] Add `stats: PlayerStats` prop to `DeepDivePanel` and pass WC summary fields (`wcWins`, `wcLosses`, `wcMatchesPlayed`) down to `WinnersCourtTab` in `frontend/src/pages/PlayerStats.tsx`

**Checkpoint**: Page renders with no standalone WC/RB sections; WC Deep Dive tab still shows doughnut correctly.

---

## Phase 6: User Story 3 — Wire Grouped Bar Charts in Deep Dive

**Goal**: Replace `<StackedBarChart>` with `<GroupedBarChart>` in `WinnersCourtTab` and `RankedBoxTab`.

**Independent Test**: Open Ranked Box deep-dive tab — see 3 side-by-side bars per round. Open Winners Court tab — see 2 bars per round. All bars share same Y scale.

- [ ] T018 [US3] Add `GroupedBarChart` SVG component inline in `frontend/src/pages/PlayerStats.tsx` (sub-bar width = `slotW / N - gap`; bar grows upward from shared baseline; zero-count bars omitted; round label centred below group)
- [ ] T019 [US3] Replace `<StackedBarChart>` with `<GroupedBarChart showDraw={true}>` in `RankedBoxTab`, passing `buildGroupedBars(perRoundWdl, true)` in `frontend/src/pages/PlayerStats.tsx`
- [ ] T020 [US3] Replace `<StackedBarChart>` with `<GroupedBarChart showDraw={false}>` in `WinnersCourtTab`, passing `buildGroupedBars(perRoundWdl, false)` in `frontend/src/pages/PlayerStats.tsx`

**Checkpoint**: Both deep-dive tabs render grouped bars. `buildStackedBars` remains exported and unused-but-present.

---

## Phase 7: Polish & Verification

**Purpose**: Cross-cutting checks across all stories before PR.

- [ ] T021 [P] Run `cd frontend && npm run lint` and fix any new lint errors in changed files
- [ ] T022 [P] Run `cd frontend && npm test -- --run tests/player-stats-chart-data.test.ts` and confirm all grouped bar tests pass
- [ ] T023 [P] Run `cd backend && PYTHONPATH=. pytest` and confirm all backend tests pass (migration applied, score split correct)
- [ ] T024 Run `cd frontend && npm test` full suite and confirm no regressions

**Checkpoint**: Lint clean, all tests green, no regressions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: Starts immediately — blocks Phase 2 and US4 frontend work.
- **Phase 2 (Frontend type/API)**: Depends on Phase 1 schema changes being known (can be coded in parallel with Phase 1, but requires Phase 1 complete to verify).
- **Phase 3 (Grouped bar helper)**: Independent — can start immediately in parallel with Phase 1.
- **Phase 4 (Overview panel)**: Depends on Phase 2 (needs `americanoScoreTotal` type).
- **Phase 5 (Remove sections)**: Independent of Phase 4 — can proceed after Phase 3 (needs `DeepDivePanel` prop change).
- **Phase 6 (Wire grouped bars)**: Depends on Phase 3 (needs `buildGroupedBars`) and Phase 5 (WC prop wiring).
- **Phase 7 (Polish)**: Depends on all phases complete.

### Task-Level Dependencies (highlights)

- T001 → T002, T003, T004 (migration defines column before SQL/repo changes)
- T004 → T005 → T006 (repo → schema → router)
- T007 depends on T004 (upsert signature must accept new field)
- T008, T009 can be coded once T005 is known; verify after T006 complete
- T010 should be written before T011 (test-first for helper)
- T017 (prop addition) must precede T020 (WC tab usage of stats prop)
- T018 (GroupedBarChart component) must precede T019, T020

### Parallel Opportunities

- Phase 3 (T010, T011) runs in parallel with Phase 1
- T008 and T009 run in parallel with each other
- T015 and T016 run in parallel
- T021, T022, T023 run in parallel in Phase 7

---

## Implementation Strategy

### MVP First (US1 + US4 only)

1. Complete Phase 1 (DB + backend score split).
2. Complete Phase 2 (frontend type/API).
3. Complete Phase 4 (tabbed Overview panel with Americano Total card).
4. Validate: Overview shows 5 cards including separate Americano/Mexicano totals.

### Incremental Delivery

1. Phase 1 + 2 → Americano score tracked separately in DB and surfaced in API.
2. Phase 3 + 4 → Tabbed Overview panel live with correct data.
3. Phase 5 → Clean up removed sections.
4. Phase 6 → Grouped bar charts in Deep Dive.
5. Phase 7 → Final verification.

---

## Notes

- `buildStackedBars` must remain in `chartData.ts` — do not delete.
- No external charting library; all chart rendering is plain SVG.
- Migration number is 019; current latest is 018.
- Repository file is `player_stats_repo.py` (not `_repository`).
- `DeepDivePanel` needs `stats: PlayerStats` added as prop to pass WC summary fields to `WinnersCourtTab`.
- WDL data for mode tabs comes from `deepDive` (not `stats`); guard against `null` deepDive.
