# Tasks: Normalized Court Score and Score Distribution Histograms

**Input**: Design documents from `/specs/046-court-score-distribution/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Test tasks are included where they cover new logic with no prior coverage.
Existing well-covered paths (e.g. `_compute_deep_dive` wiring) rely on contract tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no mutual dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new infrastructure required. All tables, repos, helpers, and test fixtures
already exist. This phase confirms the working baseline before any changes are made.

- [X] T001 Verify branch is `046-court-score-distribution` and all existing tests pass: run `cd backend && PYTHONPATH=. pytest` and `cd frontend && npm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and type changes that every downstream task depends on. Both backend
Pydantic models and frontend TypeScript types must be updated before any rendering or
service logic can reference the new field names.

**⚠️ CRITICAL**: No user story implementation can begin until T002 and T003 are complete.

- [X] T002 [P] Update Pydantic schemas in `backend/app/api/schemas/stats.py`: rename `RoundAvgCourt` → `RoundAvgCourtScore` (field `avg_court` → `avg_court_score`); add `ScoreDistEntry` and `ScoreDistPerCourt` models; update `Score24ModeStats` to rename `avg_court_per_round` → `avg_court_score_per_round`, `avg_court_overall` → `avg_court_score_overall`, and add `score_distribution: list[ScoreDistEntry]` and `score_distribution_per_court: list[ScoreDistPerCourt]`
- [X] T003 [P] Update TypeScript types in `frontend/src/lib/types.ts`: rename `RoundAvgCourt` → `RoundAvgCourtScore` (field `avgCourt` → `avgCourtScore`); add `ScoreDistEntry` and `ScoreDistPerCourt` types; update `Score24ModeStats` to rename `avgCourtPerRound` → `avgCourtScorePerRound`, `avgCourtOverall` → `avgCourtScoreOverall`, and add `scoreDistribution: ScoreDistEntry[]` and `scoreDistributionPerCourt: ScoreDistPerCourt[]`

**Checkpoint**: Schema and types compile. Frontend `npm run lint` and backend import checks pass before proceeding.

---

## Phase 3: User Story 1 — Normalized Court Score (Priority: P1) 🎯 MVP

**Goal**: Replace the raw "Avg court per round" chart with a normalized 0–10 "Avg court-score
per round" chart. Players who consistently reach the top court of any event always see 10,
regardless of the event's court range.

**Independent Test**: Create two events with different court ranges (e.g. courts 1–3 and
courts 2–6). Record a match for the same player at the top court of each event. Call
`GET /api/v1/players/{id}/stats/deep-dive` and confirm both rounds show `avg_court_score: 10`
in `avg_court_score_per_round`, and `avg_court_score_overall` is `10.0`.

### Unit tests for User Story 1

- [X] T004 [P] [US1] Write unit tests for `_normalize_court_score` in `backend/tests/unit/test_court_score_normalization.py`: cover contiguous courts, non-contiguous courts, single-court events, top/bottom/middle court positions, all spec acceptance scenarios (courts [2,3,4,5,6] → court 4 = 5.0; courts [1,3,4,5,7] → court 3 = 2.5; single court → 10.0)

### Implementation for User Story 1

- [X] T005 [US1] Add pure helper `_normalize_court_score(court_number: int, sorted_courts: list[int]) -> float` in `backend/app/services/player_stats_service.py` (rank-based formula: `(rank / (len-1)) * 10`; single-court special case returns 10.0) — confirm T004 tests now pass
- [X] T006 [US1] Update `PlayerStatsService.get_player_deep_dive()` in `backend/app/services/player_stats_service.py` to build `court_score_map: dict[str, dict[int, float]]` by collecting distinct `event_id`s from match rows and calling `self.events_repo.list_courts(event_id)` per event, then pass map to `_compute_deep_dive()`
- [X] T007 [US1] Update `_compute_deep_dive(rows, court_score_map)` signature in `backend/app/services/player_stats_service.py` to accept and forward `court_score_map` to `_compute_score24_stats()`
- [X] T008 [US1] Update `_compute_score24_stats(rows, court_score_map)` in `backend/app/services/player_stats_service.py`: replace raw court accumulation with `court_score_map[row["event_id"]][row["court_number"]]` lookups; rename output keys to `avg_court_score_per_round` and `avg_court_score_overall`; add placeholder keys `score_distribution` and `score_distribution_per_court` (empty / all-zero stubs are fine here — filled in US2/US3)
- [X] T009 [US1] Update `_empty_score24_stats()` in `backend/app/services/player_stats_service.py`: rename keys to `avg_court_score_per_round` and `avg_court_score_overall`; add `score_distribution: [{"score": i, "count": 0} for i in range(25)]` and `score_distribution_per_court: []`
- [X] T010 [US1] Update `CourtLineChart` component in `frontend/src/pages/PlayerStats.tsx`: change props to accept `data: RoundAvgCourtScore[]` and `avgCourtScoreOverall: number | null`; update label to "Avg court-score per round"; fix Y-axis to fixed `0–10` (remove dynamic `maxCourtInt` / `minCourt=1` logic); update dot/line values to use `r.avgCourtScore`; update overall-avg display text
- [X] T011 [US1] Update `Score24Tab` in `frontend/src/pages/PlayerStats.tsx` to pass `data.avgCourtScorePerRound` and `data.avgCourtScoreOverall` to the updated `CourtLineChart`; update the guard condition from `avgCourtPerRound` to `avgCourtScorePerRound`
- [X] T012 [US1] Fix all remaining TypeScript references in `frontend/src/pages/PlayerStats.tsx` that still use the old `RoundAvgCourt` type or old field names (`avgCourt`, `avgCourtPerRound`, `avgCourtOverall`) — run `npm run lint` to confirm zero errors

**Checkpoint**: `GET /api/v1/players/{id}/stats/deep-dive` returns `avg_court_score_per_round`
with values in `[0, 10]`. Frontend court chart Y-axis shows 0–10. All existing backend and
frontend tests still pass.

---

## Phase 4: User Story 2 — Score Distribution (All Courts) (Priority: P2)

**Goal**: Add a "Score distribution — All courts" bar chart to the Deep Dive panel. Both
team scores from every Score24 match contribute independently. X-axis fixed 0–24.

**Independent Test**: Record three matches with known scores (e.g. 7 vs 17, 10 vs 14, 12 vs 12).
Call `GET /api/v1/players/{id}/stats/deep-dive`. Confirm `score_distribution` has count=1 at
score=7, score=17, score=10, score=14 and count=2 at score=12. Confirm all 25 entries are
present including zero-count entries.

### Unit tests for User Story 2

- [X] T013 [P] [US2] Extend `backend/tests/unit/test_court_score_normalization.py` with distribution-building tests: verify both team scores are counted independently; verify all 25 entries always present; verify out-of-range scores (e.g. -1, 25) are silently ignored; verify empty rows produce all-zero distribution

### Implementation for User Story 2

- [X] T014 [US2] Implement score distribution accumulation in `_compute_score24_stats()` in `backend/app/services/player_stats_service.py`: for each row count `team1_score` and `team2_score` independently into a `counts[0..24]` array; replace the stub `score_distribution` value with `[{"score": i, "count": counts[i]} for i in range(25)]`; clamp/ignore values outside 0–24
- [X] T015 [P] [US2] Add `ScoreDistChart` component to `frontend/src/pages/PlayerStats.tsx`: accepts `distribution: ScoreDistEntry[]` and `title: string`; derives `maxCount = Math.max(1, ...distribution.map(d => d.count))`; calls `buildBarSegments(items, COLOR_TEAL, DIST_W, DIST_H, padX, padY, 0, maxCount)` where items = `distribution.map(d => ({ label: String(d.score), value: d.count }))`; renders the SVG inside `dd-chart-scroll` wrapper; shows inline empty-state `<p className="dd-empty-state muted">No score data yet.</p>` when all counts are zero
- [X] T016 [P] [US2] Add import of `buildBarSegments` and new types (`ScoreDistEntry`, `ScoreDistPerCourt`) to `frontend/src/pages/PlayerStats.tsx`
- [X] T017 [US2] Render `ScoreDistChart` for all-courts distribution in `Score24Tab` in `frontend/src/pages/PlayerStats.tsx`: add `<ScoreDistChart title="Score distribution — All courts" distribution={data.scoreDistribution} />` below the court chart section
- [X] T018 [P] [US2] Add `buildBarSegments` tests to `frontend/tests/player-stats-chart-data.test.ts`: verify 25-item distribution input produces 25 `BarSegment` outputs; verify all-zero input still produces 25 segments (height floored at 1px by existing impl); verify x positions are monotonically increasing; verify bar labeled "12" exists at index 12

**Checkpoint**: Deep Dive panel shows "Score distribution — All courts" with 25 bars. Bars
for played scores are taller. Empty state shows when no Score24 matches exist.

---

## Phase 5: User Story 3 — Per-Court Score Distribution (Priority: P3)

**Goal**: Add one distribution chart per court that has recorded matches, ordered by court
number ascending, below the all-courts chart.

**Independent Test**: Record matches on courts 3 and 5 only (no other courts). Call the
endpoint and confirm `score_distribution_per_court` contains exactly two entries with
`court_number: 3` and `court_number: 5`. Confirm no entry for court 7. Confirm each entry's
`distribution` has 25 entries.

### Unit tests for User Story 3

- [X] T019 [P] [US3] Extend `backend/tests/unit/test_court_score_normalization.py` with per-court distribution tests: verify only courts with at least one score appear; verify courts are ordered ascending; verify each court distribution has exactly 25 entries; verify a court that has only one score still appears

### Implementation for User Story 3

- [X] T020 [US3] Implement per-court distribution in `_compute_score24_stats()` in `backend/app/services/player_stats_service.py`: accumulate `team1_score` and `team2_score` into per-court count arrays `court_counts: dict[int, list[int]]`; after loop, build `score_distribution_per_court` as a list of `{"court_number": cn, "distribution": [...25 entries...]}` sorted by `court_number` ascending; include only courts where `sum(counts) > 0`; replace the stub value
- [X] T021 [US3] Render per-court distribution charts in `Score24Tab` in `frontend/src/pages/PlayerStats.tsx`: below the all-courts `ScoreDistChart`, add `{data.scoreDistributionPerCourt.map(c => (<ScoreDistChart key={c.courtNumber} title={\`Court \${c.courtNumber}\`} distribution={c.distribution} />))}`

**Checkpoint**: One distribution chart appears per court with data. Charts are absent for
courts with no recorded matches. Ordering is ascending by court number.

---

## Phase 6: Contract Tests & Polish

**Purpose**: API contract tests covering the full endpoint shape, plus final lint/test sweep.

- [X] T022 [P] Write API contract tests in `backend/tests/contract/test_player_stats_deep_dive_api.py`: test that response contains `avg_court_score_per_round` (not `avg_court_per_round`); `avg_court_score_overall` in [0, 10] when matches exist; `score_distribution` always has exactly 25 entries; `score_distribution_per_court` contains only courts with data; per-court entries ordered ascending; full empty-state shape when player has no matches
- [X] T023 Run `cd frontend && npm run lint` and fix any remaining TypeScript errors from the field renames across `PlayerStats.tsx` and `types.ts`
- [X] T024 Run full backend suite `cd backend && PYTHONPATH=. pytest` — fix any failures
- [X] T025 Run full frontend suite `cd frontend && npm test` — fix any failures
- [X] T026 Manual verification per `specs/046-court-score-distribution/quickstart.md` checklist (Y-axis 0–10, chart labels, distribution charts present, per-court charts, empty state, horizontal scroll)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (T001)**: No dependencies — verify baseline first
- **Phase 2 (T002, T003)**: Depends on T001 — **BLOCKS all user story phases**
- **Phase 3 (US1, T004–T012)**: Depends on T002 + T003
- **Phase 4 (US2, T013–T018)**: Depends on T002 + T003; T014 depends on T008 (US1 service changes must be in place)
- **Phase 5 (US3, T019–T021)**: Depends on T014 (distribution accumulation infrastructure); T021 depends on T015 (ScoreDistChart component)
- **Phase 6 (T022–T026)**: Depends on all previous phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Backend portion (T014) depends on T008 (US1 service refactor). Frontend portion (T015–T018) can start in parallel with US1 frontend tasks after T016 is done
- **US3 (P3)**: Backend (T020) depends on T014 (US2 distribution infrastructure). Frontend (T021) depends on T015 (ScoreDistChart component)

### Within Each User Story

- Unit tests (T004, T013, T019) should be written first and confirmed failing before implementation
- Backend service changes before schema validation
- Schema changes (Phase 2) before any frontend rendering
- `CourtLineChart` update (T010) can be done in parallel with service changes (T005–T009)

### Parallel Opportunities

- T002 and T003 are fully parallel (different stacks, different files)
- T004 (unit test skeleton) is parallel with T005–T009 (US1 service impl)
- T010, T011 (frontend chart update) are parallel with T005–T009 (backend service changes)
- T013 (US2 unit tests) and T015, T016 (US2 frontend) are parallel with T014 (US2 backend)
- T018 (chartData tests) is parallel with all US2 implementation tasks
- T022 (contract tests) is parallel with T023 (lint)

---

## Parallel Example: User Story 1

```bash
# Can launch simultaneously after Phase 2 completes:
Task A: T004 — write unit tests for _normalize_court_score (backend/tests/unit/)
Task B: T010 — update CourtLineChart in PlayerStats.tsx (frontend)

# Once Task A confirms tests fail:
Task C: T005 — implement _normalize_court_score (backend/app/services/)
```

## Parallel Example: User Story 2

```bash
# Can launch simultaneously:
Task A: T013 — write distribution unit tests (backend/tests/unit/)
Task B: T015 — build ScoreDistChart component (frontend/src/pages/PlayerStats.tsx)
Task C: T018 — add buildBarSegments tests (frontend/tests/)

# Once Task A confirms tests fail:
Task D: T014 — implement distribution accumulation (backend/app/services/)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001): Verify baseline
2. Complete Phase 2 (T002, T003): Schema + type rename — **CRITICAL**
3. Complete Phase 3 (T004–T012): Normalized court score end-to-end
4. **STOP and VALIDATE**: Check Y-axis is 0–10, overall avg is in range, all tests green
5. Ready to demo/merge US1 independently

### Incremental Delivery

1. Phase 1 + Phase 2 → Renamed schema in place
2. Phase 3 → Normalized court chart live (US1 MVP)
3. Phase 4 → All-courts distribution chart added (US2)
4. Phase 5 → Per-court breakdown charts added (US3)
5. Phase 6 → Contract tests + full regression sweep

### Single-Developer Sequence

```
T001 → T002+T003 → T004 → T005 → T006 → T007 → T008 → T009 →
T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 →
T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026
```

---

## Notes

- `[P]` tasks touch different files and have no shared in-progress dependencies
- Each user story phase is a shippable increment
- T002/T003 are a hard gate — TypeScript compile errors will cascade if skipped
- The `buildBarSegments` helper requires no changes; it already handles the 25-bar distribution pattern
- `score_distribution` and `score_distribution_per_court` stubs in Phase 3 (US1) prevent compile errors while US2/US3 fill in the real values
- Commit after each checkpoint to allow clean rollback if needed
