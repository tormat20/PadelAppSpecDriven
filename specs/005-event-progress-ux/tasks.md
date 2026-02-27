# Tasks: Event Progress UX Improvements

**Input**: Design documents from `/specs/001-event-progress-ux/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Include targeted tests because the specification defines independent validation criteria for setup listbox/date-time UX, run-event side-overlay modal behavior, and progress/final summary compatibility.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Story label used only in user-story phases (`[US1]`, `[US2]`, `[US3]`)
- Each task description includes a concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align docs/checklists/contracts scaffolding for clarified UX scope.

- [X] T001 Create/refresh feature QA checklist for clarified run-event modal scope in `specs/001-event-progress-ux/checklists/progress-ux-qa.md`
- [X] T002 [P] Add run-event result modal verification placeholders in `specs/001-event-progress-ux/contracts/run-event-result-modal-contract.md`
- [X] T003 [P] Update quickstart manual validation for side-relative modal + 24-option Mexicano flow in `specs/001-event-progress-ux/quickstart.md`
- [X] T004 Add planning trace notes for clarified acceptance flows in `specs/001-event-progress-ux/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared primitives for listbox/date-time validation, side-relative modal semantics, and summary mode typing.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T005 Add reusable listbox active-option helpers in `frontend/src/features/create-event/playerSearch.ts`
- [X] T006 [P] Add event schedule normalization/validation helpers in `frontend/src/features/create-event/validation.ts`
- [X] T007 [P] Add side-relative winner/result payload helpers in `frontend/src/features/run-event/resultEntry.ts`
- [X] T008 Add Mexicano 24-option generation helper (`X` and `24-X`) in `frontend/src/features/run-event/resultEntry.ts`
- [X] T009 [P] Extend summary mode and progress/final typings in `frontend/src/lib/types.ts`
- [X] T010 Extend summary API compatibility helper behavior for progress/final modes in `frontend/src/lib/api.ts`

**Checkpoint**: Shared utilities, typing, and payload rules are ready for story-level implementation.

---

## Phase 3: User Story 1 - Complete event setup with faster search and proper scheduling (Priority: P1) 🎯 MVP

**Goal**: Deliver first-character listbox narrowing and valid date + 24-hour time submission gating in create-event flow.

**Independent Test**: In Create Event, suggestions appear from first character and narrow with prefix input; date + time accepts valid values and blocks invalid values while existing creation constraints remain intact.

### Tests for User Story 1

- [X] T011 [P] [US1] Add prefix narrowing regression coverage in `frontend/tests/player-selector-search.test.tsx`
- [X] T012 [P] [US1] Add keyboard/mouse listbox interaction tests in `frontend/tests/player-selector-listbox-accessibility.test.tsx`
- [X] T013 [P] [US1] Add 24-hour schedule validation tests in `frontend/tests/create-event-datetime.test.tsx`
- [X] T014 [P] [US1] Update create-event submission constraint tests in `frontend/tests/create-event-page.test.tsx`

### Implementation for User Story 1

- [X] T015 [US1] Refactor player selector to inline combobox/listbox behavior in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T016 [US1] Add no-match and assigned-state suggestion UX handling in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T017 [US1] Add date + time controls to create-event form payload wiring in `frontend/src/pages/CreateEvent.tsx`
- [X] T018 [US1] Wire schedule validation into create-event disabled logic in `frontend/src/features/create-event/validation.ts`
- [X] T019 [US1] Add listbox/schedule layout styles in `frontend/src/styles/components.css`

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Run matches with clear court context and unambiguous winner choice (Priority: P2)

**Goal**: Render on-court side overlays with display names, side hover highlight, and side-relative mode-specific result modal (including 24 clickable Mexicano alternatives).

**Independent Test**: In Run Event, each match card uses `court-bg-removed.png`, overlays display names not IDs, side hover highlights correctly, side click opens modal with mode-specific options, and Mexicano sets selected side `X` and opposing side `24-X`.

### Tests for User Story 2

- [X] T020 [P] [US2] Add court overlay rendering tests for image path + display names in `frontend/tests/run-event-court-card.test.tsx`
- [X] T021 [P] [US2] Add team-side hover/select interaction tests in `frontend/tests/run-event-team-grouping.test.tsx`
- [X] T022 [P] [US2] Add side-relative winner state persistence tests in `frontend/tests/result-entry-selection-state.test.tsx`
- [X] T023 [P] [US2] Add result modal option matrix tests (Americano/BeatTheBox/Mexicano) in `frontend/tests/run-event-result-modal.test.tsx`
- [X] T024 [P] [US2] Add Mexicano complement score tests (`X` -> `24-X`) in `frontend/tests/run-event-mexicano-options.test.tsx`

### Implementation for User Story 2

- [X] T025 [US2] Update court grid to use `court-bg-removed.png` and side overlay zones in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T026 [US2] Map round player identifiers to display names before render in `frontend/src/pages/RunEvent.tsx`
- [X] T027 [US2] Add side-hover and selected-side state handling in `frontend/src/pages/RunEvent.tsx`
- [X] T028 [US2] Create side-relative result modal component for mode-specific options in `frontend/src/components/matches/ResultModal.tsx`
- [X] T029 [US2] Integrate modal launch/submission flow from court-side click in `frontend/src/pages/RunEvent.tsx`
- [X] T030 [US2] Implement mode-specific modal option content in `frontend/src/features/run-event/modeInputs.tsx`
- [X] T031 [US2] Apply persistent selected-state visuals in `frontend/src/components/matches/ResultEntry.tsx`
- [X] T032 [US2] Add court overlay, hover highlight, and modal styling in `frontend/src/styles/components.css`
- [X] T033 [US2] Apply Magic Bento-inspired hover/click effects to event-flow interactive cards/buttons in `frontend/src/styles/components.css`
- [X] T034 [US2] Document Magic Bento interaction guidance under manual additions in `AGENTS.md`

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - View progress summary before event completion (Priority: P3)

**Goal**: Preserve/extend in-progress summary matrix behavior with `-` placeholders and Back navigation while keeping completed summary compatibility.

**Independent Test**: Open summary for in-progress event and verify progress mode matrix + `-` cells + Back navigation; open summary for completed event and verify final summary behavior remains compatible.

### Tests for User Story 3

- [X] T035 [P] [US3] Add progress summary matrix rendering tests in `frontend/tests/progress-summary-matrix.test.tsx`
- [X] T036 [P] [US3] Add summary back-navigation tests in `frontend/tests/progress-summary-navigation.test.tsx`
- [X] T037 [P] [US3] Add backend in-progress summary contract test in `backend/tests/contract/test_progress_summary_api.py`
- [X] T038 [P] [US3] Add backend completed-summary compatibility test in `backend/tests/contract/test_completed_summary_compatibility.py`

### Implementation for User Story 3

- [X] T039 [US3] Ensure summary route/service returns progress vs final mode in `backend/app/api/routers/events.py`
- [X] T040 [US3] Maintain summary service compatibility behavior for in-progress and final events in `backend/app/services/summary_service.py`
- [X] T041 [US3] Implement progress vs final rendering branches in `frontend/src/pages/Summary.tsx`
- [X] T042 [US3] Implement progress matrix cell placeholder/back-path helpers in `frontend/src/pages/Summary.tsx`
- [X] T043 [US3] Keep summary API fallback compatibility behavior in `frontend/src/lib/api.ts`

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation alignment, and regression confidence across all stories.

- [X] T044 [P] Record frontend lint/test command evidence in `specs/001-event-progress-ux/checklists/progress-ux-qa.md`
- [X] T045 [P] Record backend contract/integration test evidence in `specs/001-event-progress-ux/checklists/progress-ux-qa.md`
- [ ] T046 Record manual quickstart validation outcomes for setup/run-event/summary in `specs/001-event-progress-ux/checklists/progress-ux-qa.md`
- [X] T047 Update verification evidence for run-event modal contract in `specs/001-event-progress-ux/contracts/run-event-result-modal-contract.md`
- [X] T048 Update verification evidence for progress/final summary contract in `specs/001-event-progress-ux/contracts/progress-summary-contract.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Setup; blocks all user stories.
- **Phase 3 (US1)**: Depends on Foundational; MVP path.
- **Phase 4 (US2)**: Depends on Foundational; can proceed in parallel with US1.
- **Phase 5 (US3)**: Depends on Foundational; can proceed in parallel with US2 if staffed.
- **Phase 6 (Polish)**: Depends on completion of selected story phases.

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational.
- **US2 (P2)**: Independent after Foundational; consumes shared run-event helpers.
- **US3 (P3)**: Independent after Foundational; must preserve completed-summary compatibility.

### Within Each User Story

- Tests should be authored before implementation changes.
- Tasks touching the same file must run sequentially.
- Story checkpoint must pass before declaring that story complete.

### Parallel Opportunities

- Setup: T002 and T003 can run in parallel.
- Foundational: T006, T007, and T009 can run in parallel.
- US1 tests: T011-T014 can run in parallel.
- US2 tests: T020-T024 can run in parallel.
- US3 tests: T035-T038 can run in parallel.
- Polish evidence tasks: T044 and T045 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring for setup UX
Task: "T011 [US1] Add prefix narrowing regression coverage in frontend/tests/player-selector-search.test.tsx"
Task: "T012 [US1] Add keyboard/mouse listbox interaction tests in frontend/tests/player-selector-listbox-accessibility.test.tsx"
Task: "T013 [US1] Add 24-hour schedule validation tests in frontend/tests/create-event-datetime.test.tsx"
Task: "T014 [US1] Update create-event submission constraint tests in frontend/tests/create-event-page.test.tsx"
```

## Parallel Example: User Story 2

```bash
# Parallel test authoring for court overlay + modal UX
Task: "T020 [US2] Add court overlay rendering tests in frontend/tests/run-event-court-card.test.tsx"
Task: "T021 [US2] Add team-side hover/select interaction tests in frontend/tests/run-event-team-grouping.test.tsx"
Task: "T023 [US2] Add result modal option matrix tests in frontend/tests/run-event-result-modal.test.tsx"
Task: "T024 [US2] Add Mexicano complement score tests in frontend/tests/run-event-mexicano-options.test.tsx"
```

## Parallel Example: User Story 3

```bash
# Parallel UI + backend contract checks for summary behavior
Task: "T035 [US3] Add progress summary matrix rendering tests in frontend/tests/progress-summary-matrix.test.tsx"
Task: "T036 [US3] Add summary back-navigation tests in frontend/tests/progress-summary-navigation.test.tsx"
Task: "T037 [US3] Add backend in-progress summary contract test in backend/tests/contract/test_progress_summary_api.py"
Task: "T038 [US3] Add backend completed-summary compatibility test in backend/tests/contract/test_completed_summary_compatibility.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Deliver US1 listbox + 24-hour scheduling behavior.
3. Validate US1 independently before moving to run-event/summary work.

### Incremental Delivery

1. Foundation ready (Phases 1-2).
2. Deliver US1 for setup UX reliability.
3. Deliver US2 for run-event clarity and modal scoring UX.
4. Deliver US3 for progress summary behavior and compatibility.
5. Complete cross-cutting validation and evidence capture.

### Parallel Team Strategy

1. Team aligns on Setup + Foundational changes.
2. Split by story once foundation is complete:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Merge, run shared regressions, and complete Polish tasks.

---

## Notes

- `[P]` markers indicate tasks that can be developed independently on separate files.
- Preserve event scoring/progression outcomes while improving UX.
- Treat completed-summary backward compatibility as a hard constraint.
