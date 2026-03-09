# Tasks: Summary Screen & OCR Panel Fixes (029)

**Input**: Design documents from `/specs/029-summary-screen-bugs/`
**Branch**: `029-summary-screen-bugs`
**Prerequisites**: plan.md ✅ spec.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.
**Tests**: Included per SC-006, SC-007, SC-008 (spec requirements).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Create the feature branch and verify the starting baseline.

- [ ] T001 Create git branch `029-summary-screen-bugs` from current HEAD: `git checkout -b 029-summary-screen-bugs`
- [ ] T002 [P] Run `PYTHONPATH=. uv run python -m pytest tests/ -v` and confirm all backend tests currently pass (establish baseline)
- [ ] T003 [P] Run `npm test && npm run lint` in the `frontend/` directory and confirm all frontend tests currently pass (establish baseline)

**Checkpoint**: Branch created. Baseline tests green.

---

## Phase 2: User Story 1 — Americano Final Summary Ordering (Priority: P1)

**Goal**: Verify (and confirm) Americano final ordering is correct. The `summary_ordering.py` already has an Americano branch (lines 104–114). This phase confirms the existing implementation is complete and covered by tests.

**Independent Test**: Run the existing `backend/tests/unit/test_americano_summary_ordering.py` — it must pass.

- [ ] T004 [US1] Read `backend/tests/unit/test_americano_summary_ordering.py` — verify it covers: (a) rows sorted highest-score-first, (b) tied scores produce same rank, (c) the player with the highest score gets rank 1. If any of these cases are missing, add them to the test file.
- [ ] T005 [US1] Run `PYTHONPATH=. uv run python -m pytest tests/unit/test_americano_summary_ordering.py -v` — assert all tests pass.

**Checkpoint**: Americano ordering is verified correct with tests. ✅

---

## Phase 3: User Stories 2+3 — Mexicano/Americano Final Summary (Priority: P1) 🎯 MVP

**Goal**: Finished Mexicano and Americano events (including early-finished ones) correctly serve `mode="final"` from the summary API, delivering the correct page title, podium, crowns, and confetti.

**Root cause**: `is_final_summary_available()` in `summary_service.py` checks `current_round_number >= round_count`. For early-finished events (`status=FINISHED` but `current_round_number < round_count`), this returns `False` and the API serves a `ProgressSummaryResponse` instead of `FinalSummaryResponse`.

**Independent Test**: Create a Mexicano event, run 2 of 6 rounds, call `POST /finish`, call `GET /summary` — expect `mode="final"` with `crownedPlayerIds` and `playerRows`.

### Tests for US2+US3 ⚠️ Write these FIRST — verify they FAIL before implementing

- [ ] T006 [US2+US3] Write `backend/tests/integration/test_summary_early_finish.py`:
  - Test 1: Create a Mexicano event, start it, complete round 1, call `finish_event()`, call `GET /events/{id}/summary` → assert response contains `mode="final"` (or the equivalent field from `FinalSummaryResponse`), `crownedPlayerIds` is a non-empty list, and `playerRows` is ordered.
  - Test 2: Create an Americano event, start it, complete round 1, call `finish_event()`, call `GET /events/{id}/summary` → same assertions.
  - Test 3: Create a Mexicano event, start it (do NOT finish), call `GET /events/{id}/summary` → assert response contains `mode="progress"` (i.e. no regression to progress view when event is ongoing).
  - Follow existing test patterns from `backend/tests/integration/test_us3_modes_and_summary.py`.
  - Use sync `def test_*` with FastAPI `TestClient`. No asyncio.

- [ ] T007 [US2+US3] Run `PYTHONPATH=. uv run python -m pytest tests/integration/test_summary_early_finish.py -v` → **assert tests FAIL** (expected before implementation).

### Implementation for US2+US3

- [ ] T008 [US2+US3] In `backend/app/services/summary_service.py`, modify `is_final_summary_available()`:

  **Current** (lines 38–45):
  ```python
  def is_final_summary_available(self, event_id: str) -> bool:
      event = self.events_repo.get(event_id)
      if not event:
          raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
      return (
          event.current_round_number is not None
          and event.current_round_number >= event.round_count
      )
  ```

  **After** — add `event.status == EventStatus.FINISHED` as a short-circuit:
  ```python
  def is_final_summary_available(self, event_id: str) -> bool:
      event = self.events_repo.get(event_id)
      if not event:
          raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
      if event.status == EventStatus.FINISHED:
          return True
      return (
          event.current_round_number is not None
          and event.current_round_number >= event.round_count
      )
  ```

  Note: `EventStatus` is already imported at line 6 of `summary_service.py`.

- [ ] T009 [US2+US3] Run `PYTHONPATH=. uv run python -m pytest tests/integration/test_summary_early_finish.py -v` → assert all 3 new tests now PASS.
- [ ] T010 [US2+US3] Run full backend test suite: `PYTHONPATH=. uv run python -m pytest tests/ -v` → assert no regressions.

**Checkpoint**: Mexicano and Americano early-finish events serve `mode="final"` with crowns, podium, and confetti. All backend tests green. ✅

---

## Phase 4: User Stories 4+5 — OCR Panel and Event Filter (Priority: P2/P3)

**Goal**: Verify (and confirm) that the OCR panel remove buttons and the event filter checkboxes are already correctly implemented per the spec. These were identified in `plan.md` as already fixed.

**Independent Test**: Read the relevant code; if correct, document that no change is needed. If a gap is found, fix it.

- [ ] T011 [P] [US4] Re-read `frontend/src/components/ocr/OcrImportPanel.tsx` lines 290–400. Confirm:
  - Left column: remove button present at lines 320–329, shown when `!isAlreadyRegistered && isChecked`.
  - Right column: remove button present at lines 353–361, shown when `isChecked`.
  - Clicking remove button calls `toggleChecked(rawName)` which deselects without removing from list.
  - If any of these are absent or broken, implement the fix.

- [ ] T012 [P] [US5] Re-read `frontend/src/pages/EventSlots.tsx` lines 103–136. Confirm:
  - `showTeamMexicano` is initialised from localStorage (lines 107–112) ✅
  - `showTeamMexicano` is persisted to localStorage (lines 133–136) ✅
  - `modeFilters` defaults to `[...MODE_ORDER]` (all types) when no stored state ✅
  - Checkboxes render `checked={modeFilters.includes(mode)}` — all checked by default ✅
  - If any of these are absent or broken, implement the fix.

**Checkpoint**: OCR panel and event filter confirmed correct (or fixed if gap found). ✅

---

## Phase 5: New Frontend Tests (Priority: SC-008)

**Goal**: Add Vitest unit tests for the frontend summary helpers to satisfy SC-008.

- [ ] T013 [P] [US2+US3] Write/update `frontend/src/features/summary/__tests__/crownWinners.test.ts` (or the relevant test file):
  - Test: `showCrownForSummaryMode("final")` returns `true`.
  - Test: `showCrownForSummaryMode("progress")` returns `false`.
  - Test: `getPodiumSlots("Mexicano", rows)` — given rows with ranks 1, 2, 3, returns 3 slots in visual order (2nd, 1st, 3rd).
  - Test: `getPodiumSlots("Americano", rows)` — same as Mexicano slots spec.
  - Test: `getPodiumSlots("RankedBox", rows)` — returns empty array.
  - These tests already exist if the summary test files are present; add only what is missing.

- [ ] T014 [P] [US4] Confirm or write a test that: after toggling a name in the OCR panel, `checkedCount` excludes the deselected name. This is a unit test for the state logic in `OcrImportPanel.tsx` (if a test harness exists for it).

- [ ] T015 Run `npm test` from the `frontend/` directory → assert all new and existing tests pass.

---

## Phase 6: Polish & Final Validation

**Purpose**: Full regression check across both stacks.

- [ ] T016 Run `PYTHONPATH=. uv run python -m pytest tests/ -v` → all backend tests pass, including new `test_summary_early_finish.py`
- [ ] T017 [P] Run `npm test && npm run lint` in `frontend/` → all tests pass, no lint errors
- [ ] T018 [P] Smoke-test manually (if Docker env available):
  - Create and finish a Mexicano event early (round 1 of 6) → navigate to summary → confirm page title is "Summary", podium is shown, crown is on top player, confetti fires.
  - Create and finish an Americano event → navigate to summary → confirm page title "Summary", player with most pts in rank 1 with crown.
  - Navigate to summary of an in-progress Mexicano event → confirm page title is "Progress Summary", no podium.

- [ ] T019 Commit: `git add -A && git commit -m "fix(summary): serve final summary for early-finished Mexicano/Americano events"`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 Americano verify)**: No implementation; just test verification — start after Phase 1
- **Phase 3 (US2+US3 core fix)**: T006 (write test) must precede T008 (implement fix); T009 verifies fix passes
- **Phase 4 (US4+US5 verify)**: Parallel with Phase 3 (different files)
- **Phase 5 (Frontend tests)**: Parallel with Phase 3 (different files, TypeScript only)
- **Phase 6 (Polish)**: Depends on all preceding phases

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (Americano sort) | None | Already implemented; verify only |
| US2+US3 (Mexicano final) | T006 (test written) → T008 (fix) | Write test first; verify it fails; fix; verify it passes |
| US4 (OCR remove) | None | Already implemented; verify only |
| US5 (Filter checkboxes) | None | Already implemented; verify only |

### Parallel Opportunities

- T002 (backend baseline) and T003 (frontend baseline) — parallel in Phase 1
- T004 (Americano test review) — parallel with T006 (Mexicano test writing)
- T011 (OCR verify) and T012 (EventSlots verify) — parallel in Phase 4
- T013 (crown tests) and T014 (OCR tests) — parallel in Phase 5
- T016 (backend tests) and T017 (frontend tests) — parallel in Phase 6

---

## Implementation Strategy

### MVP First (P1 Only — US1 + US2+US3)

1. Phase 1: Create branch, establish baseline
2. Phase 2: Verify Americano ordering (no code change expected)
3. Phase 3: Write failing test → implement `is_final_summary_available` fix → verify tests pass
4. **STOP and VALIDATE**: Run full backend suite; confirm no regressions
5. This single backend fix closes US1 (verification), US2 (Mexicano final), US3 (correct title) simultaneously

### Incremental Delivery

1. P1 backend fix (T008) → closes US1 verification + US2 + US3
2. P2/P3 code verification (T011, T012) → confirms US4 and US5 already working
3. Frontend tests (T013, T014) → satisfies SC-008
4. Final validation (T016–T018) → full regression pass

### Risk Assessment

| Task | Risk | Notes |
|------|------|-------|
| T008 `is_final_summary_available` | Low | Adding one `if` guard; `EventStatus` already imported |
| T004 Americano test | Very Low | Read-only verification |
| T011 OCR verify | Very Low | Read-only verification |
| T012 EventSlots verify | Very Low | Read-only verification |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- `EventStatus` is already imported in `summary_service.py` (line 6) — no new imports needed for T008
- Pre-existing LSP errors in `users_repo.py`, `round_service.py`, `players_repo.py`, `event_service.py` — do NOT fix (pre-existing, out of scope)
- The `FINISHED` status guard is safe because `finish_event()` is the only code path that sets `status=FINISHED`, and it already validates the event is in a valid finish state before doing so
