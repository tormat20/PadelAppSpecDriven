# Tasks: Player Stats, Search & Monthly Leaderboards

**Input**: Design documents from `/specs/022-player-stats-search/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Included — frontend unit tests for pure helper functions (Vitest 2) are explicitly called out in plan.md. No backend test tasks (no TDD mandate on backend).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Foundational (Shared Backend Infrastructure)

**Purpose**: DB migration + repository + service + wiring changes that ALL four user stories depend on. US1 and US2 can each be built before this (search works with the existing `/players?query=` endpoint; the stats read path just returns zeros), but US3 and US4 require this phase's write path to be complete.

**⚠️ CRITICAL**: The `apply_event_stats` write hook (T007/T008) must be complete before leaderboard data can be verified end-to-end.

- [X] T001 Create DB migration `backend/app/db/migrations/005_player_stats.sql` with `player_stats`, `monthly_player_stats`, and `player_stats_event_log` tables
- [X] T002 [P] Create SQL directory `backend/app/repositories/sql/player_stats/` and add `is_event_applied.sql` and `mark_event_applied.sql`
- [X] T003 [P] Add `upsert_player_stats.sql` and `upsert_monthly_player_stats.sql` to `backend/app/repositories/sql/player_stats/`
- [X] T004 [P] Add `get_player_stats.sql`, `get_player_of_month.sql`, and `get_mexicano_of_month.sql` to `backend/app/repositories/sql/player_stats/`
- [X] T005 Create `backend/app/repositories/player_stats_repo.py` implementing `PlayerStatsRepository` (depends on T002, T003, T004)
- [X] T006 Create `backend/app/services/player_stats_service.py` implementing `PlayerStatsService` with `apply_event_stats`, `get_player_stats`, `get_player_of_month_leaderboard`, `get_mexicano_of_month_leaderboard` (depends on T005)
- [X] T007 Wire `PlayerStatsRepository` and `PlayerStatsService` into `backend/app/api/deps.py` inside `services_scope()` (depends on T006)
- [X] T008 Inject `PlayerStatsService` into `SummaryService` and call `apply_event_stats(event_id)` after `set_status` in `backend/app/services/summary_service.py` (depends on T007)
- [X] T009 Create `backend/app/api/schemas/stats.py` with `PlayerStatsResponse`, `LeaderboardEntryResponse`, `LeaderboardResponse` (can run in parallel with T005–T008)

**Checkpoint**: Migration runs, stats tables created, stats are written idempotently at event finalization — foundational write path complete.

---

## Phase 2: User Story 1 – Search for a Player and View Their Stats (Priority: P1) 🎯 MVP

**Goal**: "Search Player" 4th nav card is visible, leads to a search page where the user can filter players by partial name and tap through to the player stats page.

**Independent Test**: Navigate to the app → tap "Search Player" → type a partial name → confirm filtered list appears → tap a player → confirm `/players/:id/stats` route loads.

### Implementation for User Story 1

- [X] T010 [P] [US1] Add `PlayerStats`, `LeaderboardEntry`, `Leaderboard` types to `frontend/src/lib/types.ts`
- [X] T011 [P] [US1] Add `getPlayerStats`, `getPlayerOfMonthLeaderboard`, `getMexicanoOfMonthLeaderboard` API functions to `frontend/src/lib/api.ts`
- [X] T012 [P] [US1] Add 4th nav card entry (`"Search Player"`, route `/players/search`, CSS class `card-nav-card--search`) to `NAV_CARDS` in `frontend/src/components/nav/CardNav.tsx`
- [X] T013 [P] [US1] Add `.card-nav-card--search` colour class to `frontend/src/styles/components.css`
- [X] T014 [US1] Create `frontend/src/pages/SearchPlayer.tsx` — text input, real-time case-insensitive substring filter via `searchPlayers()` + client-side filter, player list, empty state, tap navigates to `/players/:id/stats` (depends on T010, T011)
- [X] T015 [US1] Add routes `/players/search` (→ `SearchPlayer`) and `/players/:playerId/stats` (→ `PlayerStats`) to `frontend/src/app/routes.tsx` (depends on T014; `PlayerStats` can be a stub page initially)

**Checkpoint**: User Story 1 is fully functional — search page is reachable from nav, filtering works, routing to stats page works.

---

## Phase 3: User Story 2 – View Player Statistics Page (Priority: P1) 🎯 MVP

**Goal**: Player statistics page shows all-time stats — Mexicano total, Beat the Box total, events attended, WinnersCourt match record + win/loss doughnut, Beat the Box win/loss/draw doughnut.

**Independent Test**: Navigate directly to `/players/:knownId/stats` for a player with finalized events → verify each stat is non-zero and correct; visit with a zero-stats player → verify all zeros shown, no crashes.

### Tests for User Story 2 (pure helper unit tests)

- [X] T016 [P] [US2] Create `frontend/tests/player-stats-chart-data.test.ts` — unit tests for `buildDoughnutSegments()`: normal split, 100%/0%, all-zeros fallback, verify no division-by-zero
- [X] T017 [P] [US2] Create `frontend/tests/player-stats-format.test.ts` — unit tests for `formatStatValue()`: integer, zero, label trimming

### Implementation for User Story 2

- [X] T018 [US2] Add `GET /{player_id}/stats` endpoint to `backend/app/api/routers/players.py`, returning `PlayerStatsResponse`; 404 if player not found (depends on T009, T006)
- [X] T019 [P] [US2] Create `frontend/src/features/player-stats/chartData.ts` implementing `buildDoughnutSegments()` with SVG arc math + 100%/0% two-arc workaround (depends on T016 test writing)
- [X] T020 [P] [US2] Create `frontend/src/features/player-stats/formatStats.ts` implementing `formatStatValue()` (depends on T017 test writing)
- [X] T021 [US2] Create `frontend/src/pages/PlayerStats.tsx` — fetches `getPlayerStats(playerId)`, renders all-time stat cards, WinnersCourt doughnut, Beat the Box doughnut, graceful zero state, error state with retry (depends on T010, T011, T019, T020)
- [X] T022 [US2] Add leaderboard + stats page styles to `frontend/src/styles/components.css` — stat card layout, doughnut chart container, empty/error state classes

**Checkpoint**: User Stories 1 and 2 are independently functional — full search → stats flow works end-to-end.

---

## Phase 4: User Story 3 – Player of the Month Leaderboard (Priority: P2)

**Goal**: Home page shows a "Player of the Month" section ranked by events-played this calendar month, with Mexicano score and Beat the Box score as tiebreakers.

**Independent Test**: Finalize 2+ events in the current calendar month → open the home page → verify leaderboard section appears with correct player rankings per the 3-tier rule.

### Tests for User Story 3 (pure helper unit tests)

- [X] T023 [P] [US3] Create `frontend/tests/leaderboard-ranking.test.ts` — unit tests for `rankLeaderboardEntries()`: primary sort, tiebreaker 1 (Mexicano), tiebreaker 2 (BtB), dense/skip ranking, empty list

### Implementation for User Story 3

- [X] T024 [US3] Create `backend/app/api/routers/leaderboards.py` with `GET /leaderboards/player-of-month` endpoint returning `LeaderboardResponse` (depends on T009, T006, Foundational Phase complete)
- [X] T025 [US3] Register the leaderboards router in `backend/app/main.py` (depends on T024)
- [X] T026 [P] [US3] Create `frontend/src/features/leaderboards/rankLeaderboard.ts` implementing `rankLeaderboardEntries()` — sorts by `eventsPlayed` DESC → `mexicanoScore` DESC → `btbScore` DESC, assigns `rank` with dense-rank semantics (depends on T023 test writing)
- [X] T027 [US3] Add Player of the Month leaderboard section to `frontend/src/pages/Home.tsx` — calls `getPlayerOfMonthLeaderboard()`, renders ranked rows (rank + displayName + eventsPlayed), empty state, error state (depends on T010, T011, T026)

**Checkpoint**: Player of the Month leaderboard is visible on the home page and reflects current-month finalized events.

---

## Phase 5: User Story 4 – Mexicano Player of the Month Leaderboard (Priority: P2)

**Goal**: Home page also shows a "Mexicano Player of the Month" section ranked purely by Mexicano points this month.

**Independent Test**: Finalize 2+ Mexicano events in the current month → home page shows Mexicano leaderboard with the correct highest scorer at rank 1; players with only non-Mexicano events do not appear.

### Implementation for User Story 4

- [X] T028 [US4] Add `GET /leaderboards/mexicano-of-month` endpoint to `backend/app/api/routers/leaderboards.py` (depends on T024, T009, T006)
- [X] T029 [US4] Add Mexicano Player of the Month leaderboard section to `frontend/src/pages/Home.tsx` — calls `getMexicanoOfMonthLeaderboard()`, renders ranked rows (rank + displayName + mexicanoScore), empty state (depends on T010, T011, T026, T027)

**Checkpoint**: Both monthly leaderboards render independently on the home page. All four user stories are complete and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge-case hardening across all stories.

- [X] T030 [P] Verify all Vitest tests pass: `npm test` in `frontend/` — `player-stats-chart-data.test.ts`, `player-stats-format.test.ts`, `leaderboard-ranking.test.ts`
- [X] T031 [P] Run `npm run lint` in `frontend/` and resolve any TypeScript errors
- [X] T032 Run quickstart.md smoke tests end-to-end: create event → finish event → verify stats written → verify search → verify stats page → verify leaderboards
- [X] T033 Verify idempotency: call `finish_event` twice for the same event ID → confirm stats counters are not double-counted

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No upstream dependencies — start immediately
- **US1 (Phase 2)**: Can start independently of Foundational (search uses existing `/players?query=` endpoint; stats page just needs a route stub) — no blocking dependency
- **US2 (Phase 3)**: Depends on `GET /players/{id}/stats` endpoint from Foundational (T018 needs T006/T009); frontend page (T021) is writable before backend exists with a loading stub
- **US3 (Phase 4)**: Requires Foundational write path complete (T007, T008) for leaderboard data to be populated; T024 needs T006 + T009
- **US4 (Phase 5)**: Depends on US3 (shares router file T024)
- **Polish (Phase 6)**: Depends on all desired stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — uses only the existing player search endpoint
- **US2 (P1)**: Backend endpoint needs Foundational service (T006); frontend can be built in parallel
- **US3 (P2)**: Requires full Foundational write path; can otherwise proceed once Phase 1 is done
- **US4 (P2)**: Depends on US3 router file (adds endpoint to same file)

### Within Each User Story

- SQL files before repository class (T002–T004 → T005)
- Repository before service (T005 → T006)
- Service before endpoints (T006 → T018, T024, T028)
- Types + API client before pages (T010, T011 → T014, T021, T027, T029)
- Pure helper tests written before helper implementation (T016 → T019, T017 → T020, T023 → T026)

### Parallel Opportunities

- T002, T003, T004, T009 can all run in parallel (different SQL/schema files, no mutual dependencies)
- T010, T011, T012, T013 can all run in parallel (different frontend files)
- T016, T017, T023 (test scaffolds) can be written in parallel before any implementation
- T019, T020 can run in parallel once their respective test files exist
- T024 and T018 can run in parallel (different router files)

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1 (Foundational) in parallel with Phase 2 (US1)
2. Complete Phase 3 (US2) — stats endpoint + stats page
3. **STOP and VALIDATE**: Full search → stats flow works
4. Deploy/demo if ready

### Full Delivery

1. Phase 1 + Phase 2 in parallel → foundation + search nav ready
2. Phase 3 (US2) → stats page complete
3. Phase 4 (US3) → Player of the Month leaderboard
4. Phase 5 (US4) → Mexicano leaderboard (fast — reuses US3 infrastructure)
5. Phase 6 → Polish + validation

---

## Notes

- `[P]` = can run in parallel with other `[P]` tasks (different files, no dependencies)
- `[USn]` = maps task to user story for traceability
- Tests (T016, T017, T023) must be written **before** their implementations (T019, T020, T026) — verify they fail first
- Zero-stats player scenario: `GET /players/{id}/stats` returns all zeros when no `player_stats` row exists — zero-fill in `PlayerStatsService.get_player_stats()`
- Doughnut 100%/0% edge case: two 180° SVG arcs workaround documented in `data-model.md`
- Leaderboard empty month: endpoint returns `{ year, month, entries: [] }` — frontend shows empty state message
- Stats idempotency guaranteed by `player_stats_event_log` table — check `is_event_applied` before any write in `apply_event_stats`
