# Tasks: Calendar Reliability and Staged Save Workflow

**Input**: Design documents from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/`
**Prerequisites**: `plan.md` and `spec.md` required; `research.md`, `data-model.md`, `contracts/`, `quickstart.md` available

**Tests**: Tests are required by the feature spec and are included per user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align shared calendar types, mapping helpers, and test scaffolding before story work.

- [X] T001 Audit calendar staged-save touchpoints in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/useCalendarDndState.ts`
- [X] T002 Define staged save session and change-set types in `frontend/src/components/calendar/stagedChangeTypes.ts`
- [X] T003 [P] Implement legacy event normalization helpers in `frontend/src/components/calendar/normalizeCalendarEvent.ts`
- [X] T004 [P] Define event-type visual map utilities in `frontend/src/components/calendar/eventTypeVisualMap.ts`
- [X] T005 Add event management copy/constants for destructive flows in `frontend/src/lib/eventManagement.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build backend and frontend primitives that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Implement staged local change tracker hook in `frontend/src/components/calendar/useStagedCalendarChanges.ts`
- [X] T007 [P] Implement unsaved navigation guard hook in `frontend/src/components/calendar/useUnsavedCalendarGuard.ts`
- [X] T008 [P] Add staged-save API client contract in `frontend/src/lib/api.ts`
- [X] T009 [P] Add delete-all-events API client contract in `frontend/src/lib/api.ts`
- [X] T010 Add staged-save request/response schema definitions in `backend/app/api/schemas/events.py`
- [X] T011 Add staged-save and delete-all-events routes in `backend/app/api/routers/events.py`
- [X] T012 Implement staged-save orchestration and delete-all service methods in `backend/app/services/event_service.py`
- [X] T013 Implement repository-level bulk delete and dependency cleanup in `backend/app/repositories/events_repo.py`
- [X] T014 Wire foundational staged-change and save-session state into calendar page shell in `frontend/src/pages/Calendar.tsx`

**Checkpoint**: Shared staged-save and delete-all primitives are ready for story implementation.

---

## Phase 3: User Story 1 - Stage and Save Calendar Changes (Priority: P1) 🎯 MVP

**Goal**: Allow admins to stage multiple edits and commit them explicitly with reliable all-or-nothing save behavior.

**Independent Test**: Move, resize, create, and modal-edit events; verify unsaved state appears, save commits all staged edits, save errors preserve staged edits, and navigation-away warning triggers.

### Tests for User Story 1

- [X] T015 [US1] Add staged dirty-state and save-status tests in `frontend/tests/calendar-api-integration.test.ts`
- [X] T016 [US1] Add save failure + retry behavior tests in `frontend/tests/calendar-api-integration.test.ts`
- [X] T017 [US1] Add unsaved navigation guard tests in `frontend/tests/calendar-drag-reschedule.test.ts`
- [X] T018 [US1] Add staged-save batch contract tests in `backend/tests/contract/test_edit_event_flow_api.py`

### Implementation for User Story 1

- [X] T019 [US1] Add Save Changes header controls and status messaging in `frontend/src/pages/Calendar.tsx`
- [X] T020 [US1] Route move/resize/template-create/modal-edit operations into staged changes in `frontend/src/pages/Calendar.tsx`
- [X] T021 [US1] Implement save submission and retry handling in `frontend/src/pages/Calendar.tsx`
- [X] T022 [US1] Connect unsaved-leave warning behavior in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/useUnsavedCalendarGuard.ts`
- [X] T023 [US1] Enforce all-or-nothing staged-save transaction behavior in `backend/app/services/event_service.py`

**Checkpoint**: US1 is independently functional and demonstrable as MVP.

---

## Phase 4: User Story 2 - Refined Calendar Interaction Modes and Editing (Priority: P2)

**Goal**: Make move/resize/edit interactions precise while keeping edit flow in modal over `/calendar`.

**Independent Test**: Verify mode separation (move vs resize vs edit), name hover affordance, modal edit-in-place behavior, and duration-accurate drag preview for legacy and new events.

### Tests for User Story 2

- [X] T024 [US2] Add interaction mode separation tests in `frontend/tests/calendar-drag-reschedule.test.ts`
- [X] T025 [US2] Add duration-based drag preview tests in `frontend/tests/calendar-drag-reschedule.test.ts`
- [X] T026 [US2] Add name-hover/click affordance tests in `frontend/tests/calendar-event-block.test.ts`
- [X] T027 [US2] Add in-place modal open/save/cancel tests in `frontend/tests/calendar-drawer.test.ts`
- [X] T028 [US2] Add legacy normalization behavior tests in `frontend/tests/calendar-api-integration.test.ts`

### Implementation for User Story 2

- [X] T029 [US2] Normalize weekly loaded events before rendering in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/normalizeCalendarEvent.ts`
- [X] T030 [US2] Make drag ghost height match active duration footprint in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/WeekGrid.tsx`
- [X] T031 [US2] Implement name-click edit affordance and interaction split in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/components/calendar/interactionMode.ts`
- [X] T032 [US2] Ensure modal editing stays on calendar context in `frontend/src/components/calendar/EventDrawer.tsx` and `frontend/src/pages/Calendar.tsx`
- [X] T033 [US2] Ensure modal saves update staged state (not immediate persistence) in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/useStagedCalendarChanges.ts`

**Checkpoint**: US2 behavior is independently testable and does not require US3.

---

## Phase 5: User Story 3 - Event Administration and Visual Clarity (Priority: P3)

**Goal**: Provide account-level remove-all-events and make calendar visuals clearer and more consistent.

**Independent Test**: Confirm Remove All Events confirmation and deletion flow; confirm unified event-type colors, subtle edge emphasis, and widened laptop layout.

### Tests for User Story 3

- [X] T034 [US3] Add Remove All Events UI behavior tests in `frontend/tests/preview-edit-event-flow.test.tsx`
- [X] T035 [US3] Add delete-all-events backend contract test in `backend/tests/contract/test_events_api.py`
- [X] T036 [US3] Add event-type color consistency tests in `frontend/tests/calendar-event-block.test.ts`
- [X] T037 [US3] Add interaction surface style expectation tests in `frontend/tests/interactive-surface-pattern.test.tsx`
- [X] T038 [US3] Add laptop-width calendar layout coverage in `frontend/tests/calendar-grid-positioning.test.ts`

### Implementation for User Story 3

- [X] T039 [US3] Implement Event Management section and confirmation flow in `frontend/src/pages/AccountSettings.tsx`
- [X] T040 [US3] Wire remove-all-events request and user feedback in `frontend/src/pages/AccountSettings.tsx` and `frontend/src/lib/api.ts`
- [X] T041 [US3] Apply shared type-color mapping to template cards and event blocks in `frontend/src/components/calendar/EventTemplatePanel.tsx` and `frontend/src/components/calendar/EventBlock.tsx`
- [X] T042 [US3] Replace heavy glare with subtle edge emphasis for calendar surfaces in `frontend/src/styles/components.css` and `frontend/src/styles/accessibility.css`
- [X] T043 [US3] Widen laptop-first calendar layout while preserving mobile behavior in `frontend/src/styles/layout.css` and `frontend/src/pages/Calendar.tsx`

**Checkpoint**: US3 is independently verifiable with account settings + calendar visuals.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency pass and verification evidence across all stories.

- [X] T044 [P] Reconcile outdated calendar assumptions in `frontend/tests/calendar-api-integration.test.ts` and `frontend/tests/calendar-drag-reschedule.test.ts`
- [X] T045 [P] Run frontend type/lint checks from `frontend/package.json` and record result in `specs/038-calendar-staged-save/quickstart.md`
- [X] T046 [P] Run frontend test suite from `frontend/package.json` and record result in `specs/038-calendar-staged-save/quickstart.md`
- [X] T047 [P] Run backend test suite from `backend/pyproject.toml` and record result in `specs/038-calendar-staged-save/quickstart.md`
- [X] T048 Update final validation notes and scenario outcomes in `specs/038-calendar-staged-save/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and uses US1 staged infrastructure.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed after US1.
- **Phase 6 (Polish)**: Depends on completed stories in target release scope.

### User Story Dependency Graph

- **US1 (P1)** → foundation for staged-save workflow and explicit commit behavior.
- **US2 (P2)** → depends on staged primitives from US1 for modal edits and staged updates.
- **US3 (P3)** → mostly independent from US2; depends on foundational and backend admin endpoints.

### Within Each User Story

- Tests first, then implementation.
- Behavior hooks/state before UI wiring.
- Story checkpoint must pass before closing the phase.

### Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel.
- Phase 2: T007, T008, and T009 can run in parallel after T006.
- Phase 6: T045, T046, and T047 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T017 [US1] Add unsaved navigation guard tests in frontend/tests/calendar-drag-reschedule.test.ts"
Task: "T018 [US1] Add staged-save batch contract tests in backend/tests/contract/test_edit_event_flow_api.py"
```

## Parallel Example: User Story 2

```bash
Task: "T026 [US2] Add name-hover/click affordance tests in frontend/tests/calendar-event-block.test.ts"
Task: "T027 [US2] Add in-place modal open/save/cancel tests in frontend/tests/calendar-drawer.test.ts"
Task: "T028 [US2] Add legacy normalization behavior tests in frontend/tests/calendar-api-integration.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T036 [US3] Add event-type color consistency tests in frontend/tests/calendar-event-block.test.ts"
Task: "T037 [US3] Add interaction surface style expectation tests in frontend/tests/interactive-surface-pattern.test.tsx"
Task: "T038 [US3] Add laptop-width calendar layout coverage in frontend/tests/calendar-grid-positioning.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate staged-save workflow independently before adding further scope.

### Incremental Delivery

1. Deliver US1 (staged save + reliability baseline).
2. Deliver US2 (interaction precision + in-place editing).
3. Deliver US3 (admin cleanup + visual clarity).
4. Finish with Phase 6 verification and documentation evidence.

### Parallel Team Strategy

1. Team completes Setup and Foundational together.
2. After foundation is stable:
   - Engineer A: US1 completion and hardening.
   - Engineer B: US2 interaction and modal refinements.
   - Engineer C: US3 account settings and visual consistency.
3. Merge through story checkpoints with independent test proofs.

---

## Notes

- `[P]` tasks are limited to tasks that touch different files and have no unfinished dependencies.
- `[US#]` labels are used only in user story phases for traceability.
- Every task includes explicit file paths for direct execution.

---

## Phase 7: Spec Amendment - Naming, Redo, and Day-Court View

**Purpose**: Implement follow-up scope updates requested after initial 038 completion.

- [X] T049 [US2] Remove inline duration dropdown from event cards and enforce 60/90/120 content tiers in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/styles/components.css`
- [X] T050 [US2] Remove interactive-surface glare from event cards and apply event-type edge hover treatment in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/styles/components.css`
- [X] T051 [US2] Ensure event-name click always opens modal edit without drag interference in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/components/calendar/WeekGrid.tsx`
- [X] T052 [US2] Apply generated naming format `<Weekday> <TimeCategory> <EventTypeLabel>` with no `(New)` for template-created events in `frontend/src/components/calendar/eventRecordMapping.ts`
- [X] T053 [US1] Add Redo Changes action that resets to last saved staged baseline in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/useStagedCalendarChanges.ts`
- [X] T054 [US1] Match Save/Redo button sizing with week navigation buttons in `frontend/src/styles/components.css` and `frontend/src/pages/Calendar.tsx`
- [X] T055 [US4] Make weekday headers clickable and add single-day court-lane view in `frontend/src/components/calendar/WeekGrid.tsx`, `frontend/src/components/calendar/DayCourtGrid.tsx`, and `frontend/src/pages/Calendar.tsx`
- [X] T056 [US4] Implement linked multi-court hover highlight and dotted all-lane rendering for unspecified-court events in `frontend/src/components/calendar/DayCourtGrid.tsx` and `frontend/src/styles/components.css`
- [X] T057 [US2] Add/adjust tests for event-card simplification and naming rules in `frontend/tests/calendar-event-block.test.ts` and `frontend/tests/calendar-api-integration.test.ts`
- [X] T058 [US4] Add tests for day-header click and day-court lane behavior in `frontend/tests/calendar-grid-positioning.test.ts` and `frontend/tests/calendar-drag-reschedule.test.ts`
