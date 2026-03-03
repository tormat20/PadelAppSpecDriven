# Tasks: Event State and Restart Iteration

**Input**: Design documents from `/specs/016-event-state-restart/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Include backend contract/integration and frontend Vitest coverage because contracts define explicit verification targets.

**Organization**: Tasks are grouped by user story to support independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no unresolved dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature-specific test scaffolding for state, restart, and resume-error behavior.

- [ ] T001 Create backend contract test files in `backend/tests/contract/test_event_state_actions_api.py` and `backend/tests/contract/test_resume_restart_error_contracts_api.py`
- [ ] T002 [P] Create backend integration test file for restart/reset and resume restore flow in `backend/tests/integration/test_event_restart_resume_flow.py`
- [ ] T003 [P] Create frontend test files for four-state labels and preview actions/errors in `frontend/tests/home-event-four-state-labels.test.tsx`, `frontend/tests/preview-event-actions-state-gating.test.tsx`, and `frontend/tests/preview-event-summary-and-errors.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared state mapping and error contract primitives used by all stories.

**⚠️ CRITICAL**: Complete this phase before user-story work.

- [ ] T004 Add/normalize runtime lifecycle state enum coverage in `backend/app/domain/enums.py` and `backend/app/domain/models.py`
- [ ] T005 [P] Extend event response schemas for deterministic display/action state fields in `backend/app/api/schemas/events.py`
- [ ] T006 [P] Normalize event list/detail mapper for four-state derivation in `backend/app/api/routers/events.py`
- [ ] T007 Add structured resume/load failure payload mapping in `backend/app/api/routers/events.py` and `backend/app/api/routers/rounds.py`
- [ ] T008 [P] Add frontend type support for `planned`/`ready`/`ongoing`/`finished` and action availability in `frontend/src/lib/types.ts`
- [ ] T009 [P] Add frontend API error-normalization helpers for actionable guidance in `frontend/src/lib/api.ts`

**Checkpoint**: Shared contracts and state mapping are stable.

---

## Phase 3: User Story 1 - Reliable Ongoing and Resume Flow (Priority: P1) 🎯 MVP

**Goal**: Ensure reliable ongoing transition, resume restoration, and confirmed restart reset behavior.

**Independent Test**: Start a ready event, leave run view, reload, resume progress, then restart and verify reset-to-ready semantics.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add backend contract tests for start-to-ongoing and auto-finish transition in `backend/tests/contract/test_event_state_actions_api.py`
- [ ] T011 [P] [US1] Add backend integration tests for resume restoration and restart reset in `backend/tests/integration/test_event_restart_resume_flow.py`
- [ ] T012 [P] [US1] Add frontend tests for ongoing resume/restart preview actions in `frontend/tests/preview-event-actions-state-gating.test.tsx`

### Implementation for User Story 1

- [ ] T013 [US1] Persist immediate ongoing transition on successful start in `backend/app/services/event_service.py`
- [ ] T014 [US1] Enforce automatic finished transition when required rounds/matches complete in `backend/app/services/round_service.py` and `backend/app/services/summary_service.py`
- [ ] T015 [US1] Implement restart command handling with run-progress reset and setup preservation in `backend/app/services/event_service.py` and `backend/app/repositories/events_repo.py`
- [ ] T016 [US1] Add/adjust SQL support for restart cleanup of rounds/matches/results in `backend/app/repositories/sql/events/` and `backend/app/repositories/sql/matches/`
- [ ] T017 [US1] Hydrate run page from persisted current round and match/result state on resume in `frontend/src/pages/RunEvent.tsx`
- [ ] T018 [US1] Wire restart confirmation flow and post-restart return-to-preview behavior in `frontend/src/pages/PreviewEvent.tsx`

**Checkpoint**: US1 is independently functional and resumable/restartable.

---

## Phase 4: User Story 2 - Correct State Labels and Actions (Priority: P2)

**Goal**: Show four labels consistently and gate actions correctly by state.

**Independent Test**: Verify planned/ready/ongoing/finished labels and action options in Home and Preview match required rules.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add backend contract tests for four-state action-gating payloads in `backend/tests/contract/test_event_state_actions_api.py`
- [ ] T020 [P] [US2] Add frontend tests for Home four-state labels in `frontend/tests/home-event-four-state-labels.test.tsx`

### Implementation for User Story 2

- [ ] T021 [US2] Render four-state labels in Event Slots list rows in `frontend/src/pages/Home.tsx`
- [ ] T022 [US2] Implement preview action gating for planned/ready/ongoing/finished states in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T023 [US2] Expose `View Summary` primary action path for finished events in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T024 [US2] Update event list/detail backend payload fields for deterministic state/action rendering in `backend/app/api/routers/events.py` and `backend/app/services/event_service.py`
- [ ] T025 [US2] Update state chip styling to include finished and ongoing variants in `frontend/src/styles/components.css`

**Checkpoint**: US2 is independently functional with unambiguous labels and actions.

---

## Phase 5: User Story 3 - Clear Preview Context and Errors (Priority: P3)

**Goal**: Fix self-duplicate warning, show richer preview summary rows, and provide actionable resume/load errors.

**Independent Test**: Verify self-edit duplicate suppression, combined preview date-time + setup rows, and actionable non-generic error guidance.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add backend contract tests for self-duplicate exclusion and structured resume/load errors in `backend/tests/contract/test_resume_restart_error_contracts_api.py`
- [ ] T027 [P] [US3] Add frontend tests for preview summary rows and actionable error rendering in `frontend/tests/preview-event-summary-and-errors.test.tsx`
- [ ] T028 [P] [US3] Add frontend tests for edit self-duplicate suppression behavior in `frontend/tests/create-event-dual-actions.test.tsx`

### Implementation for User Story 3

- [ ] T029 [US3] Exclude current event ID from duplicate check logic during edit-mode validation in `backend/app/services/event_service.py` and `backend/app/repositories/events_repo.py`
- [ ] T030 [US3] Pass current event context into duplicate warning calls in `frontend/src/pages/CreateEvent.tsx` and `frontend/src/lib/api.ts`
- [ ] T031 [US3] Render combined date-time and summary rows (mode, setup, players, courts) in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T032 [US3] Replace generic resume/load network text with actionable guidance and retry/back options in `frontend/src/pages/RunEvent.tsx` and `frontend/src/pages/PreviewEvent.tsx`

**Checkpoint**: US3 is independently functional with clearer preview context and recovery UX.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final regression and documentation validation across stories.

- [ ] T033 [P] Update scenario validation notes to include finished-state and restart outcomes in `specs/016-event-state-restart/quickstart.md`
- [ ] T034 Run focused frontend tests for four-state/actions/summary/error behavior in `frontend/tests/home-event-four-state-labels.test.tsx`, `frontend/tests/preview-event-actions-state-gating.test.tsx`, and `frontend/tests/preview-event-summary-and-errors.test.tsx`
- [ ] T035 Run focused backend tests for state transitions/restart/error contracts in `backend/tests/contract/test_event_state_actions_api.py`, `backend/tests/contract/test_resume_restart_error_contracts_api.py`, and `backend/tests/integration/test_event_restart_resume_flow.py`
- [ ] T036 Run full frontend quality checks via `frontend/package.json` scripts in `frontend/package.json`
- [ ] T037 Run backend contract and integration suite via `backend/pyproject.toml` commands in `backend/pyproject.toml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and consumes state outputs from US1.
- **Phase 5 (US3)**: Depends on Phase 2 and can proceed after foundational payload/error contracts are stable.
- **Phase 6 (Polish)**: Depends on completion of targeted stories.

### User Story Dependencies

- **US1 (P1)**: No user-story dependency after foundation.
- **US2 (P2)**: Depends on persisted lifecycle state mapping (US1/foundation outputs).
- **US3 (P3)**: Depends on shared error/state contracts; otherwise independently testable.

### Within Each User Story

- Write tests first and confirm failure before implementation.
- Implement backend state/contract behavior before frontend wiring.
- Verify each story against its independent test criterion before advancing.

### Parallel Opportunities

- Setup: `T002` and `T003` can run in parallel.
- Foundational: `T005`, `T006`, `T008`, and `T009` can run in parallel.
- US1: `T010`, `T011`, and `T012` can run in parallel.
- US2: `T019` and `T020` can run in parallel.
- US3: `T026`, `T027`, and `T028` can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] backend state transition contract tests in backend/tests/contract/test_event_state_actions_api.py"
Task: "T012 [US1] frontend preview action gating tests in frontend/tests/preview-event-actions-state-gating.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T020 [US2] frontend Home four-state labels tests in frontend/tests/home-event-four-state-labels.test.tsx"
Task: "T024 [US2] backend state/action payload mapping in backend/app/api/routers/events.py"
```

## Parallel Example: User Story 3

```bash
Task: "T026 [US3] backend self-duplicate/error contract tests in backend/tests/contract/test_resume_restart_error_contracts_api.py"
Task: "T027 [US3] frontend preview summary/error tests in frontend/tests/preview-event-summary-and-errors.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Deliver US1 end-to-end (ongoing transition + resume + restart reset).
3. Validate independently before adding label/UX polish stories.

### Incremental Delivery

1. Deliver US1 for operational continuity.
2. Deliver US2 for clear labels and state-gated actions.
3. Deliver US3 for context and error-quality improvements.
4. Run cross-cutting regressions.

### Parallel Team Strategy

1. Backend owner handles lifecycle/restart/error contracts.
2. Frontend owner handles labels/actions/preview summary and error UX.
3. Test owner prepares story-scoped test suites in parallel.

---

## Notes

- `[P]` tasks are split across independent files to reduce merge conflicts.
- Story-labeled tasks map directly to prioritized user stories.
- Preserve create-slot/strict-create/edit-save behavior while implementing this scope.
