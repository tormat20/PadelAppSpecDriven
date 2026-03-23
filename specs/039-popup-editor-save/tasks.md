# Tasks: Calendar Popup Editor with Immediate Save

**Input**: Design documents from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/`
**Prerequisites**: `plan.md` and `spec.md` required; `research.md`, `data-model.md`, `contracts/`, `quickstart.md` available

**Tests**: Tests are required by this spec and included per user story.

**Organization**: Tasks are grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare modal-edit scaffolding and shared typing for popup immediate-save work.

- [X] T001 Audit existing calendar edit surfaces in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T002 Define popup editor state types in `frontend/src/components/calendar/popupEditorTypes.ts`
- [X] T003 [P] Add reusable modal-overlay class tokens in `frontend/src/styles/components.css`
- [X] T004 [P] Add popup copy/constants for action labels and messaging in `frontend/src/components/calendar/popupEditorCopy.ts`
- [X] T005 Create test utilities for popup editor fixtures in `frontend/tests/helpers/calendarPopupFixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core reconciliation and immediate-save plumbing before story-specific UI behavior.

**⚠️ CRITICAL**: No user story implementation begins before this phase is complete.

- [X] T006 Add event-level staged reconciliation helper in `frontend/src/components/calendar/useStagedCalendarChanges.ts`
- [X] T007 [P] Add popup immediate-save API helper in `frontend/src/lib/api.ts`
- [X] T008 [P] Extend event update schema fields for popup payload parity in `backend/app/api/schemas/events.py`
- [X] T009 [P] Confirm/update popup-save route mapping for immediate persistence in `backend/app/api/routers/events.py`
- [X] T010 Implement popup-save reconciliation service flow in `backend/app/services/event_service.py`
- [X] T011 Implement repository support for popup-save setup updates in `backend/app/repositories/events_repo.py`
- [X] T012 Add calendar-level reducer/state hooks for hybrid model in `frontend/src/pages/Calendar.tsx`
- [X] T013 Add conflict/retry mapping helper for popup save errors in `frontend/src/components/calendar/popupSaveErrorMap.ts`

**Checkpoint**: Immediate-save + staged reconciliation primitives are available for all stories.

---

## Phase 3: User Story 1 - Open a Real Popup Editor from Calendar (Priority: P1) 🎯 MVP

**Goal**: Clicking event name opens a centered modal popup over calendar with reliable close and dialog semantics.

**Independent Test**: Click event name in weekly grid and verify centered popup open/close (`X`, cancel, Escape), focus behavior, and same calendar context retained.

### Tests for User Story 1

- [ ] T014 [US1] Add popup-open trigger tests for event-name click in `frontend/tests/calendar-event-block.test.ts`
- [ ] T015 [US1] Add modal semantics and close behavior tests in `frontend/tests/calendar-drawer.test.ts`
- [ ] T016 [US1] Add Escape/focus interaction tests in `frontend/tests/interactive-surface-pattern.test.tsx`

### Implementation for User Story 1

- [X] T017 [US1] Replace drawer shell with centered modal overlay wrapper in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T018 [US1] Wire reliable name-click popup opening path in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/pages/Calendar.tsx`
- [X] T019 [US1] Implement close `X`, cancel, and Escape handlers in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T020 [US1] Apply centered modal styling and overlay layering in `frontend/src/styles/components.css` and `frontend/src/styles/accessibility.css`

**Checkpoint**: Popup editor opens and closes correctly as a centered modal.

---

## Phase 4: User Story 2 - Use Create-Style Editing UI in Popup (Priority: P1)

**Goal**: Popup body uses create-event style form-grid flow with edit-relevant actions only.

**Independent Test**: Open popup and verify create-style sections (mode/schedule/duration/name/setup progression) and absence of main-menu action.

### Tests for User Story 2

- [ ] T021 [US2] Add popup layout parity tests against create-style sections in `frontend/tests/calendar-drawer.test.ts`
- [ ] T022 [US2] Add action-visibility tests (delete/save/cancel only) in `frontend/tests/preview-edit-event-flow.test.tsx`
- [ ] T023 [US2] Add responsive popup readability tests in `frontend/tests/calendar-grid-positioning.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Refactor popup body to create-style form-grid composition in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T025 [US2] Reuse/create mode selector cards for popup edit context in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T026 [US2] Reuse date/time/duration controls in popup form flow in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T027 [US2] Implement courts/players setup progression in popup context in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T028 [US2] Remove create-page-only actions from popup (no Main Menu) in `frontend/src/components/calendar/EventDrawer.tsx`

**Checkpoint**: Popup uses create-style editing flow with correct action set.

---

## Phase 5: User Story 3 - Save Immediately from Popup (Priority: P1)

**Goal**: Popup Save persists instantly, including courts/players edits, with clear failure/retry feedback.

**Independent Test**: Edit event in popup and save; confirm persisted backend state updates immediately and UI reflects saved values.

### Tests for User Story 3

- [X] T029 [US3] Add immediate-save success tests for popup edits in `frontend/tests/calendar-api-integration.test.ts`
- [ ] T030 [US3] Add courts/players immediate-save coverage in `frontend/tests/preview-edit-event-flow.test.tsx`
- [X] T031 [US3] Add popup-save error and retry tests in `frontend/tests/calendar-api-integration.test.ts`
- [X] T032 [US3] Add backend contract tests for popup immediate-save payloads in `backend/tests/contract/test_edit_event_flow_api.py`

### Implementation for User Story 3

- [X] T033 [US3] Route popup Save to immediate persist API in `frontend/src/components/calendar/EventDrawer.tsx` and `frontend/src/lib/api.ts`
- [X] T034 [US3] Update calendar state from canonical save response in `frontend/src/pages/Calendar.tsx`
- [X] T035 [US3] Implement popup save loading/error/retry UX states in `frontend/src/components/calendar/EventDrawer.tsx`
- [X] T036 [US3] Ensure delete action from popup persists immediately in `frontend/src/components/calendar/EventDrawer.tsx` and `backend/app/api/routers/events.py`

**Checkpoint**: Popup save/delete are immediate and reliable.

---

## Phase 6: User Story 4 - Hybrid State Reconciliation (Priority: P2)

**Goal**: Staged quick edits and popup immediate-save edits coexist without stale overwrite or redo regression.

**Independent Test**: Stage drag/resize edits, immediate-save same event in popup, then verify Save Changes/Redo Changes reconcile correctly.

### Tests for User Story 4

- [X] T037 [US4] Add mixed staged + popup-save reconciliation tests in `frontend/tests/calendar-api-integration.test.ts`
- [X] T038 [US4] Add Redo Changes non-revert tests for persisted popup saves in `frontend/tests/calendar-drag-reschedule.test.ts`
- [X] T039 [US4] Add backend conflict/version reconciliation tests in `backend/tests/contract/test_events_api.py`

### Implementation for User Story 4

- [X] T040 [US4] Reconcile event-specific staged entries after popup save in `frontend/src/components/calendar/useStagedCalendarChanges.ts`
- [X] T041 [US4] Keep unrelated staged entries untouched during reconciliation in `frontend/src/components/calendar/useStagedCalendarChanges.ts`
- [X] T042 [US4] Protect Redo Changes from reverting popup-persisted updates in `frontend/src/pages/Calendar.tsx`
- [X] T043 [US4] Apply version conflict messaging flow for popup saves in `frontend/src/components/calendar/popupSaveErrorMap.ts` and `frontend/src/components/calendar/EventDrawer.tsx`

**Checkpoint**: Hybrid model behaves safely under mixed-edit scenarios.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation, and validation across all stories.

- [X] T044 [P] Update quickstart verification notes in `specs/039-popup-editor-save/quickstart.md`
- [X] T045 [P] Run frontend lint and targeted popup/calendar tests from `frontend/package.json` and capture outcomes in `specs/039-popup-editor-save/quickstart.md`
- [X] T046 [P] Run backend contract tests for popup save/reconciliation from `backend/tests/contract/` and capture outcomes in `specs/039-popup-editor-save/quickstart.md`
- [X] T047 Validate full regression (`frontend` + `backend`) and document final status in `specs/039-popup-editor-save/quickstart.md`
- [X] T048 Update task completion checklist and implementation notes in `specs/039-popup-editor-save/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Setup; blocks all user stories.
- **Phase 3 (US1)**: depends on Foundational; MVP entry point.
- **Phase 4 (US2)**: depends on US1 modal shell and Foundational contracts.
- **Phase 5 (US3)**: depends on US1/US2 popup UI and Foundational API plumbing.
- **Phase 6 (US4)**: depends on US3 immediate-save behavior plus staged infrastructure.
- **Phase 7 (Polish)**: depends on all selected story phases.

### User Story Dependency Graph

- **US1 (P1)** → establishes popup editor shell and trigger.
- **US2 (P1)** → builds create-style body/actions on top of US1 shell.
- **US3 (P1)** → adds immediate persistence behavior to US2 flow.
- **US4 (P2)** → reconciles staged + immediate persistence based on US3 behavior.

### Within Each User Story

- Tests first, then implementation.
- UI shell before deep interaction logic.
- Persistence wiring before reconciliation.
- Story checkpoint must pass before moving forward.

### Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel.
- Phase 2: T007, T008, and T009 can run in parallel.
- US1: T014, T015, T016 can run in parallel.
- US3: T029 and T031 can run in parallel; backend T032 can run in parallel with frontend tests.
- Phase 7: T044, T045, and T046 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T014 [US1] Add popup-open trigger tests in frontend/tests/calendar-event-block.test.ts"
Task: "T015 [US1] Add modal close semantics tests in frontend/tests/calendar-drawer.test.ts"
Task: "T016 [US1] Add Escape/focus tests in frontend/tests/interactive-surface-pattern.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] Add popup layout parity tests in frontend/tests/calendar-drawer.test.ts"
Task: "T022 [US2] Add action-visibility tests in frontend/tests/preview-edit-event-flow.test.tsx"
Task: "T023 [US2] Add responsive popup tests in frontend/tests/calendar-grid-positioning.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T029 [US3] Add popup immediate-save success tests in frontend/tests/calendar-api-integration.test.ts"
Task: "T031 [US3] Add popup retry tests in frontend/tests/calendar-api-integration.test.ts"
Task: "T032 [US3] Add backend popup immediate-save contract tests in backend/tests/contract/test_edit_event_flow_api.py"
```

## Parallel Example: User Story 4

```bash
Task: "T037 [US4] Add staged + popup reconciliation tests in frontend/tests/calendar-api-integration.test.ts"
Task: "T038 [US4] Add Redo non-revert tests in frontend/tests/calendar-drag-reschedule.test.ts"
Task: "T039 [US4] Add backend conflict reconciliation tests in backend/tests/contract/test_events_api.py"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) and validate centered popup workflow.
3. Demo popup open/close reliability before deeper flow work.

### Incremental Delivery

1. US1: popup shell and trigger.
2. US2: create-style popup body/actions.
3. US3: immediate-save persistence.
4. US4: staged reconciliation safety.
5. Polish and full validation.

### Parallel Team Strategy

1. One engineer on popup shell/styling (US1/US2).
2. One engineer on immediate-save API + backend contracts (US3).
3. One engineer on staged reconciliation + redo protections (US4).
4. Converge with shared validation in Phase 7.

---

## Notes

- All tasks follow strict checklist format with IDs, optional `[P]`, required `[US#]` in story phases, and explicit file paths.
- Tests are included because the spec explicitly requests frontend/backend test adjustments.
