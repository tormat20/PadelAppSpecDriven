# Tasks: Tournament Engine and Round Summary Overhaul

**Input**: Design documents from `/specs/001-tournament-engine-summary/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include backend and frontend tests because spec success criteria require deterministic scheduling and round-matrix output validation.

**Organization**: Tasks are grouped by user story to keep each story independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable task (different files, no dependency on incomplete tasks)
- **[Story]**: Story phase label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align contracts/docs and establish scheduling helper scaffolding for implementation.

- [X] T001 Create feature task checklist baseline in `specs/001-tournament-engine-summary/tasks.md`
- [X] T002 [P] Add verification placeholders for next-round assignment contract in `specs/001-tournament-engine-summary/contracts/next-round-assignment-contract.md`
- [X] T003 [P] Add verification placeholders for summary round-matrix contract in `specs/001-tournament-engine-summary/contracts/summary-round-matrix-contract.md`
- [X] T004 Add validation notes for new mode behaviors in `specs/001-tournament-engine-summary/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared deterministic scheduling primitives and summary aggregation helpers used by all stories.

**⚠️ CRITICAL**: Complete this phase before user story work.

- [X] T005 Add court-ladder ordering and boundary helper functions in `backend/app/domain/scheduling.py`
- [X] T006 Add deterministic seeded spill helper for Americano overflow in `backend/app/domain/scheduling.py`
- [X] T007 Add previous-partner extraction helper for prior round matches in `backend/app/services/round_service.py`
- [X] T008 [P] Add per-round aggregation helper for final summary matrix in `backend/app/services/summary_service.py`
- [X] T009 [P] Add summary round-cell typing updates in `frontend/src/lib/types.ts`

**Checkpoint**: Shared deterministic scheduling and summary primitives are available.

---

## Phase 3: User Story 1 - Correct Court Movement by Mode (Priority: P1) 🎯 MVP

**Goal**: Generate next rounds according to Americano/Mexicano/BeatTheBox rules using selected-court ladder semantics.

**Independent Test**: Create one event per mode, complete a round, advance to next round, and confirm assignment behavior matches contract rules including top/bottom bounds and deterministic outputs.

### Tests for User Story 1

- [X] T010 [P] [US1] Add unit tests for Americano movement boundaries and seeded overflow handling in `backend/tests/unit/test_scheduling.py`
- [X] T011 [P] [US1] Add unit tests for Mexicano ranking and tie-break ordering in `backend/tests/unit/test_scheduling.py`
- [X] T012 [P] [US1] Add unit tests for BeatTheBox fixed 3-step quartet cycle in `backend/tests/unit/test_scheduling.py`
- [X] T013 [P] [US1] Add contract tests for next-round assignment by mode in `backend/tests/contract/test_round_progression_api.py`
- [X] T014 [P] [US1] Add Americano draw-rejection coverage in `backend/tests/contract/test_results_validation_api.py`

### Implementation for User Story 1

- [X] T015 [US1] Implement mode-specific next-round generation paths in `backend/app/domain/scheduling.py`
- [X] T016 [US1] Wire mode-specific ordered player inputs and partner-history context in `backend/app/services/round_service.py`
- [X] T017 [US1] Enforce Americano winner-required behavior during result recording in `backend/app/services/round_service.py`
- [X] T018 [US1] Preserve existing mode service entry points while delegating to new scheduling behavior in `backend/app/services/americano_service.py`
- [X] T019 [US1] Preserve existing mode service entry points while delegating to new scheduling behavior in `backend/app/services/mexicano_service.py`
- [X] T020 [US1] Preserve existing mode service entry points while delegating to new scheduling behavior in `backend/app/services/beat_the_box_service.py`

**Checkpoint**: Next-round generation is mode-correct and deterministic for identical inputs.

---

## Phase 4: User Story 2 - Partner Rotation Integrity (Priority: P2)

**Goal**: Ensure partner anti-repeat rules are enforced for Mexicano and fixed-cycle partner rotation is stable for BeatTheBox.

**Independent Test**: Run at least two consecutive rounds in Mexicano and BeatTheBox and verify partner assignments follow anti-repeat/cycle constraints with no cross-court migration in BeatTheBox.

### Tests for User Story 2

- [X] T021 [P] [US2] Add Mexicano immediate-partner-repeat regression tests in `backend/tests/integration/test_us2_round_flow.py`
- [X] T022 [P] [US2] Add BeatTheBox fixed cycle partner assertions in `backend/tests/integration/test_us3_modes_and_summary.py`
- [X] T023 [P] [US2] Add deterministic rerun assertions for same-state assignment outputs in `backend/tests/contract/test_round_progression_api.py`

### Implementation for User Story 2

- [X] T024 [US2] Implement Mexicano quartet pairing with previous-partner exclusion in `backend/app/domain/scheduling.py`
- [X] T025 [US2] Implement BeatTheBox cycle index progression per quartet in `backend/app/domain/scheduling.py`
- [X] T026 [US2] Store and pass required prior-round context for pairing decisions in `backend/app/services/round_service.py`
- [X] T027 [US2] Add fallback path when strict anti-repeat constraints are unsatisfiable in `backend/app/domain/scheduling.py`

**Checkpoint**: Partner logic is predictable, valid, and independently testable.

---

## Phase 5: User Story 3 - Round-Based Final Summary (Priority: P3)

**Goal**: Replace finished summary match-index matrix with round-index matrix (`R1..RN + Total`) using numeric cells for all modes.

**Independent Test**: Finish events and verify summary payload/UI expose round columns only, numeric values per round, and totals equal sum of round cells.

### Tests for User Story 3

- [X] T028 [P] [US3] Add contract coverage for final round-based columns and numeric cells in `backend/tests/contract/test_completed_summary_compatibility.py`
- [X] T029 [P] [US3] Add progress/final summary regression for round matrix shape in `backend/tests/contract/test_progress_summary_api.py`
- [X] T030 [P] [US3] Add frontend assertions for `R1..RN` headers and numeric cells in `frontend/tests/progress-summary-matrix.test.tsx`
- [X] T031 [P] [US3] Add frontend navigation/regression assertions for finished summary rendering in `frontend/tests/progress-summary-navigation.test.tsx`

### Implementation for User Story 3

- [X] T032 [US3] Replace final summary matrix builder from match-index to round-index aggregation in `backend/app/services/summary_service.py`
- [X] T033 [US3] Keep finish/progress summary compatibility behavior while returning round-based matrix in `backend/app/api/routers/events.py`
- [X] T034 [US3] Update summary response type shapes for round-based matrix compatibility in `frontend/src/lib/types.ts`
- [X] T035 [US3] Update final summary table rendering to rely on round columns in `frontend/src/pages/Summary.tsx`

**Checkpoint**: Final summary is round-based, numeric, and contract-compatible.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete contract evidence capture and full regression validation.

- [ ] T036 [P] Record next-round contract verification evidence in `specs/001-tournament-engine-summary/contracts/next-round-assignment-contract.md`
- [ ] T037 [P] Record summary matrix contract verification evidence in `specs/001-tournament-engine-summary/contracts/summary-round-matrix-contract.md`
- [ ] T038 Run backend validation command set and capture outcomes in `specs/001-tournament-engine-summary/quickstart.md`
- [ ] T039 Run frontend validation command set and capture outcomes in `specs/001-tournament-engine-summary/quickstart.md`
- [ ] T040 Update AGENTS context references if planning assumptions changed in `AGENTS.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Setup and blocks all user stories.
- **Phase 3 (US1)**: depends on Foundational; delivers MVP.
- **Phase 4 (US2)**: depends on Foundational and can run after or parallel to US1 once shared scheduling paths exist.
- **Phase 5 (US3)**: depends on Foundational and can proceed after core scheduling stability from US1.
- **Phase 6 (Polish)**: depends on completion of targeted stories.

### User Story Dependencies

- **US1 (P1)**: independent after Foundational; no dependency on other stories.
- **US2 (P2)**: depends on US1 scheduling base implementation but is independently testable by partner-rotation scenarios.
- **US3 (P3)**: independent from partner-rotation logic, but depends on stable round progression outputs.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Implement deterministic/domain logic before service wiring.
- Verify independent test criteria before moving to next priority.

### Parallel Opportunities

- Setup documentation placeholders (T002, T003) can run in parallel.
- Foundational helpers in separate files (T008, T009) can run in parallel.
- US1 test tasks T010-T014 can run in parallel.
- US2 test tasks T021-T023 can run in parallel.
- US3 test tasks T028-T031 can run in parallel.
- Polish evidence tasks T036-T037 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] Add Americano boundary/overflow tests in backend/tests/unit/test_scheduling.py"
Task: "T011 [US1] Add Mexicano ranking/tie-break tests in backend/tests/unit/test_scheduling.py"
Task: "T012 [US1] Add BeatTheBox cycle tests in backend/tests/unit/test_scheduling.py"
Task: "T013 [US1] Add next-round contract tests in backend/tests/contract/test_round_progression_api.py"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] Add Mexicano anti-repeat integration tests in backend/tests/integration/test_us2_round_flow.py"
Task: "T022 [US2] Add BeatTheBox cycle integration tests in backend/tests/integration/test_us3_modes_and_summary.py"
Task: "T023 [US2] Add deterministic rerun contract assertions in backend/tests/contract/test_round_progression_api.py"
```

## Parallel Example: User Story 3

```bash
Task: "T028 [US3] Add final summary contract tests in backend/tests/contract/test_completed_summary_compatibility.py"
Task: "T030 [US3] Add summary matrix UI tests in frontend/tests/progress-summary-matrix.test.tsx"
Task: "T031 [US3] Add summary navigation regressions in frontend/tests/progress-summary-navigation.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Deliver US1 mode-specific next-round correctness.
3. Validate next-round contract behavior before expanding scope.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Deliver US1 (core scheduling correctness).
3. Deliver US2 (partner-rotation integrity).
4. Deliver US3 (final summary transformation).
5. Finish with cross-cutting validations and contract evidence.

### Parallel Team Strategy

1. Complete shared setup/foundation together.
2. Split implementation:
   - Developer A: US1 scheduling core
   - Developer B: US2 partner constraints
   - Developer C: US3 summary matrix + frontend updates
3. Merge and run Phase 6 validations.

---

## Notes

- All tasks use required checklist format with IDs, labels, and file paths.
- Story phases are independently testable to support incremental delivery.
- Determinism and compatibility contracts are validated explicitly before completion.
