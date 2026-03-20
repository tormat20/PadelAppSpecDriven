# Tasks: Previous Round Correction Flow

**Input**: Design documents from `/specs/035-previous-round-correction/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No explicit TDD requirement in spec; include validation/regression execution in polish phase.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no blocking dependency)
- **[Story]**: User story mapping label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared type/API scaffolding and warning text constants used across stories.

- [X] T001 Add run-page warning copy constants for previous-round boundary in `frontend/src/lib/api.ts`
- [X] T002 Extend run-event frontend types for previous-round navigation and warning state in `frontend/src/lib/types.ts`
- [X] T003 Add frontend API client method for previous-round navigation action in `frontend/src/lib/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement backend primitives for rollback, downstream invalidation/regeneration, and conflict-safe correction integration.

**⚠️ CRITICAL**: No user story work begins until this phase completes.

- [X] T004 Add previous-round response schema and warning payload model in `backend/app/api/schemas/rounds.py`
- [X] T005 [P] Add repository method(s) to list/delete rounds and matches from a rebuild point in `backend/app/repositories/rounds_repo.py`
- [X] T006 [P] Add repository method(s) to purge/recreate event score projections after rollback in `backend/app/repositories/matches_repo.py`
- [X] T007 Add SQL for deleting downstream rounds/matches by event and round number in `backend/app/repositories/sql/rounds/delete_from_round_number.sql`
- [X] T008 Implement `go_previous_round` domain flow with round-1 boundary handling in `backend/app/services/round_service.py`
- [X] T009 Implement downstream invalidation/regeneration helper used after correction in `backend/app/services/round_service.py`
- [X] T010 Add API endpoint for previous-round action and warning response mapping in `backend/app/api/routers/rounds.py`

**Checkpoint**: Rollback and regeneration foundation ready for run-page integration.

---

## Phase 3: User Story 1 - Go Back and Correct Previous Round Before Reassignment (Priority: P1) 🎯 MVP

**Goal**: Host can go back round-by-round, correct prior-round scores, and re-advance with corrected assignments.

**Independent Test**: Advance from Round N to N+1, go back to N, correct a score, go next, and verify regenerated N+1 assignments differ according to corrected results.

### Implementation for User Story 1

- [ ] T011 [US1] Wire previous-round API route into services scope and run flow in `backend/app/api/deps.py`
- [X] T012 [US1] Ensure correction audit events are written during rollback-based edits in `backend/app/services/round_service.py`
- [X] T013 [US1] Add previous-round button handler and state transitions in `frontend/src/pages/RunEvent.tsx`
- [X] T014 [US1] Add round-1 blocked warning rendering using existing orange warning style in `frontend/src/pages/RunEvent.tsx`
- [X] T015 [US1] Update next-round handler to consume regenerated downstream state after correction in `frontend/src/pages/RunEvent.tsx`
- [X] T016 [US1] Ensure previous-round navigation can be repeated until Round 1 boundary in `frontend/src/pages/RunEvent.tsx`
- [ ] T017 [US1] Update run-page helper tests for previous-round boundary and rollback behavior in `frontend/tests/run-event-page.test.tsx`

**Checkpoint**: US1 is independently operational and testable.

---

## Phase 4: User Story 2 - Keep Summary View Clean and Table-Centric (Priority: P2)

**Goal**: Inline summary keeps table visibility while removing separate recorded-scores edit block.

**Independent Test**: Open View Summary during ongoing event and verify no separate recorded-scores section appears below the table.

### Implementation for User Story 2

- [X] T018 [US2] Remove recorded-scores list rendering and related edit controls from inline summary panel in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T019 [US2] Remove unused score-list edit state and handlers in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T020 [US2] Remove obsolete recorded-score styles from inline summary section in `frontend/src/styles/components.css`
- [X] T021 [US2] Update inline-summary component tests to assert table-only summary rendering in `frontend/tests/run-event-court-card.test.tsx`

**Checkpoint**: US2 delivers uncluttered summary behavior with no duplicate score-edit area.

---

## Phase 5: User Story 3 - Reorder Ongoing Event Action Buttons for Clear Back/Forward Flow (Priority: P3)

**Goal**: Run action panel presents back/forward on top row, summary/finish on second row.

**Independent Test**: On run page, verify top row = Previous Round (left), Next Match (right); second row in same panel = View Summary and Finish Event.

### Implementation for User Story 3

- [X] T022 [US3] Reorder run action panel top-row controls to Previous Round left and Next Match right in `frontend/src/pages/RunEvent.tsx`
- [X] T023 [US3] Move View Summary and Finish Event into second row within same action panel in `frontend/src/pages/RunEvent.tsx`
- [X] T024 [US3] Update action-panel layout styles for two-row control grouping in `frontend/src/styles/components.css`
- [X] T025 [US3] Keep finish enablement logic unchanged while moving control placement in `frontend/src/pages/RunEvent.tsx`
- [X] T026 [US3] Update run-event action-label tests for new layout semantics in `frontend/tests/run-event-page.test.tsx`

**Checkpoint**: US3 action layout is complete and independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full regression coverage, quickstart verification, and final consistency checks.

- [X] T027 Run frontend typecheck and full test suite using `frontend/package.json`
- [X] T028 Run backend full test suite focusing on round rollback/regeneration integrity in `backend/tests/`
- [X] T029 Execute and record quickstart validation outcomes in `specs/035-previous-round-correction/quickstart.md`
- [X] T030 Verify warning-style consistency and messaging copy for round-1 boundary in `frontend/src/styles/components.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP delivery.
- **Phase 4 (US2)**: Depends on Phase 2; can be delivered after US1 or in parallel once foundational work is complete.
- **Phase 5 (US3)**: Depends on Phase 2; can run parallel to US2 if file conflicts are managed.
- **Phase 6 (Polish)**: Depends on all selected story phases.

### User Story Dependencies

- **US1 (P1)**: Requires foundational rollback/rebuild backend support.
- **US2 (P2)**: Requires existing inline summary component baseline; independent of rollback algorithm details.
- **US3 (P3)**: UI layout change; independent of rollback internals, but same `RunEvent.tsx` file requires sequencing with US1 tasks.

### Within Each User Story

- Backend route/service dependencies before frontend integration where applicable.
- Core behavior before tests/validation updates.
- Story checkpoint must pass before final polish.

---

## Parallel Opportunities

- **Foundational**: T005 and T006 can run in parallel.
- **US2**: T018 and T020 can run in parallel after component baseline is clear.
- **US3**: T024 can run in parallel with T025 once control placement structure is defined.

## Parallel Example: User Story 2

```bash
# Parallel cleanup for summary-only table flow
Task: "T018 [US2] Remove recorded-scores list rendering in frontend/src/components/run-event/InlineSummaryPanel.tsx"
Task: "T020 [US2] Remove obsolete styles in frontend/src/styles/components.css"
```

## Parallel Example: Foundational

```bash
# Parallel repository groundwork
Task: "T005 Add downstream round delete/list methods in backend/app/repositories/rounds_repo.py"
Task: "T006 Add projection purge/regenerate helpers in backend/app/repositories/matches_repo.py"
```

## Parallel Example: User Story 3

```bash
# Parallel layout + finish-state consistency updates
Task: "T024 [US3] Update action panel two-row styles in frontend/src/styles/components.css"
Task: "T025 [US3] Preserve finish enablement logic in frontend/src/pages/RunEvent.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Implement Phase 3 (US1) and validate rollback/correction/regeneration loop.
3. Demo MVP behavior before US2/US3 refinements.

### Incremental Delivery

1. Foundation -> US1 rollback correction loop.
2. US2 summary simplification.
3. US3 action layout reorder.
4. Full polish and regression.

### Team Parallelization Strategy

1. One developer handles backend rollback foundation (Phase 2).
2. One developer prepares summary cleanup (US2) once frontend baseline is stable.
3. One developer handles action layout polish (US3) after `RunEvent.tsx` merge points are coordinated.

---

## Format Validation

All tasks follow strict checklist format:
- Start with `- [ ]`
- Sequential IDs `T001` to `T030`
- `[P]` only where parallelizable
- `[US#]` labels only on user story phase tasks
- Every task includes a concrete file path
