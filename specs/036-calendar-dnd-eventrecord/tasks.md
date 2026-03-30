# Tasks: Calendar Drag-and-Drop POC on EventRecord

**Input**: Design documents from `/specs/036-calendar-dnd-eventrecord/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are explicitly requested for mapping, drag/drop updates, duration normalization, event-type labels, and replacement of obsolete calendar-placeholder test behavior.

**Organization**: Tasks are grouped by user story to support independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Baseline + model/mapping scaffolding)

**Purpose**: Establish baseline calendar model/mapping scaffolding and confirm current route wiring before story work.

- [X] T001 Audit current calendar route/component usage and document touched files in `frontend/src/app/routes.tsx` and `frontend/src/pages/Calendar.tsx` (Acceptance: `/calendar` entry points and replace targets are clearly identified in code comments/notes)
- [X] T002 Create calendar-local EventRecord model/types in `frontend/src/components/calendar/calendarEventModel.ts` (Acceptance: exported `CalendarEventViewModel` and `DurationOption` types match `data-model.md`)
- [X] T003 [P] Create duration normalization helpers in `frontend/src/components/calendar/duration.ts` (Acceptance: helper returns only `60 | 90 | 120` for any numeric input)
- [X] T004 [P] Create EventRecord mapping helpers in `frontend/src/components/calendar/eventRecordMapping.ts` (Acceptance: mapping functions cover EventRecord -> CalendarEventViewModel and slot updates -> EventRecord scheduling fields)
- [X] T005 Add/extend calendar mapping tests in `frontend/tests/calendar-grid-positioning.test.ts` and `frontend/tests/calendar-api-integration.test.ts` (Acceptance: tests assert date/time mapping and duration normalization behavior)

---

## Phase 2: Foundational (Blocking prerequisites)

**Purpose**: Build reusable calendar DnD primitives and render shell required by all stories.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T006 Build minimal drag payload and slot math helpers in `frontend/src/components/calendar/calendarDnd.ts` (Acceptance: helper API supports drag start payload + drop resolution with clamped day/time)
- [X] T007 [P] Add calendar DnD state hook for local in-memory updates in `frontend/src/components/calendar/useCalendarDndState.ts` (Acceptance: hook exposes immutable update functions for move and duration update without backend writes)
- [X] T008 [P] Create/extend weekly grid render primitives for draggable event blocks in `frontend/src/components/calendar/WeekGrid.tsx` and `frontend/src/components/calendar/EventBlock.tsx` (Acceptance: components accept drag handlers and local state events)
- [X] T009 Replace placeholder page shell with POC host composition in `frontend/src/pages/Calendar.tsx` (Acceptance: `/calendar` renders interactive calendar host instead of “coming soon” copy)
- [X] T010 Add foundational drag/drop math tests in `frontend/tests/calendar-drag-reschedule.test.ts` (Acceptance: tests cover bounded day-index and valid snapped drop minutes conversion)

**Checkpoint**: Foundation ready for independent user story delivery.

---

## Phase 3: User Story 1 - Schedule events directly on weekly calendar (Priority: P1) 🎯 MVP

**Goal**: Enable drag-and-drop rescheduling of existing events in weekly view.

**Independent Test**: Open `/calendar`, drag one event to a new slot/day, confirm it moves and local state reflects updated `eventDate` + `eventTime24h`.

### Tests for User Story 1

- [X] T011 [P] [US1] Add drag-move behavior tests for calendar state updates in `frontend/tests/calendar-drag-reschedule.test.ts` (Acceptance: tests assert only dragged event changes and changed fields are `eventDate` + `eventTime24h`)
- [X] T012 [P] [US1] Add page-level render/update test for interactive calendar in `frontend/tests/calendar-api-integration.test.ts` (Acceptance: test confirms `/calendar` uses loaded events and repositions moved event)

### Implementation for User Story 1

- [X] T013 [US1] Wire Calendar page to load week events into local in-memory calendar state in `frontend/src/pages/Calendar.tsx` (Acceptance: initial render uses mapped EventRecord data only)
- [X] T014 [US1] Implement drag start/over/drop handlers with slot resolution in `frontend/src/pages/Calendar.tsx` and `frontend/src/components/calendar/WeekGrid.tsx` (Acceptance: dropping updates local state and re-renders event in new position)
- [X] T015 [US1] Ensure drop boundary handling/clamping in `frontend/src/components/calendar/calendarDnd.ts` and `frontend/src/pages/Calendar.tsx` (Acceptance: invalid/outside drops never produce invalid date/time)

**Checkpoint**: US1 is independently functional and demoable as MVP.

---

## Phase 4: User Story 2 - Keep event semantics aligned to EventRecord (Priority: P2)

**Goal**: Render EventRecord-based event semantics and Team Mexicano label behavior; remove obsolete activity-type concepts from integrated path.

**Independent Test**: Calendar cards show event name and correct event-type label set, including Team Mexicano when `eventType=Mexicano` and `isTeamMexicano=true`.

### Tests for User Story 2

- [X] T016 [P] [US2] Add event-type label rendering tests including Team Mexicano in `frontend/tests/calendar-event-block.test.ts` (Acceptance: tests cover all supported labels and Team Mexicano flag rule)
- [X] T017 [P] [US2] Add mapping test for Team Mexicano derivation in `frontend/tests/calendar-api-integration.test.ts` (Acceptance: Mexicano+team flag maps to Team Mexicano display label)

### Implementation for User Story 2

- [X] T018 [US2] Implement event-type label resolver for cards in `frontend/src/components/calendar/eventRecordMapping.ts` and `frontend/src/components/calendar/EventBlock.tsx` (Acceptance: displayed label follows contract for all supported types)
- [X] T019 [US2] Remove obsolete placeholder/activity-only calendar behavior from `frontend/src/pages/Calendar.tsx` and related unused imports in `frontend/src/components/calendar/*.tsx` (Acceptance: integrated path has no dependency on Figma ActivityType model)
- [X] T020 [US2] Align calendar card visuals with app theme tokens/styles in `frontend/src/styles/components.css` and/or `frontend/src/styles/layout.css` (Acceptance: no broad global reset; cards follow existing app visual language)

**Checkpoint**: US2 works independently and preserves EventRecord semantics.

---

## Phase 5: User Story 3 - Update and constrain duration in calendar state (Priority: P3)

**Goal**: Enable duration updates with strict normalization to 60/90/120 and immediate visual/state updates.

**Independent Test**: Update event duration from calendar control, verify resulting duration is always one of 60/90/120 and card height/time range updates immediately.

### Tests for User Story 3

- [X] T021 [P] [US3] Add duration normalization and update tests in `frontend/tests/calendar-grid-positioning.test.ts` and `frontend/tests/calendar-drawer.test.ts` (Acceptance: tests assert normalization to `60|90|120` and local state update)
- [X] T022 [P] [US3] Add card-render duration/time-range assertions in `frontend/tests/calendar-event-block.test.ts` (Acceptance: rendered time range and height logic reflect updated duration)

### Implementation for User Story 3

- [X] T023 [US3] Add duration edit control + handler wiring in `frontend/src/components/calendar/EventDrawer.tsx` and `frontend/src/pages/Calendar.tsx` (Acceptance: duration change updates only target event in local state)
- [X] T024 [US3] Apply duration normalization during state updates in `frontend/src/components/calendar/duration.ts` and `frontend/src/components/calendar/useCalendarDndState.ts` (Acceptance: persisted local value always `60|90|120`)
- [X] T025 [US3] Reflect duration changes in event block placement/size in `frontend/src/components/calendar/EventBlock.tsx` and `frontend/src/components/calendar/WeekGrid.tsx` (Acceptance: block height/time range updates immediately after duration change)

**Checkpoint**: US3 is independently functional and constrained correctly.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Replace obsolete placeholder-only tests, run full validation, and verify quickstart expectations.

- [X] T026 Replace/remove obsolete placeholder-oriented calendar assertions in `frontend/tests/calendar-api-integration.test.ts` and `frontend/tests/calendar-grid-positioning.test.ts` (Acceptance: tests align with interactive POC behavior)
- [X] T027 [P] Run frontend lint validation with `cd frontend && npm run lint` (Acceptance: command exits successfully with no type errors)
- [X] T028 [P] Run frontend test validation with `cd frontend && npm test` (Acceptance: test suite passes with updated calendar coverage)
- [X] T029 Execute manual quickstart verification in `specs/036-calendar-dnd-eventrecord/quickstart.md` and record outcomes in same file (Acceptance: all checklist items verified, including local-state-only boundary)

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies.
- Phase 2 (Foundational): depends on Phase 1; blocks all user stories.
- Phase 3 (US1): depends on Phase 2.
- Phase 4 (US2): depends on Phase 2; can run after US1 but remains independently testable.
- Phase 5 (US3): depends on Phase 2 and uses US1 interaction baseline.
- Phase 6 (Polish): depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: independent MVP once foundational tasks are complete.
- **US2 (P2)**: independent semantic/rendering increment; should not require duration feature.
- **US3 (P3)**: depends on interactive calendar host from US1, remains independently testable as duration-focused increment.

### Within-Story Order

- Story tests first (T011/T012, T016/T017, T021/T022), then implementation tasks.
- Mapping/model tasks before page wiring.
- Page wiring before polish/validation.

---

## Parallel Execution Examples

### US1 parallel example

```bash
# Run in parallel after foundational phase:
T011 [US1] frontend/tests/calendar-drag-reschedule.test.ts
T012 [US1] frontend/tests/calendar-api-integration.test.ts
```

### US2 parallel example

```bash
# Run in parallel:
T016 [US2] frontend/tests/calendar-event-block.test.ts
T017 [US2] frontend/tests/calendar-api-integration.test.ts
```

### US3 parallel example

```bash
# Run in parallel:
T021 [US3] frontend/tests/calendar-grid-positioning.test.ts + frontend/tests/calendar-drawer.test.ts
T022 [US3] frontend/tests/calendar-event-block.test.ts
```

---

## Implementation Strategy

### MVP first

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) as first usable increment.
3. Validate drag/drop scheduling on `/calendar` before adding other enhancements.

### Incremental delivery

1. Add US2 semantic rendering and Team Mexicano label behavior.
2. Add US3 duration updates and normalization.
3. Complete Polish phase and full validation commands.

### Format validation

- All tasks follow required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- Story labels are present only for user story tasks.
- Parallel tasks are marked `[P]` only when safe to run independently.
