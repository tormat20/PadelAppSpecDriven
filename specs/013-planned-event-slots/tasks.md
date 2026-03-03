# Tasks: Planned Event Slots with Deferred Setup Validation

**Input**: Design documents from `/specs/013-planned-event-slots/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include backend contract/integration and frontend Vitest coverage because the feature contracts explicitly define verification targets.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes concrete file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare migration and test scaffolding for planned-slot work.

- [X] T001 Create migration scaffold for planned-slot fields in `backend/app/db/migrations/002_planned_event_slots.sql`
- [X] T002 Create backend contract test files for planned-slot features in `backend/tests/contract/test_planned_event_slots_api.py`, `backend/tests/contract/test_planned_event_warnings_api.py`, and `backend/tests/contract/test_planned_event_readiness_and_conflicts_api.py`
- [X] T003 [P] Create frontend test files for planned-slot UX flows in `frontend/tests/create-event-planned-slots.test.tsx`, `frontend/tests/planned-event-status-display.test.tsx`, and `frontend/tests/planned-event-setup-flow.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core schema and shared plumbing required by all user stories.

**⚠️ CRITICAL**: Complete this phase before starting user-story work.

- [X] T004 Apply planned-slot schema changes (scheduled time, setup status, version) in `backend/app/db/migrations/002_planned_event_slots.sql`
- [X] T005 [P] Add setup-status domain enum and model updates in `backend/app/domain/enums.py` and `backend/app/domain/models.py`
- [X] T006 [P] Extend event API schemas for planning fields, readiness payload, warnings, and expectedVersion in `backend/app/api/schemas/events.py`
- [X] T007 Implement repository read/write support for new planning fields and versioned updates in `backend/app/repositories/events_repo.py`
- [X] T008 Implement shared readiness evaluation and missing-requirements builder in `backend/app/services/event_service.py`
- [X] T009 [P] Extend frontend event types and API DTO parsing for setupStatus/missingRequirements/warnings/version in `frontend/src/lib/types.ts` and `frontend/src/lib/api.ts`

**Checkpoint**: Foundation is ready; user stories can be implemented.

---

## Phase 3: User Story 1 - Create Planned Event Slot (Priority: P1) 🎯 MVP

**Goal**: Let organizers create an event with only name, mode, date, and time, persisted as `planned` without courts/players.

**Independent Test**: Create an event with only planning fields and verify it persists and reloads as `planned` without assigned players/courts.

### Tests for User Story 1

- [X] T010 [P] [US1] Add contract tests for planning-only create and required planning-field validation in `backend/tests/contract/test_planned_event_slots_api.py`
- [X] T011 [P] [US1] Add frontend tests for planning-only create flow and save gating in `frontend/tests/create-event-planned-slots.test.tsx`

### Implementation for User Story 1

- [X] T012 [US1] Update create-event request validation to allow planning-only payloads in `backend/app/api/schemas/events.py`
- [X] T013 [US1] Update event creation logic to default setup status to `planned` and initialize version in `backend/app/services/event_service.py`
- [X] T014 [US1] Persist and return planned-slot fields on create/get in `backend/app/repositories/events_repo.py`
- [X] T015 [US1] Return setupStatus, missingRequirements, and version from create/get endpoints in `backend/app/api/routers/events.py`
- [X] T016 [US1] Update create form validation to permit planned creation without courts/players in `frontend/src/features/create-event/validation.ts`
- [X] T017 [US1] Update create submission and success handling for planned slots in `frontend/src/pages/CreateEvent.tsx`
- [X] T018 [US1] Render planned status metadata in API client mapping in `frontend/src/lib/api.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Distinguish Planned vs Ready Events (Priority: P2)

**Goal**: Make setup status and warning context visible so organizers can quickly identify incomplete events.

**Independent Test**: With mixed events, verify overview/detail surfaces clearly show planned vs ready status and warnings for past date/time and duplicates.

### Tests for User Story 2

- [X] T019 [P] [US2] Add backend contract tests for duplicate and past-datetime warning responses in `backend/tests/contract/test_planned_event_warnings_api.py`
- [X] T020 [P] [US2] Add frontend status and warning rendering tests in `frontend/tests/planned-event-status-display.test.tsx`

### Implementation for User Story 2

- [X] T021 [US2] Implement warning computation (past datetime and duplicate slot detection) in `backend/app/services/event_service.py`
- [X] T022 [US2] Expose warning/disambiguation fields in event responses in `backend/app/api/routers/events.py`
- [X] T023 [US2] Show non-blocking warning UI and aria-live messaging in `frontend/src/pages/CreateEvent.tsx`
- [X] T024 [US2] Display planned/ready badges and duplicate disambiguation in event overview in `frontend/src/pages/Home.tsx`
- [X] T025 [US2] Display setup status and pending requirements in event detail in `frontend/src/pages/PreviewEvent.tsx`
- [X] T026 [US2] Add shared warning/status styles in `frontend/src/styles/components.css`

**Checkpoint**: User Story 2 is independently testable with clear planned/ready visibility.

---

## Phase 5: User Story 3 - Complete Setup Later (Priority: P3)

**Goal**: Allow incremental setup updates, enforce readiness for start/run, and prevent silent overwrite on concurrent edits.

**Independent Test**: Update a planned event over time until ready, verify start remains blocked until complete, and confirm stale concurrent saves are rejected with refresh/retry guidance.

### Tests for User Story 3

- [X] T027 [P] [US3] Add backend contract and integration tests for readiness transitions, start blocking, and version conflicts in `backend/tests/contract/test_planned_event_readiness_and_conflicts_api.py` and `backend/tests/integration/test_planned_event_setup_flow.py`
- [X] T028 [P] [US3] Add frontend tests for deferred setup, start gating, and conflict retry messaging in `frontend/tests/planned-event-setup-flow.test.tsx`

### Implementation for User Story 3

- [X] T029 [US3] Add event setup update schema with expectedVersion and editable setup fields in `backend/app/api/schemas/events.py`
- [X] T030 [US3] Implement conflict-aware setup update workflow and version increment in `backend/app/services/event_service.py`
- [X] T031 [US3] Implement compare-and-swap update queries for event version conflicts in `backend/app/repositories/events_repo.py`
- [X] T032 [US3] Add/extend event update endpoint and conflict response mapping in `backend/app/api/routers/events.py`
- [X] T033 [US3] Enforce readiness-based start blocking with missing-requirements payload in `backend/app/services/event_service.py` and `backend/app/api/routers/events.py`
- [X] T034 [US3] Extend frontend API update methods to send expectedVersion and surface conflict details in `frontend/src/lib/api.ts`
- [X] T035 [US3] Update event detail start gating and missing-requirements UX in `frontend/src/pages/PreviewEvent.tsx`
- [ ] T036 [US3] Revalidate setup immediately on mode change in `frontend/src/pages/CreateEvent.tsx` and `frontend/src/components/mode/ModeAccordion.tsx`

**Checkpoint**: User Story 3 is independently functional and resilient to concurrent edits.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, regression checks, and release readiness.

- [ ] T037 [P] Update quickstart verification steps and operator notes in `specs/013-planned-event-slots/quickstart.md`
- [ ] T038 Run frontend regression suite for planned-slot changes in `frontend/tests/create-event-planned-slots.test.tsx`, `frontend/tests/planned-event-status-display.test.tsx`, and `frontend/tests/planned-event-setup-flow.test.tsx`
- [ ] T039 Run backend regression suite for planned-slot APIs in `backend/tests/contract/test_planned_event_slots_api.py`, `backend/tests/contract/test_planned_event_warnings_api.py`, and `backend/tests/contract/test_planned_event_readiness_and_conflicts_api.py`
- [ ] T040 Run full project checks via `frontend/package.json` scripts and backend pytest commands from `specs/013-planned-event-slots/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and US1 response shapes.
- **Phase 5 (US3)**: Depends on Phase 2 and builds on US1 setup lifecycle.
- **Phase 6 (Polish)**: Depends on completed target stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after foundation.
- **US2 (P2)**: Depends on US1 event payload baseline; remains independently testable.
- **US3 (P3)**: Depends on foundational readiness/version plumbing; can proceed after US1 is stable.

### Within Each User Story

- Write tests first and confirm failure before implementation.
- Backend schema/service/repository updates before router wiring.
- API contract changes before frontend integration.
- Story-specific regressions pass before moving to next story.

### Parallel Opportunities

- Setup: `T003` can run alongside `T001-T002`.
- Foundational: `T005`, `T006`, and `T009` can run in parallel; `T007-T008` follow once schema direction is set.
- US1: `T010` and `T011` can run together before `T012-T018`.
- US2: `T019` and `T020` can run together; `T024` and `T025` can proceed in parallel after `T022`.
- US3: `T027` and `T028` can run together; `T034` can run in parallel with `T031-T033` after API contract stabilizes.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] backend planning-only create contract tests in backend/tests/contract/test_planned_event_slots_api.py"
Task: "T011 [US1] frontend planning-slot create tests in frontend/tests/create-event-planned-slots.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T024 [US2] planned/ready badges and duplicate disambiguation in frontend/src/pages/Home.tsx"
Task: "T025 [US2] pending setup detail view in frontend/src/pages/PreviewEvent.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T031 [US3] compare-and-swap version update in backend/app/repositories/events_repo.py"
Task: "T034 [US3] expectedVersion API client updates in frontend/src/lib/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1-2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate US1 independently using create flow + persistence checks.
4. Demo/deploy MVP with planned-slot creation enabled.

### Incremental Delivery

1. Foundation ready (Phases 1-2).
2. Add US1 (planned creation).
3. Add US2 (status visibility + warnings).
4. Add US3 (deferred setup transitions + conflict safety).
5. Run Phase 6 polish and full regressions.

### Parallel Team Strategy

1. One developer handles backend foundation (`T004-T008`), one handles frontend foundation (`T009`).
2. After US1 API stabilizes, split US2 UI work (`T024-T026`) and US3 backend concurrency work (`T030-T033`).
3. Keep a shared owner for contract tests to preserve API behavior consistency.

---

## Notes

- `[P]` tasks target separate files and no unresolved dependencies.
- Story labels map each task directly to spec user stories.
- Each user-story phase includes its own independent test criteria and verification tasks.
- Keep changes aligned with `specs/013-planned-event-slots/contracts/` contract expectations.
