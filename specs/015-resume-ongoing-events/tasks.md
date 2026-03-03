# Tasks: Resumable Ongoing Events and Run-State UX

**Input**: Design documents from `/specs/015-resume-ongoing-events/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Include backend contract/integration tests and frontend Vitest coverage because contracts define explicit verification targets.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no unresolved dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create test scaffolding and feature wiring points for resumable ongoing events.

- [ ] T001 Create backend contract test files for run-state transitions and resume errors in `backend/tests/contract/test_event_ongoing_state_api.py` and `backend/tests/contract/test_resume_error_feedback_api.py`
- [ ] T002 [P] Create backend integration test file for leave-and-resume restoration flow in `backend/tests/integration/test_resume_ongoing_event_flow.py`
- [ ] T003 [P] Create frontend test files for slots labels, preview actions, and resume errors in `frontend/tests/home-event-slots-ongoing-status.test.tsx`, `frontend/tests/preview-resume-action.test.tsx`, and `frontend/tests/resume-error-feedback.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared run-state and error contracts consumed by all user stories.

**⚠️ CRITICAL**: Complete this phase before user-story implementation.

- [ ] T004 Add explicit run-state mapping support for ongoing lifecycle in `backend/app/domain/enums.py` and `backend/app/domain/models.py`
- [ ] T005 [P] Extend event API response schema to expose run-state/action-gating fields in `backend/app/api/schemas/events.py`
- [ ] T006 [P] Normalize event list/detail response mapping for run-state and action availability in `backend/app/api/routers/events.py`
- [ ] T007 Add reusable resume/load error payload contract mapping in `backend/app/api/routers/events.py` and `backend/app/api/routers/rounds.py`
- [ ] T008 [P] Add frontend event/run-state types for planned-ready-ongoing and action availability in `frontend/src/lib/types.ts`
- [ ] T009 [P] Add frontend API error normalization helper for actionable resume/load failures in `frontend/src/lib/api.ts`

**Checkpoint**: Shared run-state and error contracts are stable.

---

## Phase 3: User Story 1 - Resume Ongoing Events (Priority: P1) 🎯 MVP

**Goal**: Mark started events as ongoing and restore persisted progress when resuming after leaving run flow.

**Independent Test**: Start event, navigate away, reopen, and resume with correct round/match/result state restored.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add backend contract tests for start-to-ongoing transition and resume eligibility in `backend/tests/contract/test_event_ongoing_state_api.py`
- [ ] T011 [P] [US1] Add backend integration test for persisted round/match/result restoration on resume in `backend/tests/integration/test_resume_ongoing_event_flow.py`
- [ ] T012 [P] [US1] Add frontend test for resuming ongoing event from preview path in `frontend/tests/preview-resume-action.test.tsx`

### Implementation for User Story 1

- [ ] T013 [US1] Update start-event service transition to persist ongoing state immediately in `backend/app/services/event_service.py`
- [ ] T014 [US1] Ensure event repository status updates preserve current round pointer for resume in `backend/app/repositories/events_repo.py` and `backend/app/repositories/sql/events/set_status.sql`
- [ ] T015 [US1] Add/adjust resume fetch behavior to return current persisted round and match state in `backend/app/services/round_service.py` and `backend/app/api/routers/rounds.py`
- [ ] T016 [US1] Hydrate run page from persisted current-round snapshot on entry/resume in `frontend/src/pages/RunEvent.tsx`
- [ ] T017 [US1] Route ongoing preview action to run resume path in `frontend/src/pages/PreviewEvent.tsx`

**Checkpoint**: US1 is independently functional and resumable.

---

## Phase 4: User Story 2 - Clear Run-State Signals (Priority: P2)

**Goal**: Display planned/ready/ongoing statuses consistently and gate Start/Resume actions correctly.

**Independent Test**: Populate events in all three states and verify labels/actions are correct in Home and Preview.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add backend contract tests for state-aware action availability fields in `backend/tests/contract/test_event_ongoing_state_api.py`
- [ ] T019 [P] [US2] Add frontend status-label rendering tests for planned-ready-ongoing list states in `frontend/tests/home-event-slots-ongoing-status.test.tsx`

### Implementation for User Story 2

- [ ] T020 [US2] Add ongoing label rendering in Event Slots list items in `frontend/src/pages/Home.tsx`
- [ ] T021 [US2] Add state-derived primary action logic (`Start Event` vs `Resume Event`) in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T022 [US2] Enforce planned-state execution action suppression in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T023 [US2] Expose state-aware execution action hints from backend event details in `backend/app/services/event_service.py` and `backend/app/api/routers/events.py`
- [ ] T024 [US2] Update Event Slots styling for consistent third-state chip presentation in `frontend/src/styles/components.css`

**Checkpoint**: US2 is independently functional with unambiguous labels and actions.

---

## Phase 5: User Story 3 - Better Preview and Error Feedback (Priority: P3)

**Goal**: Show combined date-time in preview and replace generic resume/load errors with actionable guidance.

**Independent Test**: Preview shows `YYYY-MM-DD HH:MM` style schedule and resume/load failure surfaces actionable next-step messages.

### Tests for User Story 3

- [ ] T025 [P] [US3] Add backend contract tests for structured resume/load error payloads in `backend/tests/contract/test_resume_error_feedback_api.py`
- [ ] T026 [P] [US3] Add frontend tests for actionable resume/load error rendering in `frontend/tests/resume-error-feedback.test.tsx`
- [ ] T027 [P] [US3] Add frontend test for combined preview schedule line in `frontend/tests/preview-resume-action.test.tsx`

### Implementation for User Story 3

- [ ] T028 [US3] Add consistent actionable error mapping for resume/load failures in `backend/app/api/routers/events.py` and `backend/app/api/routers/rounds.py`
- [ ] T029 [US3] Implement frontend API error parser to map raw failures to actionable messages in `frontend/src/lib/api.ts`
- [ ] T030 [US3] Render actionable retry/return guidance for resume/load failures in `frontend/src/pages/RunEvent.tsx` and `frontend/src/pages/PreviewEvent.tsx`
- [ ] T031 [US3] Show combined date-time schedule line in preview header/details in `frontend/src/pages/PreviewEvent.tsx`

**Checkpoint**: US3 is independently functional with improved preview context and error recovery UX.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final regression checks and documentation updates across stories.

- [ ] T032 [P] Update quickstart validation steps with implemented resume-state outcomes in `specs/015-resume-ongoing-events/quickstart.md`
- [ ] T033 Run focused frontend test suite for ongoing status/resume/error UX in `frontend/tests/home-event-slots-ongoing-status.test.tsx`, `frontend/tests/preview-resume-action.test.tsx`, and `frontend/tests/resume-error-feedback.test.tsx`
- [ ] T034 Run focused backend tests for run-state transition/resume/error contracts in `backend/tests/contract/test_event_ongoing_state_api.py`, `backend/tests/contract/test_resume_error_feedback_api.py`, and `backend/tests/integration/test_resume_ongoing_event_flow.py`
- [ ] T035 Run full frontend quality checks from `frontend/package.json` scripts in `frontend/package.json`
- [ ] T036 Run backend contract and integration checks from `backend/pyproject.toml` in `backend/pyproject.toml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and consumes run-state outputs from US1.
- **Phase 5 (US3)**: Depends on Phase 2 and can proceed after shared error/run-state contracts are stable.
- **Phase 6 (Polish)**: Depends on completed target stories.

### User Story Dependencies

- **US1 (P1)**: No user-story dependency after foundation.
- **US2 (P2)**: Depends on run-state being exposed and persisted (US1/foundation).
- **US3 (P3)**: Depends on resume/load paths and error contracts from foundation; independent once contracts are available.

### Within Each User Story

- Write tests first and confirm failure before implementation.
- Implement backend state/contract changes before frontend wiring.
- Validate each story against its independent test criterion before moving on.

### Parallel Opportunities

- Setup: `T002` and `T003` can run in parallel.
- Foundational: `T005`, `T006`, `T008`, and `T009` can run in parallel.
- US1: `T010`, `T011`, and `T012` can run in parallel.
- US2: `T018` and `T019` can run in parallel.
- US3: `T025`, `T026`, and `T027` can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] backend run-state transition contract tests in backend/tests/contract/test_event_ongoing_state_api.py"
Task: "T012 [US1] frontend preview resume action tests in frontend/tests/preview-resume-action.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T019 [US2] frontend ongoing status label tests in frontend/tests/home-event-slots-ongoing-status.test.tsx"
Task: "T023 [US2] backend action-hint mapping in backend/app/services/event_service.py"
```

## Parallel Example: User Story 3

```bash
Task: "T025 [US3] backend resume error payload tests in backend/tests/contract/test_resume_error_feedback_api.py"
Task: "T026 [US3] frontend actionable resume error tests in frontend/tests/resume-error-feedback.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup + Foundational phases.
2. Complete US1 (ongoing transition + resume restoration).
3. Validate resumable behavior independently before layering UI polish.

### Incremental Delivery

1. Deliver US1 for core resume continuity.
2. Deliver US2 for clear labels and action gating.
3. Deliver US3 for preview schedule clarity and actionable failures.
4. Run full regression and quality checks.

### Parallel Team Strategy

1. Backend owner handles state transition/resume contract tasks.
2. Frontend owner handles label/action/error rendering tasks.
3. Test owner prepares contract/integration tests in parallel by story.

---

## Notes

- `[P]` tasks are intentionally split by file boundaries for safe parallel work.
- Story-labeled tasks map directly to prioritized user stories in the spec.
- Keep prior create/edit behavior untouched while implementing this run-state scope.
