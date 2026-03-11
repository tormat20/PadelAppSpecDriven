# Tasks: Calendar Scheduling

**Input**: Design documents from `/specs/030-calendar-scheduling/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Branch**: `030-calendar-scheduling`

**Tests**: TDD — write failing tests first for all pure-function helpers, then implement.
Backend tests: `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q`
Frontend tests: `cd frontend && npm test -- --run`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire up the route skeleton and extend the shared type system so every subsequent story compiles cleanly.

- [x] T001 Add `roundDurationMinutes: number` field to `EventRecord` in `frontend/src/lib/types.ts`
- [x] T002 [P] Add `listEventsByDateRange(from: string, to: string)` export to `frontend/src/lib/api.ts`
- [x] T003 [P] Add `/calendar` route under `RequireAdmin` in `frontend/src/app/routes.tsx` with stub `CalendarPage` in `frontend/src/pages/Calendar.tsx`
- [x] T004 [P] Fix any existing test fixtures that now fail due to missing `roundDurationMinutes` on `EventRecord` (scan `frontend/tests/` and add `roundDurationMinutes: 20` where needed)

**Checkpoint**: `npm test -- --run` passes with zero regressions; `/calendar` route resolves to stub page for admin users.

---

## Phase 2: Foundational (Blocking Backend Prerequisites)

**Purpose**: Backend changes that expose the two missing fields. These unblock all frontend story work because `EventRecord` depends on `roundDurationMinutes` and the CalendarPage depends on the date-range filter.

**⚠️ CRITICAL**: US1–US6 all require these two backend additions.

### Backend — expose `roundDurationMinutes` (contract: `backend-round-duration-exposure.md`)

- [x] T005 [P] Write failing backend test `backend/tests/test_event_response_duration.py` — asserts `roundDurationMinutes` present and is `int` in both list and single-event responses
- [x] T006 Add `roundDurationMinutes: int` to `EventResponse` class in `backend/app/api/schemas/events.py`
- [x] T007 Add `roundDurationMinutes=event.round_duration_minutes` to `_to_event_response()` in `backend/app/api/routers/events.py`
- [x] T008 Run backend tests — all must pass including T005's new tests: `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q`

### Backend — date-range filter on `GET /api/v1/events` (contract: `backend-date-range-filter.md`)

- [x] T009 [P] Write failing backend test `backend/tests/test_events_date_range_filter.py` covering: no params → all events; both params → filtered by date range; invalid date format → 422; only `from` param → all events
- [x] T010 Create new SQL file `backend/app/repositories/sql/events/list_by_date_range.sql` with `WHERE event_date BETWEEN ? AND ?` and same column order as `list_all.sql`
- [x] T011 Add `list_by_date_range(self, from_date: date, to_date: date) -> list[Event]` method to `backend/app/repositories/events_repo.py`
- [x] T012 Add `list_events_by_date_range(self, from_date: date, to_date: date)` method to `backend/app/services/event_service.py` (mirrors `list_events()` enrichment loop)
- [x] T013 Update `list_events()` router handler in `backend/app/api/routers/events.py` to accept optional `from_date`/`to_date` Query params and delegate to the appropriate service method
- [x] T014 Run backend tests — all must pass including T009's new tests: `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q`

**Checkpoint**: Backend complete — all backend tests green. `GET /api/v1/events?from=2026-03-09&to=2026-03-15` returns only events in that range. All event responses include `roundDurationMinutes`.

---

## Phase 3: User Story 1 — Weekly Calendar View (Priority: P1) 🎯 MVP

**Goal**: Admin opens `/calendar` and sees all scheduled events for the current week in a Monday-to-Sunday grid with a 07:00–00:00 time axis. Week navigation and "Today" button work. Running/Finished events show status badge. Unscheduled events appear in a strip below the grid.

**Independent Test**: Create 3 events on different days/times this week. Open `/calendar`. All 3 appear as blocks at the correct column and time. Navigate to next week (empty). Navigate back (blocks reappear). Click "Today" from two weeks in the future → returns to current week.

### Tests for User Story 1

- [x] T015 [P] Write failing unit tests in `frontend/tests/calendar-grid-positioning.test.ts` covering all pure helpers:
  - `minutesSinceGridStart`: "07:00"→0, "07:30"→30, "10:00"→180, "00:00"→1020
  - `eventHeightPx`: durationMinutes=60 & pxPerMinute=1 → 60; durationMinutes=90 → 90
  - `deriveDurationMinutes`: totalRounds=3 & roundDurationMinutes=20 → 60; totalRounds=0 → 60; roundDurationMinutes=0 → 60
  - `snapToGrid`: 0→0, 15→0, 16→30, 45→30, 46→60, 975→960
  - `minutesToTime24h`: 0→"07:00", 30→"07:30", 180→"10:00", 990→"23:30", 1020→"00:00"
  - `getWeekStart`: March 10 (Mon)→March 10; March 11 (Tue)→March 10; March 15 (Sun)→March 10
  - `getWeekDates`: returns exactly 7 dates Mon–Sun
  - `formatWeekLabel`: returns "10 Mar – 16 Mar 2026" for week of March 10
- [x] T016 [P] Write failing unit tests in `frontend/tests/calendar-api-integration.test.ts` — asserts `listEventsByDateRange` is called with Monday and Sunday ISO strings when week navigation occurs

### Implementation for User Story 1

- [x] T017 Implement all exported pure helper functions in `frontend/src/pages/Calendar.tsx`:
  - `GRID_START_HOUR`, `GRID_TOTAL_MINUTES`, `SNAP_MINUTES`, `PX_PER_MINUTE` constants
  - `minutesSinceGridStart`, `eventTopPx`, `eventHeightPx`, `deriveDurationMinutes`
  - `snapToGrid`, `minutesToTime24h`
  - `getWeekStart`, `getWeekDates`, `formatWeekLabel`
  - Run `npm test -- --run`; T015 tests must now pass
- [x] T018 [P] Implement `CalendarPage` default export in `frontend/src/pages/Calendar.tsx` with:
  - `viewWeekStart` state (Monday of current week)
  - `events: EventRecord[]` state loaded via `listEventsByDateRange(from, to)` on mount and on week change
  - Week navigation handlers: `goToPreviousWeek`, `goToNextWeek`, `goToCurrentWeek`
  - Split events into `timedEvents` / `untimedEvents`
  - Page shell layout with nav bar (Previous/Next/Today buttons + `formatWeekLabel` label)
- [x] T019 Create `frontend/src/components/calendar/WeekGrid.tsx` with:
  - Props per contract: `events`, `weekStart`, `ghostBlock`, `onBlockClick`, `onBlockDragStart`, `onGridDrop`, `onGridDragOver`, `onCellPointerDown`
  - 7 day columns (Mon–Sun) with date headers; today's column has `calendar-col--today` CSS class
  - Left time-label column (07:00, 07:30, … 00:00 — 34 labels)
  - Renders `<EventBlock>` for each timed event with `top` and `height` derived from helpers
  - Renders `<GhostBlock>` when `ghostBlock` prop is non-null
- [x] T020 Create `frontend/src/components/calendar/EventBlock.tsx` with:
  - Props: `event`, `top`, `height`, `isDragging`, `onDragStart`, `onClick`
  - Lobby: `draggable={true}`, cursor grab; Running/Finished: `draggable={false}`, cursor default, `onDragStart` blocked
  - `isDragging` → opacity 0.4
  - Block content: truncated event name, event type badge, courts label, status badge for Running/Finished
  - CSS classes: `calendar-event-block calendar-event-block--{status} calendar-event-block--{eventType}`
- [x] T021 Create `frontend/src/components/calendar/UnscheduledStrip.tsx` with props `events` + `onBlockClick`; renders a labelled horizontal panel with event name chips
- [x] T022 Wire `WeekGrid`, `UnscheduledStrip` into `CalendarPage`; render `UnscheduledStrip` only when `untimedEvents.length > 0`
- [x] T023 Write test `frontend/tests/calendar-event-block.test.ts` covering: Running/Finished block has `draggable=false` and drag rejected; Lobby block has `draggable=true`; `isDragging=true` renders opacity class
- [x] T024 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US1 complete and independently testable. Admin can open `/calendar`, see events for the week, navigate weeks, see "Today" highlight. All frontend tests green.

---

## Phase 4: User Story 2 — Drag to Reschedule (Priority: P1)

**Goal**: Organiser drags a Lobby event block horizontally (change day) or vertically (change time, snapped to 30 min). Optimistic update on drop, revert on PATCH failure with error toast. Running/Finished events cannot be dragged.

**Independent Test**: Create a Lobby event on Monday 10:00. Drag horizontally to Wednesday → date = Wednesday, time unchanged. Drag vertically to 14:30 → time = 14:30, date unchanged. Attempt to drag a Running event → block does not move, cursor = not-allowed.

### Tests for User Story 2

- [x] T025 [P] Write failing unit tests in `frontend/tests/calendar-drag-reschedule.test.ts` covering:
  - `computeDragDayIndex`: col 0 centre→0, col 6 centre→6, before col 0→0 (clamp), after col 6→6 (clamp)
  - `computeDropMinutes`: at grid top & pxPerMinute=1 → 0; at grid bottom → 1020
  - `snapToGrid(975)` → 960 (clamp to last valid slot)

### Implementation for User Story 2

- [x] T026 Export `computeDragDayIndex(clientX, gridRect)` and `computeDropMinutes(clientY, gridRect, pxPerMinute)` from `frontend/src/pages/Calendar.tsx`; implement both — run T025 tests to verify
- [x] T027 Create `frontend/src/components/calendar/GhostBlock.tsx` with props `top`, `height`, `label`, `mode`; CSS: `position: absolute; opacity: 0.45; pointer-events: none; z-index: 10; border: 2px dashed var(--color-accent)`
- [x] T028 Add drag-reschedule state and handlers to `CalendarPage` in `frontend/src/pages/Calendar.tsx`:
  - `draggingEventId: string | null` state
  - `preDragSnapshot: { eventId; originalDate; originalTime } | null` ref
  - `handleBlockDragStart(event, e)`: set `draggingEventId`, populate `preDragSnapshot`, store eventId in `dataTransfer`
  - `handleGridDragOver(e)`: call `e.preventDefault()`; compute and update `ghostBlock` state via `computeDragDayIndex` / `computeDropMinutes` / `snapToGrid`
  - `handleGridDrop(e)`: compute new date + time; apply optimistic update to `events` state; call `updateEvent`; on failure revert state and show `useToast().error(...)`; on success/finally clear `draggingEventId` and `ghostBlock`
  - `handleDragEnd`: clear drag state if drop did not succeed (use `dropSucceeded` ref)
- [x] T029 Pass drag handlers from `CalendarPage` into `WeekGrid` and `EventBlock`; wire `onGridDrop`, `onGridDragOver`, `onBlockDragStart` props
- [x] T030 Implement out-of-bounds clamping in drop handler: drop below 07:00 → "07:00"; drop above 23:30 → "23:30"
- [x] T031 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US2 complete. Drag-reschedule works with optimistic update + revert. Running/Finished events reject drag. All frontend tests green.

---

## Phase 5: User Story 3 — Click to Edit / Delete (Priority: P1)

**Goal**: Clicking a Lobby event opens a side drawer (slides in from right, grid visible behind it) pre-filled with all editable fields. Organiser can save changes (PATCH) or delete with confirmation (DELETE). Running/Finished events open drawer in read-only mode. Unsaved changes prompt on close.

**Independent Test**: Create a Lobby event. Click its block. Verify drawer opens with correct pre-filled values. Change name and duration, save. Verify block updates and backend reflects change. Click Delete, confirm → block removed. Click a Running event → no edit controls visible.

### Tests for User Story 3

- [ ] T032 Write failing unit tests in `frontend/tests/calendar-drawer.test.ts` covering:
  - `isDrawerDirty(original, current)` → false when nothing changed; true when any field changed
  - Duration derivation: `deriveDurationMinutes` with totalRounds=3, roundDurationMinutes=30 → 90

### Implementation for User Story 3

- [ ] T033 Define `DrawerState`, `DrawerPrefill` types in `frontend/src/pages/Calendar.tsx` (or `frontend/src/components/calendar/types.ts`) per data-model.md
- [ ] T034 Export `isDrawerDirty(original: DrawerFormValues, current: DrawerFormValues): boolean` from `frontend/src/components/calendar/EventDrawer.tsx`; run T032 tests to verify
- [ ] T035 Create `frontend/src/components/calendar/EventDrawer.tsx` with:
  - Props: `state: DrawerState`, `onSave`, `onDelete`, `onClose`
  - Edit mode fields: event name (text), event type (select), date (date input), start time (time, step=1800), duration (select: 60/90/120/custom), courts (number input)
  - Save behaviour: send only changed fields + `expectedVersion` via PATCH; on success update events state + close; on error show inline error
  - Delete behaviour: show confirmation dialog "Delete this event? This cannot be undone."; on confirm call `deleteEvent`; on cancel dismiss only
  - Discard-changes prompt: when closing with unsaved form changes show `window.confirm("Discard changes?")`
  - Read-only mode: all fields `disabled`, no Save or Delete buttons, only Close button
  - Slide-in animation using `motion.div` (Framer Motion): `initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.22 }}`
- [ ] T036 Add `drawerState: DrawerState` state and handlers to `CalendarPage` in `frontend/src/pages/Calendar.tsx`:
  - `handleBlockClick(event)`: Lobby → `{ open: true, mode: "edit", event }`; Running/Finished → `{ open: true, mode: "readonly", event }`
  - `handleSave(updates)`: call `updateEvent`; on success update `events` state + close drawer
  - `handleDelete(eventId, version)`: call `deleteEvent`; on success remove from `events` state + close drawer
  - `handleDrawerClose`: check dirty state; if dirty show confirm; else close
- [ ] T037 Wire `EventDrawer` into `CalendarPage` JSX; pass `drawerState`, `onSave`, `onDelete`, `onClose`
- [ ] T038 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US3 complete. Editing and deleting via drawer works. Read-only mode for locked events. Discard-changes prompt guards unsaved work. All frontend tests green.

---

## Phase 6: User Story 4 — Drag on Empty Slot to Create (Priority: P2)

**Goal**: Clicking and dragging on an empty grid cell shows a growing ghost block. On release, the side drawer opens pre-filled with the derived date, start time, and duration. Cancelling creates no event; confirming calls `POST /api/v1/events` and adds the block.

**Independent Test**: Drag from Tuesday 09:00 downward to 11:00, release. Drawer opens with date = Tuesday, start time = 09:00, duration = 120 min. Cancel → no event. Repeat and confirm → event block appears on grid.

### Tests for User Story 4

- [ ] T039 Extend `frontend/tests/calendar-api-integration.test.ts` with tests that assert `createEvent` is called with correct payload when drawer "Create" is confirmed

### Implementation for User Story 4

- [ ] T040 Add `GhostBlockState` type (if not already defined) to `frontend/src/pages/Calendar.tsx` per data-model.md: `{ mode: "reschedule" | "create", dayIndex, startMinutes, durationMinutes }`
- [ ] T041 Add create-gesture pointer-event handlers to `CalendarPage` in `frontend/src/pages/Calendar.tsx`:
  - `handleCellPointerDown(dayIndex, minutesFromGridStart, e)`: only on empty grid background (not on EventBlock); record `createDragOrigin`; set `ghostBlock = { mode: "create", ... }`
  - `pointermove` on WeekGrid container: grow `ghostBlock.durationMinutes = max(60, snapToGrid(currentMinutes - originMinutes))`
  - `pointerup` on WeekGrid container: if duration ≥ 30 open EventDrawer in `mode: "create"` pre-filled with date/time/duration; clear ghost on drawer open
- [ ] T042 Add "Repeat weekly" toggle and create logic to `EventDrawer` in `frontend/src/components/calendar/EventDrawer.tsx`:
  - Toggle checkbox labelled "Repeat weekly (rest of month)"
  - Show preview text: "Will also create: Mar 17, Mar 24" or "No more Mondays this month."
  - On "Create" button: validate name + event type required; call `createEvent(payload)`; if toggle on call `getRemainingWeekdayOccurrences` and fire N additional `createEvent` calls in parallel
  - On success: add all events to `events` state; close drawer; on failure: show error toast
  - On "Cancel": clear `ghostBlock`; close drawer; no API call
- [ ] T043 Wire `onCellPointerDown` prop from `CalendarPage` into `WeekGrid`; ensure pointer events on grid background are distinguished from EventBlock pointer events
- [ ] T044 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US4 complete. Drag-to-create gesture works end-to-end. Cancel creates no event. Confirm creates event and shows block. All frontend tests green.

---

## Phase 7: User Story 5 — Recurring Events (Priority: P2)

**Goal**: When "Repeat weekly" is enabled on event creation, the system auto-creates independent Lobby events for every remaining same-weekday in the current calendar month (starting next week). Each occurrence is fully independent — editing, moving, or deleting one has no effect on the others.

**Independent Test**: March 10 (Monday), create event at 10:00, enable "Repeat weekly". System creates March 17 and March 24 blocks. Drag March 17 to 11:00 → only that block moves. Delete March 24 → only that block disappears.

### Tests for User Story 5

- [ ] T045 Write failing unit tests in `frontend/tests/calendar-recurrence-calc.test.ts` covering:
  - `getRemainingWeekdayOccurrences(new Date("2026-03-10"))` → `[2026-03-17, 2026-03-24]`
  - `getRemainingWeekdayOccurrences(new Date("2026-03-24"))` → `[]` (last Monday in March)
  - `getRemainingWeekdayOccurrences(new Date("2026-03-31"))` → `[]` (last day of month)
  - `getRemainingWeekdayOccurrences(new Date("2026-02-24"))` → `[]` (last Tuesday in Feb 2026)
  - `getRemainingWeekdayOccurrences(new Date("2026-02-17"))` → `[2026-02-24]`

### Implementation for User Story 5

- [ ] T046 Export `getRemainingWeekdayOccurrences(originalDate: Date): Date[]` from `frontend/src/pages/Calendar.tsx`; implement the algorithm per `contracts/calendar-drag-edit-create.md`; run T045 tests to verify
- [ ] T047 Wire `getRemainingWeekdayOccurrences` into the EventDrawer "Create" flow (already scaffolded in T042): call it when "Repeat weekly" toggle is on; fire N parallel `createEvent` calls; add all results to `events` state
- [ ] T048 Add non-blocking notice via `useToast().info(...)` when `getRemainingWeekdayOccurrences` returns `[]` (no more occurrences this month)
- [ ] T049 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US5 complete. "Repeat weekly" auto-creates the correct occurrences. Each occurrence is independent. Info notice shown when no further occurrences exist.

---

## Phase 8: User Story 6 — Daily Court View (Priority: P3)

**Goal**: Organiser switches to daily view. Courts are rows (y-axis), time runs horizontally (x-axis). Events are placed in their court row at the correct time. Dragging horizontally changes time; dragging vertically changes court assignment. Both persisted via PATCH.

**Independent Test**: Switch to daily view for a day with 2 events on different courts. Each event appears in its correct court row. Drag event from Court 1 to Court 2 → court updates. Drag horizontally → time updates.

### Tests for User Story 6

- [ ] T050 [P] Extend `frontend/tests/calendar-drag-reschedule.test.ts` with court-reassignment drag tests: vertical drag in day view → courts list updated in PATCH payload

### Implementation for User Story 6

- [ ] T051 Add "Day" / "Week" view toggle button to the calendar nav bar in `frontend/src/pages/Calendar.tsx`; add `viewMode: "week" | "day"` state and `selectedDay: Date` state
- [ ] T052 Create `frontend/src/components/calendar/DayGrid.tsx` with:
  - Props: `events`, `day`, `ghostBlock`, `onBlockClick`, `onBlockDragStart`, `onGridDrop`, `onGridDragOver`
  - Y-axis: unique court numbers used by events that day, each as a labelled row ("Court 1", "Court 2", ...)
  - X-axis: time (07:00–00:00 in 30-min intervals)
  - Events placed in correct court row × time position; events spanning multiple courts span the corresponding rows
- [ ] T053 Add day-view drag handlers to `CalendarPage` in `frontend/src/pages/Calendar.tsx`:
  - Horizontal drag → `event_time` update (30-min snap) via PATCH
  - Vertical drag → `selectedCourts` list update via PATCH
  - Optimistic update + revert-on-failure pattern identical to US2
- [ ] T054 Conditionally render `DayGrid` vs `WeekGrid` in `CalendarPage` based on `viewMode` state
- [ ] T055 Run all frontend tests: `npm test -- --run` — all must pass

**Checkpoint**: US6 complete. Day view toggles correctly. Court-row layout renders. Horizontal drag updates time; vertical drag updates courts. All frontend tests green.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, CSS tokens, accessibility, and final validation.

- [ ] T056 [P] Add CSS for all calendar classes to the existing stylesheet — use `var(--color-*)` design tokens only; no hardcoded hex values. Classes: `calendar-nav`, `calendar-col--today`, `calendar-event-block`, `calendar-event-block--lobby/running/finished`, `event-drawer`, `unscheduled-strip`
- [ ] T057 [P] Handle "no events this week" empty-state in `WeekGrid` — render "No events this week — drag to schedule or use the + button" message when `events` is empty
- [ ] T058 [P] Handle week navigation past year boundaries — verify `getWeekDates` and `formatWeekLabel` handle Dec 28 → Jan 4 rollover correctly; add test case to `calendar-grid-positioning.test.ts`
- [ ] T059 [P] Handle event blocks spanning midnight — clip block at 00:00 (do not render overflow past end of grid); add note in code that events past midnight are not supported in v1
- [ ] T060 [P] Handle two events at the same day and time — render blocks side-by-side (reduced width) rather than overlapping; implement collision detection in `WeekGrid`
- [ ] T061 [P] Verify `RequireAdmin` gate is enforced: manual test that non-admin user navigating to `/calendar` is redirected to `/`, and unauthenticated user is redirected to `/login`
- [ ] T062 Run full test suites for both backend and frontend and confirm zero regressions:
  - `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q`
  - `cd frontend && npm test -- --run`
- [ ] T063 [P] TypeScript strict compliance check — run `npx tsc --noEmit` in `frontend/`; resolve all new type errors (do not introduce `any` in new code)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001–T004 can all run in parallel.
- **Phase 2 (Backend)**: T005/T009 (test files) are independent of each other and can be written in parallel. T006→T007→T008 must be sequential. T010→T011→T012→T013→T014 must be sequential. The two backend tracks (duration exposure and date-range filter) are independent of each other and can be worked in parallel.
- **Phase 3 (US1)**: Requires Phase 1 complete (types + route) and Phase 2 complete (backend returns `roundDurationMinutes`). T015/T016 (write tests) can run in parallel with each other before T017.
- **Phase 4 (US2)**: Requires Phase 3 complete (WeekGrid + EventBlock exist).
- **Phase 5 (US3)**: Requires Phase 3 complete (EventBlock click handler exists). Can start in parallel with Phase 4.
- **Phase 6 (US4)**: Requires Phase 3 complete (WeekGrid pointer events) and Phase 5 complete (EventDrawer exists in create mode).
- **Phase 7 (US5)**: Requires Phase 6 complete (create flow in EventDrawer). T045 (write tests) can start as soon as Phase 1 is done.
- **Phase 8 (US6)**: Requires Phase 4 complete (drag math helpers exist). Independent of US3/US4/US5.
- **Phase 9 (Polish)**: Requires all desired user stories complete.

### User Story Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Backend)
            └── Phase 3 (US1 — Weekly View)   ← MVP
                    ├── Phase 4 (US2 — Drag Reschedule)   ┐
                    ├── Phase 5 (US3 — Edit/Delete Drawer) ├── can start in parallel
                    └── Phase 4 + Phase 5
                            └── Phase 6 (US4 — Drag to Create)
                                    └── Phase 7 (US5 — Recurring Events)
                    └── Phase 4 (US2)
                            └── Phase 8 (US6 — Day View) [P3, deferrable]
```

### Parallel Opportunities Within Stories

- Backend: duration exposure track and date-range filter track are independent
- Phase 3: T015 (grid positioning tests) and T016 (API integration tests) write in parallel
- Phase 3: T019 (WeekGrid) and T020 (EventBlock) implement in parallel
- Phase 9: All polish tasks T056–T061 and T063 are independent files — all can run in parallel

---

## Parallel Example: Phase 3 — User Story 1

```bash
# Write both test files in parallel first (TDD):
Task A: Write calendar-grid-positioning.test.ts (T015)
Task B: Write calendar-api-integration.test.ts (T016)

# Then implement helpers (T017) until A passes.
# Then implement components in parallel:
Task A: WeekGrid.tsx (T019)
Task B: EventBlock.tsx (T020)
Task C: UnscheduledStrip.tsx (T021)
```

---

## Implementation Strategy

### MVP First (US1 — Weekly View)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Backend prerequisites (T005–T014)
3. Complete Phase 3: US1 Weekly View (T015–T024)
4. **STOP AND VALIDATE**: Organiser can open `/calendar`, see events, navigate weeks
5. Demo if ready

### Recommended Delivery Order

| Phase | Stories | Delivers |
|---|---|---|
| 1 + 2 | Setup + Backend | Foundation — no visible UI yet |
| 3 | US1 | Read-only calendar view — standalone value |
| 4 + 5 | US2 + US3 | Full interactive calendar for Lobby events |
| 6 + 7 | US4 + US5 | Power-user creation shortcuts + recurring sessions |
| 8 | US6 | Court-level scheduling (P3 — deferrable to next PR) |
| 9 | Polish | Edge cases + final QA |

---

## Task Count Summary

| Phase | Tasks | Notes |
|---|---|---|
| Phase 1 — Setup | T001–T004 (4 tasks) | All parallelisable |
| Phase 2 — Backend | T005–T014 (10 tasks) | Two independent backend tracks |
| Phase 3 — US1 Weekly View | T015–T024 (10 tasks) | 2 test + 8 implementation |
| Phase 4 — US2 Drag Reschedule | T025–T031 (7 tasks) | 1 test + 6 implementation |
| Phase 5 — US3 Edit/Delete | T032–T038 (7 tasks) | 1 test + 6 implementation |
| Phase 6 — US4 Drag to Create | T039–T044 (6 tasks) | 1 test + 5 implementation |
| Phase 7 — US5 Recurring | T045–T049 (5 tasks) | 1 test + 4 implementation |
| Phase 8 — US6 Day View | T050–T055 (6 tasks) | 1 test + 5 implementation |
| Phase 9 — Polish | T056–T063 (8 tasks) | All parallelisable |
| **Total** | **63 tasks** | |

---

## Notes

- `[P]` tasks touch different files with no in-flight dependencies — safe to run concurrently
- Each user story phase is a complete, independently shippable increment
- TDD: always write the failing test first, then implement until it passes
- Commit after each checkpoint (at minimum after each phase)
- US6 (Daily Court View, P3) is deferrable to a follow-up PR if timeline is tight
- Do not modify existing test files beyond adding `roundDurationMinutes: 20` to any `EventRecord` fixtures
- Do not install new npm packages — use `motion` (already installed), native HTML5 DnD, and pointer events only
- All new CSS must use `var(--color-*)` design tokens
