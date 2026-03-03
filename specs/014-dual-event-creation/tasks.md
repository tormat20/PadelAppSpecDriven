# Tasks: Dual Event Creation Flows and Editable Preview

**Input**: Design documents from `/specs/014-dual-event-creation/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include tests because contracts define explicit verification targets across frontend and backend.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no unresolved dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature-specific test scaffolding and docs structure.

- [X] T001 Create backend contract test files for dual-create and edit behaviors in `backend/tests/contract/test_dual_create_actions_api.py` and `backend/tests/contract/test_edit_event_flow_api.py`
- [X] T002 [P] Create backend integration test file for end-to-end dual-create/edit journey in `backend/tests/integration/test_dual_create_edit_flow.py`
- [X] T003 [P] Create frontend test files for dual-create, edit-mode actions, and slots layout in `frontend/tests/create-event-dual-actions.test.tsx`, `frontend/tests/preview-edit-event-flow.test.tsx`, and `frontend/tests/home-event-slots-status-layout.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared models and API contracts that all stories rely on.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T004 Add/normalize backend event schema fields for create intent and edit-save payloads in `backend/app/api/schemas/events.py`
- [X] T005 [P] Add/normalize backend response mapping fields for setup status and missing requirements in `backend/app/api/routers/events.py`
- [X] T006 [P] Add shared backend service helpers for strict-vs-slot create intent and readiness recomputation in `backend/app/services/event_service.py`
- [X] T007 Extend repository access patterns for edit saves and status recomputation persistence in `backend/app/repositories/events_repo.py`
- [X] T008 [P] Add frontend shared event types for edit mode and action intent in `frontend/src/lib/types.ts`
- [X] T009 [P] Add frontend API client methods/types for dual-create and edit-save requests in `frontend/src/lib/api.ts`

**Checkpoint**: Foundational API and model contracts are stable for all stories.

---

## Phase 3: User Story 1 - Dual Create Actions (Priority: P1) 🎯 MVP

**Goal**: Restore strict `Create Event` validation while adding planning-only `Create Event Slot`.

**Independent Test**: In Create Event, verify `Create Event` remains disabled until strict setup is complete, while `Create Event Slot` creates planned events from planning fields only.

### Tests for User Story 1

- [X] T010 [P] [US1] Add backend contract tests for strict create vs slot create outcomes in `backend/tests/contract/test_dual_create_actions_api.py`
- [X] T011 [P] [US1] Add frontend tests for dual button enable/disable and submission semantics in `frontend/tests/create-event-dual-actions.test.tsx`

### Implementation for User Story 1

- [X] T012 [US1] Implement strict `Create Event` gating rules in `frontend/src/features/create-event/validation.ts`
- [X] T013 [US1] Implement `Create Event Slot` planning-fields-only submission path in `frontend/src/pages/CreateEvent.tsx`
- [X] T014 [US1] Ensure slot-create request ignores in-form courts/players in `frontend/src/pages/CreateEvent.tsx`
- [X] T015 [US1] Enforce strict create and slot-only intent handling in backend create service in `backend/app/services/event_service.py`
- [X] T016 [US1] Return correct `planned` or `ready` status for both create actions in `backend/app/api/routers/events.py`

**Checkpoint**: US1 is independently functional and delivers MVP value.

---

## Phase 4: User Story 2 - Edit from Preview (Priority: P2)

**Goal**: Allow editing from Preview via existing create surface in edit mode with `Save Changes` only, supporting partial saves.

**Independent Test**: Open planned event in Preview, navigate to edit mode, save incomplete setup (stays planned), then save complete setup (becomes ready), and verify Start Event gating.

### Tests for User Story 2

- [X] T017 [P] [US2] Add backend contract tests for edit-save status transitions and start gating in `backend/tests/contract/test_edit_event_flow_api.py`
- [X] T018 [P] [US2] Add backend integration test for preview-edit-save journey in `backend/tests/integration/test_dual_create_edit_flow.py`
- [X] T019 [P] [US2] Add frontend tests for preview-to-edit navigation and single primary save action in `frontend/tests/preview-edit-event-flow.test.tsx`

### Implementation for User Story 2

- [X] T020 [US2] Add `Edit Event` action from Preview and route to create page edit mode in `frontend/src/pages/PreviewEvent.tsx`
- [X] T021 [US2] Implement Create Event page edit-mode prefill loading in `frontend/src/pages/CreateEvent.tsx`
- [X] T022 [US2] Show only `Save Changes` primary action in edit mode in `frontend/src/pages/CreateEvent.tsx`
- [X] T023 [US2] Implement edit-save API call path with readiness refresh in `frontend/src/lib/api.ts`
- [X] T024 [US2] Implement backend edit-save endpoint behavior and payload mapping in `backend/app/api/routers/events.py`
- [X] T025 [US2] Allow partial edit saves and planned fallback status in `backend/app/services/event_service.py`
- [X] T026 [US2] Recompute readiness immediately after edit saves in `backend/app/services/event_service.py`

**Checkpoint**: US2 is independently functional and supports incremental event setup.

---

## Phase 5: User Story 3 - Event Slots Layout Consistency (Priority: P3)

**Goal**: Keep planned/ready indicators centered in a fixed aligned status column in Home > Event Slots.

**Independent Test**: With mixed short/long event names, verify status alignment is centered and consistent across rows.

### Tests for User Story 3

- [X] T027 [P] [US3] Add frontend layout tests for fixed status-column alignment in `frontend/tests/home-event-slots-status-layout.test.tsx`

### Implementation for User Story 3

- [X] T028 [US3] Update Event Slots row structure with dedicated status column in `frontend/src/pages/Home.tsx`
- [X] T029 [US3] Implement centered fixed-column status styling in `frontend/src/styles/components.css`
- [X] T030 [US3] Ensure list rendering keeps both planned and ready events visible in `frontend/src/pages/Home.tsx`

**Checkpoint**: US3 is independently functional and visually consistent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates across stories.

- [X] T031 [P] Update quickstart verification to reflect implemented behavior in `specs/014-dual-event-creation/quickstart.md`
- [X] T032 Run focused frontend test suite for dual-create/edit/layout in `frontend/tests/create-event-dual-actions.test.tsx`, `frontend/tests/preview-edit-event-flow.test.tsx`, and `frontend/tests/home-event-slots-status-layout.test.tsx`
- [X] T033 Run focused backend test suite for dual-create/edit behavior in `backend/tests/contract/test_dual_create_actions_api.py`, `backend/tests/contract/test_edit_event_flow_api.py`, and `backend/tests/integration/test_dual_create_edit_flow.py`
- [X] T034 Run full frontend quality checks from `frontend/package.json` scripts in `frontend/package.json`
- [X] T035 Run backend contract and integration checks from `backend/pyproject.toml` in `backend/pyproject.toml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and uses US1 contracts.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed after list payload contract is stable.
- **Phase 6 (Polish)**: Depends on completion of selected stories.

### User Story Dependencies

- **US1 (P1)**: No user-story dependency after foundation.
- **US2 (P2)**: Depends on existing create payload shape finalized in US1/foundation.
- **US3 (P3)**: Depends on status data availability; otherwise independently testable.

### Within Each User Story

- Write story tests first and confirm they fail before implementation.
- Update API contract/service behavior before wiring UI actions.
- Verify independent test criteria before moving to the next story.

### Parallel Opportunities

- Setup: `T002` and `T003` can run in parallel after `T001` starts.
- Foundational: `T005`, `T006`, `T008`, and `T009` can run in parallel.
- US1: `T010` and `T011` can run in parallel.
- US2: `T017`, `T018`, and `T019` can run in parallel.
- Polish: `T031` can run in parallel with test execution tasks.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] backend contract tests in backend/tests/contract/test_dual_create_actions_api.py"
Task: "T011 [US1] frontend dual-actions tests in frontend/tests/create-event-dual-actions.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T017 [US2] backend edit-flow contract tests in backend/tests/contract/test_edit_event_flow_api.py"
Task: "T019 [US2] frontend preview edit-flow tests in frontend/tests/preview-edit-event-flow.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T028 [US3] update Event Slots row structure in frontend/src/pages/Home.tsx"
Task: "T029 [US3] update centered status column styling in frontend/src/styles/components.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete US1 end-to-end.
3. Validate dual-create behavior independently.
4. Demo/deploy MVP with strict create restored and slot-create preserved.

### Incremental Delivery

1. Foundation ready.
2. Deliver US1 (dual create actions).
3. Deliver US2 (edit flow and save semantics).
4. Deliver US3 (status alignment consistency).
5. Run polish and full validation.

### Parallel Team Strategy

1. Backend owner implements schema/service/router tasks while frontend owner implements page/state/UI tasks.
2. Test owner prepares contract and frontend tests in parallel for each story.
3. Integrate by story checkpoints to keep each story independently releasable.

---

## Notes

- `[P]` tasks target separate files and avoid unresolved dependencies.
- Story-labeled tasks map directly to spec user stories for traceability.
- Keep changes aligned with contracts under `/specs/014-dual-event-creation/contracts/`.
