# Tasks: Calendar interaction modes + template drag-create

**Input**: Design documents from `/specs/037-calendar-interaction-polish/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are required by the specification and must be updated before implementation changes per story.

**Organization**: Tasks are grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared calendar interaction primitives and file scaffolding.

- [X] T001 Audit current calendar interaction ownership and add file-level notes in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/EventBlock.tsx` (Acceptance: move/resize ownership and integration points are documented in code comments)
- [X] T002 Create template payload and catalog types in `frontend/src/components/calendar/calendarTemplateTypes.ts` (Acceptance: includes five template types and Team Mexicano mapping fields)
- [X] T003 [P] Add resize-zone and pointer-mode utility scaffolding in `frontend/src/components/calendar/interactionMode.ts` (Acceptance: exposes bottom-4px detection and mode constants)
- [X] T004 [P] Add resize delta snapping helper in `frontend/src/components/calendar/resizeMath.ts` (Acceptance: converts pointer delta to 30-minute step changes with duration clamping)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build reusable interaction infrastructure required by all stories.

**⚠️ CRITICAL**: No user story work starts before this phase completes.

- [X] T005 Extend calendar local state manager for mode state and template-create operations in `frontend/src/components/calendar/useCalendarDndState.ts` (Acceptance: supports move mode, resize mode, and create-from-template updates)
- [X] T006 [P] Extend drag payload contracts for event move vs template create in `frontend/src/components/calendar/calendarDnd.ts` and `frontend/src/components/calendar/calendarTemplateTypes.ts` (Acceptance: drag payload differentiates existing event and template source)
- [X] T007 [P] Add event creation mapping helpers with default duration 90 and placeholder naming in `frontend/src/components/calendar/eventRecordMapping.ts` (Acceptance: template drop resolves date/time/type and returns valid local event)
- [X] T008 Update calendar page composition to include a template panel slot region in `frontend/src/pages/Calendar.tsx` (Acceptance: page has reserved area for template menu without changing route access)

**Checkpoint**: Shared interaction infrastructure and create mapping are ready.

---

## Phase 3: User Story 1 - Move and Resize Modes on Events (Priority: P1) 🎯 MVP

**Goal**: Deliver distinct move and bottom-edge resize interactions on event cards without cross-trigger conflicts.

**Independent Test**: Drag event from body to a new slot; resize same event from bottom edge; confirm date/time change on move and duration change on resize only.

### Tests for User Story 1

- [X] T009 [P] [US1] Add bottom-4px resize-zone detection tests in `frontend/tests/calendar-event-block.test.ts` (Acceptance: hover/pointer in resize zone triggers resize mode indicator only)
- [X] T010 [P] [US1] Add move/resize conflict prevention tests in `frontend/tests/calendar-drag-reschedule.test.ts` (Acceptance: resize-start cannot trigger move and move-start cannot trigger resize)
- [X] T011 [P] [US1] Add resize granularity and clamp tests in `frontend/tests/calendar-grid-positioning.test.ts` and `frontend/tests/calendar-drawer.test.ts` (Acceptance: 30-minute steps and 60/90/120 bounds enforced)

### Implementation for User Story 1

- [X] T012 [US1] Implement pointer mode switching and gesture locking in `frontend/src/components/calendar/interactionMode.ts` and `frontend/src/pages/Calendar.tsx` (Acceptance: active gesture mode remains stable until pointer-up)
- [X] T013 [US1] Add visible bottom-edge resize affordance and `ns-resize` cursor behavior in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/styles/components.css` (Acceptance: resize affordance appears only in bottom 4px zone)
- [X] T014 [US1] Implement bottom-edge resize handling using 30-minute steps in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/resizeMath.ts` (Acceptance: resizing updates duration only)
- [X] T015 [US1] Ensure move drag path preserves existing ghost preview behavior in `frontend/src/components/calendar/WeekGrid.tsx` and `frontend/src/pages/Calendar.tsx` (Acceptance: landing preview remains visible while dragging)
- [X] T016 [US1] Apply resized duration to visual card height/time range in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/components/calendar/WeekGrid.tsx` (Acceptance: immediate visual update after resize)

**Checkpoint**: US1 is independently functional and demoable as MVP.

---

## Phase 4: User Story 2 - Drag Event Templates into Calendar (Priority: P2)

**Goal**: Add draggable template menu and drop-create workflow for new empty events.

**Independent Test**: Drag each template into the grid and verify new event defaults and type mapping, including Team Mexicano semantics.

### Tests for User Story 2

- [X] T017 [P] [US2] Add template drag payload and valid-drop create tests in `frontend/tests/calendar-drag-reschedule.test.ts` (Acceptance: valid drop creates exactly one new event)
- [X] T018 [P] [US2] Add default-field mapping tests for created events in `frontend/tests/calendar-api-integration.test.ts` (Acceptance: created event has date/time from slot, duration 90, placeholder name)
- [X] T019 [P] [US2] Add Team Mexicano template mapping tests in `frontend/tests/calendar-event-block.test.ts` (Acceptance: Team template maps to Mexicano + team flag and shows Team Mexicano label)

### Implementation for User Story 2

- [X] T020 [US2] Build draggable template panel component in `frontend/src/components/calendar/EventTemplatePanel.tsx` (Acceptance: panel lists Americano, Mexicano, Team Mexicano, WinnersCourt, RankedBox as draggable items)
- [X] T021 [US2] Integrate template panel into calendar page layout in `frontend/src/pages/Calendar.tsx` and `frontend/src/styles/layout.css` (Acceptance: panel appears left-side/adjacent without route/menu regressions)
- [X] T022 [US2] Implement template drop-create flow in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/useCalendarDndState.ts` (Acceptance: drop on valid slot creates local event with defaults)
- [X] T023 [US2] Ensure newly created template events support existing move/resize interactions in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/WeekGrid.tsx` (Acceptance: created events can be moved/resized immediately)

**Checkpoint**: US2 is independently functional and creates events by template drag-drop.

---

## Phase 5: User Story 3 - Polish Interaction Feedback (Priority: P3)

**Goal**: Add consistent glare/hover polish while preserving interaction clarity.

**Independent Test**: Event cards show interactive glare on hover/focus and drag feedback remains clear during move operations.

### Tests for User Story 3

- [X] T024 [P] [US3] Add interactive glare class/state assertions in `frontend/tests/calendar-event-block.test.ts` (Acceptance: hover/focus applies expected interactive style classes)
- [X] T025 [P] [US3] Add drag-preview persistence test in `frontend/tests/calendar-drag-reschedule.test.ts` (Acceptance: preview remains visible throughout move gesture)

### Implementation for User Story 3

- [X] T026 [US3] Apply interactive-surface glare treatment to event cards in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/styles/components.css` (Acceptance: glare aligns with app interactive-surface style)
- [X] T027 [US3] Refine focus/hover visual states for accessibility consistency in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/styles/accessibility.css` (Acceptance: keyboard focus remains visible and mode cues are clear)

**Checkpoint**: US3 polish is complete and consistent with app interaction language.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, obsolete-test replacement, and full validation.

- [X] T028 Replace obsolete placeholder-era calendar assertions in `frontend/tests/calendar-api-integration.test.ts` and `frontend/tests/calendar-grid-positioning.test.ts` (Acceptance: tests reflect interaction-mode and template-create behavior)
- [X] T029 [P] Run lint validation via `cd frontend && npm run lint` (Acceptance: command exits successfully)
- [X] T030 [P] Run full test suite via `cd frontend && npm test` (Acceptance: frontend tests pass with updated calendar coverage)
- [X] T031 Update `specs/037-calendar-interaction-polish/quickstart.md` with implementation validation outcomes (Acceptance: results section added with command outcomes and manual checks)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks user stories.
- **Phase 3 (US1)**: depends on Phase 2; provides MVP.
- **Phase 4 (US2)**: depends on Phase 2; integrates with US1 interaction paths.
- **Phase 5 (US3)**: depends on US1 base interactions and can proceed after Phase 3.
- **Phase 6 (Polish)**: depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: independent once foundational phase is complete.
- **US2 (P2)**: depends on shared drag/drop infrastructure and integrates with US1 interaction handling.
- **US3 (P3)**: depends on event-card interaction surface from US1/US2.

### Within Each User Story

- Write/update tests first and ensure coverage targets are met.
- Implement interaction/model changes after corresponding tests are in place.
- Complete story checkpoint before moving to next priority.

### Parallel Opportunities

- Setup tasks marked `[P]` can run together.
- Foundational tasks marked `[P]` can run together.
- Story test tasks marked `[P]` can run together within each story.
- Final validation commands T029 and T030 can run independently after code completion.

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel:
Task: "T009 [US1] frontend/tests/calendar-event-block.test.ts"
Task: "T010 [US1] frontend/tests/calendar-drag-reschedule.test.ts"
Task: "T011 [US1] frontend/tests/calendar-grid-positioning.test.ts + frontend/tests/calendar-drawer.test.ts"
```

## Parallel Example: User Story 2

```bash
# Run US2 tests in parallel:
Task: "T017 [US2] frontend/tests/calendar-drag-reschedule.test.ts"
Task: "T018 [US2] frontend/tests/calendar-api-integration.test.ts"
Task: "T019 [US2] frontend/tests/calendar-event-block.test.ts"
```

## Parallel Example: User Story 3

```bash
# Run US3 test updates in parallel:
Task: "T024 [US3] frontend/tests/calendar-event-block.test.ts"
Task: "T025 [US3] frontend/tests/calendar-drag-reschedule.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 + Phase 2.
2. Complete US1 (Phase 3) and validate move/resize separation.
3. Demo MVP before template creation work.

### Incremental Delivery

1. Add US2 template drag-create behavior.
2. Add US3 interaction polish.
3. Finish cross-cutting cleanup and full validation.

### Format Validation

- All tasks use required checklist format with ID, optional `[P]`, and `[US#]` where applicable.
- Story labels appear only in story phases.
- Each task includes explicit file path targets for immediate execution.
