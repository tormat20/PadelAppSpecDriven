# Tasks: Event Setup Label + Run Card Transparency + Inline Team Result Badges

**Input**: Design documents from `/specs/002-run-result-badges/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Include targeted frontend tests because independent story verification is explicitly defined in the specification and quickstart.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable task (different files, no dependency on incomplete tasks)
- **[Story]**: User story phase label (`[US1]`, `[US2]`, `[US3]`)
- Each task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align docs/contracts/checklists for this UX-polish feature scope.

- [X] T001 Create feature QA checklist for this scope in `specs/002-run-result-badges/checklists/ux-polish-qa.md`
- [X] T002 [P] Add verification placeholders for inline mirrored badge behavior in `specs/002-run-result-badges/contracts/inline-team-result-badges-contract.md`
- [X] T003 [P] Add manual validation notes for mirrored badge and transparency checks in `specs/002-run-result-badges/quickstart.md`
- [X] T004 Add planning trace notes for story-level acceptance checks in `specs/002-run-result-badges/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide shared helpers/state shape for mirrored team outcomes and inline badge rendering.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T005 Add mirrored outcome mapping helpers (Americano/BeatTheBox) in `frontend/src/features/run-event/resultEntry.ts`
- [X] T006 Add Mexicano complement display helper (`X` and `24 - X`) in `frontend/src/features/run-event/resultEntry.ts`
- [X] T007 [P] Add inline team badge state helpers for selected/opposing side in `frontend/src/features/run-event/resultEntry.ts`
- [X] T008 [P] Add lightweight run-event badge view typing in `frontend/src/lib/types.ts`
- [X] T009 Add reusable court-card visual class tokens for overlay/readability in `frontend/src/styles/components.css`

**Checkpoint**: Mirrored display primitives and style tokens are ready for story implementation.

---

## Phase 3: User Story 1 - Show mirrored results directly on team buttons (Priority: P1) 🎯 MVP

**Goal**: Render right-aligned inline result badges on team buttons with mirrored semantics per mode and remove redundant below-card helper text.

**Independent Test**: In run-event, select outcomes for Americano/BeatTheBox/Mexicano and verify both team buttons immediately show mirrored right-side values (`X` and `24 - X` for Mexicano) with no muted helper line below cards.

### Tests for User Story 1

- [X] T010 [P] [US1] Add mirrored outcome helper tests for Americano/BeatTheBox in `frontend/tests/result-entry-selection-state.test.tsx`
- [X] T011 [P] [US1] Add Mexicano complement badge tests in `frontend/tests/run-event-mexicano-options.test.tsx`
- [X] T012 [P] [US1] Add inline badge rendering expectations on run-event cards in `frontend/tests/run-event-team-grouping.test.tsx`
- [X] T013 [P] [US1] Add no-helper-text regression test for run-event card footer in `frontend/tests/run-event-court-card.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Add optional right-side badge slot in team button rendering in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T015 [US1] Remove below-card muted selection helper text in `frontend/src/pages/RunEvent.tsx`
- [X] T016 [US1] Wire selected + opposing inline badge values into court grid props in `frontend/src/pages/RunEvent.tsx`
- [X] T017 [US1] Update modal submission flow to refresh inline mirrored badge state after each selection in `frontend/src/pages/RunEvent.tsx`
- [X] T018 [US1] Ensure mode input payload mapping remains mirrored and side-relative in `frontend/src/features/run-event/modeInputs.tsx`
- [X] T019 [US1] Add inline badge visual styling (right alignment, contrast, spacing) in `frontend/src/styles/components.css`

**Checkpoint**: US1 is independently functional and demo-ready.

---

## Phase 4: User Story 2 - Improve event setup player section clarity (Priority: P2)

**Goal**: Replace ambiguous heading with `Players` and allow assigned-player list to expand downward naturally.

**Independent Test**: In create-event, heading above add/search controls reads `Players`; assigned list grows downward with all entries visible during normal setup.

### Tests for User Story 2

- [X] T020 [P] [US2] Add heading label expectation for player section in `frontend/tests/player-selector-search.test.tsx`
- [X] T021 [P] [US2] Add assigned-list expansion/no clipping regression in `frontend/tests/player-selector-add.test.tsx`

### Implementation for User Story 2

- [X] T022 [US2] Replace player section heading text to `Players` in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T023 [US2] Remove fixed-height cap from assigned-player list in `frontend/src/styles/components.css`
- [X] T024 [US2] Keep create-event layout readable as list expands in `frontend/src/pages/CreateEvent.tsx`

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Increase court image visibility without losing readability (Priority: P3)

**Goal**: Reduce grey overlay intensity to show court image more clearly while preserving tinted team-button readability.

**Independent Test**: In started event view, court image appears clearer than prior state, team buttons stay readable/tinted, and interaction clarity remains intact.

### Tests for User Story 3

- [X] T025 [P] [US3] Add overlay-intensity regression assertions in `frontend/tests/run-event-court-card.test.tsx`
- [X] T026 [P] [US3] Add team-button readability/tint regression checks in `frontend/tests/court-grid.test.tsx`

### Implementation for User Story 3

- [X] T027 [US3] Reduce court-card overlay opacity while retaining image visibility in `frontend/src/styles/components.css`
- [X] T028 [US3] Preserve team button tint/contrast values after overlay adjustment in `frontend/src/styles/components.css`
- [X] T029 [US3] Ensure court-card class composition still supports hover/selected states in `frontend/src/components/courts/CourtGrid.tsx`

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, evidence capture, and regression confidence across all stories.

- [X] T030 [P] Record frontend lint/test evidence in `specs/002-run-result-badges/checklists/ux-polish-qa.md`
- [ ] T031 [P] Record manual quickstart outcomes for all stories in `specs/002-run-result-badges/checklists/ux-polish-qa.md`
- [X] T032 Update contract verification evidence for mirrored badge behavior in `specs/002-run-result-badges/contracts/inline-team-result-badges-contract.md`
- [X] T033 Run frontend validation commands and capture notes in `specs/002-run-result-badges/checklists/ux-polish-qa.md`
- [X] T034 Run backend regression contract command and capture notes in `specs/002-run-result-badges/checklists/ux-polish-qa.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: depends on Phase 2; MVP path.
- **Phase 4 (US2)**: depends on Phase 2; can proceed in parallel with US1.
- **Phase 5 (US3)**: depends on Phase 2; can proceed in parallel with US1/US2.
- **Phase 6 (Polish)**: depends on completed story phases.

### User Story Dependencies

- **US1 (P1)**: independent after foundational tasks.
- **US2 (P2)**: independent after foundational tasks.
- **US3 (P3)**: independent after foundational tasks.

### Within Each User Story

- Write tests before implementation changes.
- Tasks touching the same file must execute sequentially.
- Validate checkpoint before moving to next story priority.

### Parallel Opportunities

- Setup: T002 and T003 can run in parallel.
- Foundational: T007 and T008 can run in parallel.
- US1 tests: T010-T013 can run in parallel.
- US2 tests: T020 and T021 can run in parallel.
- US3 tests: T025 and T026 can run in parallel.
- Polish evidence tasks: T030 and T031 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] Add mirrored outcome helper tests in frontend/tests/result-entry-selection-state.test.tsx"
Task: "T011 [US1] Add Mexicano complement badge tests in frontend/tests/run-event-mexicano-options.test.tsx"
Task: "T012 [US1] Add inline badge rendering expectations in frontend/tests/run-event-team-grouping.test.tsx"
Task: "T013 [US1] Add no-helper-text regression in frontend/tests/run-event-court-card.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T020 [US2] Add heading label expectation in frontend/tests/player-selector-search.test.tsx"
Task: "T021 [US2] Add assigned-list expansion regression in frontend/tests/player-selector-add.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T025 [US3] Add overlay-intensity regression assertions in frontend/tests/run-event-court-card.test.tsx"
Task: "T026 [US3] Add team-button tint readability checks in frontend/tests/court-grid.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) inline mirrored badges and helper-text removal.
3. Validate US1 independently before expanding scope.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Deliver US1 (core live scoring feedback improvement).
3. Deliver US2 (setup clarity and list growth).
4. Deliver US3 (court transparency readability polish).
5. Run Phase 6 cross-cutting validation and evidence capture.

### Parallel Team Strategy

1. Team aligns and completes Setup + Foundational phases.
2. Split by story after foundation:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Merge and execute polish/regression tasks.

---

## Notes

- All tasks use required checklist format with IDs, labels, and concrete file paths.
- Preserve scoring/progression semantics while changing UX presentation only.
- Keep backend changes minimal; prioritize regression confidence.
