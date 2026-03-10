# Feature Specification: Calendar Scheduling

**Feature Branch**: `030-calendar-scheduling`
**Created**: 2026-03-10
**Status**: Draft
**Input**: A weekly/daily drag-and-drop calendar view for scheduling padel events — letting organisers see all events laid out across the week, drag to reschedule, drag on empty slots to create new events, and click to edit or delete.

## Clarifications

### Session 2026-03-10

- Q: Should the calendar be admin-only or visible to all players? → A: Admin-only, consistent with all other event management screens.
- Q: How is event duration determined if `round_duration_minutes` is not currently exposed in the API? → A: Derive total duration as `round_count × round_duration_minutes`; if either field is missing or zero, default to 60 minutes per event block.
- Q: Courts are integers — how should they appear on calendar blocks? → A: Show "Court X" labels using the integer values (e.g., "Court 1, Court 2").
- Q: Should recurring event support modify the backend schema? → A: No — recurrence is handled client-side. Each occurrence is a separate, fully independent event. No `recurrence_tag` or grouping is stored; once created the occurrences are unrelated.
- Q: How are recurring occurrences scoped? → A: The original event is occurrence 1. The system auto-creates additional Lobby slots for every remaining same-weekday in the current calendar month (starting from the following week). Occurrences are independent — editing or deleting one has no effect on the others. No "this and future" scope prompt is shown.
- Q: What happens to Running or Finished events — can they be rescheduled? → A: No. Running and Finished events are locked (non-draggable, non-resizable). They display a status badge. Only Lobby-status events may be moved or edited.
- Q: Should the edit/creation panel be a side drawer or a modal? → A: Side drawer — slides in from the right, keeping the calendar grid visible behind it for context.
- Q: Does `PATCH /api/v1/events/{id}` support partial updates (only sent fields updated, unset fields left unchanged)? → A: Yes — partial updates are supported. The frontend sends only the changed fields; unset fields are left unchanged on the backend.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Weekly Calendar View: See All Scheduled Events (Priority: P1)

As an organiser, I open the Calendar page and see all scheduled events laid out in a Monday-to-Sunday weekly grid. The time axis runs from 07:00 to 00:00 (next day) in 30-minute intervals. Each event appears as a coloured block at the correct day and start time, sized proportionally to its duration. I can navigate to the previous or next week using arrow buttons, and a "Today" button returns me to the current week.

**Why this priority**: This is the foundational view. Without it, no other calendar feature is meaningful. It also delivers immediate standalone value — organisers can see the full week at a glance without needing drag-and-drop.

**Independent Test**: Create 3 events with different dates, times, and durations spanning two different days in a week. Open the Calendar page. All 3 events must appear as blocks at the correct day columns and time rows. Navigate to the next week — the grid is empty. Navigate back — blocks reappear. Click "Today" from two weeks in the future — returns to the current week.

**Acceptance Scenarios**:

1. **Given** the Calendar page is opened, **When** the page renders, **Then** a 7-column grid (Mon–Sun) is shown with a time axis from 07:00 to 00:00 in 30-minute rows.
2. **Given** an event exists with `event_date` = today and `event_time` = 10:00 and a derived duration of 90 minutes, **When** the calendar renders, **Then** a block appears in today's column spanning from the 10:00 row to the 11:30 row.
3. **Given** multiple events exist on the same day at non-overlapping times, **When** the calendar renders, **Then** each event appears as a separate non-overlapping block in the correct time position.
4. **Given** the organiser clicks the "next week" arrow, **When** the calendar re-renders, **Then** the column headers update to the dates of the following week and only events in that week are shown.
5. **Given** the organiser is viewing a week two weeks in the future, **When** they click "Today", **Then** the calendar returns to the current week and the current day column is visually highlighted.
6. **Given** an event has no `event_time` set (time is null), **When** the calendar renders, **Then** the event is displayed in an "Unscheduled" section below the grid (not placed on the time axis).
7. **Given** a Running or Finished event exists this week, **When** the calendar renders, **Then** that event block displays a status badge ("Running" or "Finished") and appears visually distinct (e.g., muted/locked style).

---

### User Story 2 — Drag to Reschedule a Lobby Event (Priority: P1)

As an organiser, I drag an existing Lobby-status event block horizontally (left/right) to a different day, or vertically (up/down) to a new time slot (snapping to 30-minute intervals). When I drop it, the event's `event_date` and/or `event_time` are updated immediately (optimistic UI) and persisted to the backend. If the save fails, the event snaps back to its original position with an error toast.

**Why this priority**: Rescheduling by drag-and-drop is the core productivity win of a calendar. It must work alongside the view (P1) to justify building this feature at all.

**Independent Test**: Create a Lobby event scheduled for Monday 10:00. Drag it horizontally to Wednesday's column at the same vertical position — verify date changes to Wednesday, time stays 10:00. Drag it vertically downward to the 14:30 row — verify time changes to 14:30, date unchanged. Drag a Running event — verify it does not move (cursor shows not-allowed, no drop accepted).

**Acceptance Scenarios**:

1. **Given** a Lobby-status event block, **When** the organiser starts dragging it, **Then** the block becomes semi-transparent and a ghost/preview block follows the cursor, snapping to 30-minute grid positions.
2. **Given** the organiser drags a Lobby event vertically to a new time on the same day, **When** they drop it, **Then** the block moves to the new time slot immediately (optimistic) and `event_time` is updated via `PATCH /api/v1/events/{id}`.
3. **Given** the organiser drags a Lobby event horizontally from Monday's column to Thursday's column, **When** they drop it, **Then** the block moves to Thursday's column and `event_date` is updated.
4. **Given** a drag drop where the backend `PATCH` call returns an error, **When** the error is received, **Then** the event block snaps back to its original position and an error toast is displayed.
5. **Given** a Running or Finished event block, **When** the organiser attempts to drag it, **Then** the drag is rejected (block does not move, cursor shows not-allowed).
6. **Given** an event is dropped outside the 07:00–00:00 time range, **When** the drop lands below 07:00, **Then** the event snaps to 07:00 (earliest allowed slot); if above 00:00, it snaps to the last available slot.

---

### User Story 3 — Click Event Block to Edit or Delete (Priority: P1)

As an organiser, I click on a Lobby-status event block in the calendar. A side drawer slides in from the right showing the event's editable fields: name, event type, date, start time, duration, and courts. The calendar grid remains visible behind it. I can update any field and save. I can also delete the event with a confirmation step. Running/Finished events open the same drawer in read-only mode with no edit controls.

**Why this priority**: Edit and delete by click is necessary for basic calendar management. Drag-and-drop only handles time/day; all other properties need a dedicated edit surface.

**Independent Test**: Create a Lobby event. Click its block. Verify the edit panel opens with the correct current values. Change the event name and duration. Save. Verify the block updates in the calendar and the backend reflects the change. Click delete, confirm — verify the block disappears and the event is deleted. Click a Running event block — verify no edit controls are shown.

**Acceptance Scenarios**:

1. **Given** the organiser clicks a Lobby-status event block, **When** the edit panel opens, **Then** it displays the event name, type, date, start time, derived duration, and court list — pre-filled with current values.
2. **Given** the edit panel is open, **When** the organiser changes the start time and saves, **Then** the calendar block moves to the new time and the backend `event_time` field is updated.
3. **Given** the edit panel is open, **When** the organiser changes the duration, **Then** the calendar block height updates to reflect the new duration after save.
4. **Given** the edit panel is open, **When** the organiser clicks "Delete" and confirms in the confirmation dialog, **Then** the event block is removed from the calendar and the backend event is deleted.
5. **Given** the organiser clicks "Delete" but then cancels the confirmation dialog, **When** the dialog is dismissed, **Then** the event is NOT deleted and the panel remains open.
6. **Given** the organiser clicks a Running or Finished event block, **When** the panel opens, **Then** all fields are read-only and no Save or Delete buttons are visible.
7. **Given** the edit panel has unsaved changes, **When** the organiser closes the panel without saving, **Then** a "Discard changes?" confirmation prompt is shown before the panel closes.

---

### User Story 4 — Drag on Empty Slot to Create a New Event (Priority: P2)

As an organiser, I click and drag on an empty area in the calendar grid. A ghost block appears as I drag, showing the proposed start time and duration. When I release, a side drawer slides in from the right pre-filled with the date, start time, and a duration derived from my drag length (snapped to 30-minute increments, minimum 60 minutes). The calendar grid remains visible behind it. I complete the event details and confirm to create the event.

**Why this priority**: Drag-to-create is a power-user shortcut that makes scheduling feel natural. However, events can also be created through the existing event creation flow, so this is an enhancement rather than a core requirement.

**Independent Test**: In the calendar grid, click and drag from Tuesday 09:00 downward to 11:00. Release. Verify the creation panel opens with date = Tuesday, start time = 09:00, duration = 120 minutes pre-filled. Cancel the panel — no event is created. Repeat and confirm — verify event block appears.

**Acceptance Scenarios**:

1. **Given** the organiser starts dragging on an empty calendar cell, **When** they drag downward, **Then** a semi-transparent ghost block appears showing start time at drag origin and growing proportionally.
2. **Given** the organiser drags from 09:00 to 10:30 on Wednesday, **When** they release, **Then** the creation panel opens pre-filled with date = Wednesday, start time = 09:00, duration = 90 minutes.
3. **Given** the organiser drags less than 30 minutes, **When** they release, **Then** the creation panel opens with the minimum duration of 60 minutes.
4. **Given** the creation panel is open, **When** the organiser edits any pre-filled field and clicks "Create", **Then** the event is created via `POST /api/v1/events` and the new block appears in the calendar.
5. **Given** the creation panel is open, **When** the organiser clicks "Cancel", **Then** no event is created and the ghost block disappears.
6. **Given** the creation panel is open, **When** a required field (name, event type) is left empty and the organiser attempts to save, **Then** validation errors are displayed inline and the create action is blocked.

---

### User Story 5 — Recurring Events: Auto-Fill Remaining Month (Priority: P2)

As an organiser, I create an event and enable "Repeat weekly". The system automatically creates additional identical Lobby event slots for every remaining occurrence of the same weekday in the current calendar month — starting from the following week. Each created event is fully independent: I can move, edit, or delete any one of them without affecting the others.

**Why this priority**: Most padel clubs run regular weekly sessions on the same day and time. Auto-filling the rest of the month with one toggle click eliminates repetitive manual scheduling for the most common use case.

**Independent Test**: On March 10 (Monday), create a Lobby event at 10:00 and enable "Repeat weekly". The system should auto-create slots for March 17 and March 24 (the two remaining Mondays in March). Verify 2 new event blocks appear at 10:00 on those dates. Drag March 17's block to 11:00 — verify only that block moves; March 24 stays at 10:00. Delete March 24's block — verify only that block disappears; March 10 and March 17 are unaffected.

**Acceptance Scenarios**:

1. **Given** the creation panel is open for a Monday event, **When** the organiser enables "Repeat weekly" and clicks "Create", **Then** the system calls `POST /api/v1/events` once per remaining Monday in the current calendar month (starting next week) and all resulting blocks appear in the calendar.
2. **Given** "Repeat weekly" is enabled for an event created on the last weekday occurrence of the month, **When** the organiser creates the event, **Then** no additional occurrences are created (there are no remaining same-weekdays this month) and the organiser is informed via a brief notice.
3. **Given** multiple recurring occurrence blocks have been created, **When** the organiser drags one block to a new time, **Then** only that block moves; all other blocks remain in their original positions.
4. **Given** multiple recurring occurrence blocks exist, **When** the organiser deletes one via the edit panel, **Then** only that occurrence is deleted; all others remain.
5. **Given** multiple recurring occurrence blocks exist, **When** the organiser edits the name or duration of one, **Then** only that occurrence is updated; all others are unchanged.
6. **Given** a recurring occurrence creation would land on a date that already has an event at the same time, **When** the occurrences are created, **Then** all occurrences are created regardless; a non-blocking warning is shown listing the conflicting dates.

---

### User Story 6 — Daily Court View: See and Reassign Courts (Priority: P3)

As an organiser, I switch the calendar from weekly view to daily view. In daily view, each court (by number) is a row on the y-axis, and the time axis runs horizontally. Events are placed in the court row(s) they occupy. I can drag an event block horizontally to change its time, or vertically to reassign it to different courts.

**Why this priority**: Court-level scheduling is useful for larger venues but requires more data infrastructure (named courts, multi-court conflict detection). It is a distinct view mode that adds value but is not needed for the core scheduling MVP.

**Independent Test**: Switch to daily view for a day with 2 events on different courts. Verify each event appears in the correct court row. Drag an event block from Court 1 to Court 2 — verify the court assignment updates. Drag horizontally — verify the time updates.

**Acceptance Scenarios**:

1. **Given** the organiser clicks the "Day" view toggle, **When** the calendar switches to daily view, **Then** each court used by events that day appears as a labelled row (e.g., "Court 1", "Court 2") and events are placed in the corresponding row at the correct time position.
2. **Given** an event occupies courts [1, 2], **When** daily view renders, **Then** the event block spans both Court 1 and Court 2 rows.
3. **Given** a Lobby-status event in daily view, **When** the organiser drags it horizontally, **Then** the start time updates (30-minute snap) and the backend is updated.
4. **Given** a Lobby-status event in daily view, **When** the organiser drags it vertically from Court 1 to Court 3, **Then** the event's court list is updated to [3] and the backend is updated.
5. **Given** two events are dragged to the same court and overlapping time in daily view, **When** the drop occurs, **Then** a visual conflict indicator is shown on both overlapping blocks.

---

### Edge Cases

- Event with `event_time` = null: placed in an "Unscheduled" strip below the grid; dragging it onto the grid assigns a time; dragging it back removes the time.
- Event spanning midnight (e.g., 23:00 + 90 min duration): block is clipped at 00:00; remainder not shown (events past midnight are edge-case data and not supported in v1).
- Two events at the same time on the same day: blocks are rendered side-by-side (reduced width) rather than overlapping.
- "Repeat weekly" enabled on the last weekday occurrence of the month: zero additional occurrences are created; organiser sees a non-blocking notice.
- "Repeat weekly" where one or more auto-created dates conflict with an existing event at the same time: all occurrences are created regardless; a non-blocking warning lists the conflicting dates.
- Week navigation past year boundaries (e.g., Dec 28 → Jan 4): date headers correctly roll over to the new year.
- Backend returns an error on drag-drop `PATCH`: event snaps back to original position; error toast shown; no retry attempted automatically.
- Drag cancelled (Escape key or release outside grid): event snaps back to original position; no API call made.
- Calendar opened with no events at all: empty grid with helpful prompt ("No events this week — drag to schedule or use the + button").

---

## Requirements *(mandatory)*

### Functional Requirements

#### Weekly View

- **FR-001**: The Calendar page MUST display a weekly grid with 7 columns (Monday to Sunday) and a time axis from 07:00 to 00:00 (midnight) in 30-minute rows.
- **FR-002**: The Calendar page MUST show each event as a coloured block in the correct day column and time row, with block height proportional to event duration.
- **FR-003**: Event duration MUST be derived as `round_count × round_duration_minutes`; if either value is unavailable, the block MUST default to 60 minutes height.
- **FR-004**: The week view MUST include "previous week" and "next week" navigation controls and a "Today" button that returns to the current week.
- **FR-005**: The current day column MUST be visually highlighted (e.g., distinct background or border) to distinguish it from other columns.
- **FR-006**: Events with no `event_time` MUST be displayed in an "Unscheduled" section separate from the timed grid.
- **FR-007**: Running and Finished events MUST display a status badge on their calendar block and MUST be visually distinct from Lobby events (e.g., muted/locked style).
- **FR-007b**: The backend `GET /api/v1/events` endpoint MUST support `?from=YYYY-MM-DD&to=YYYY-MM-DD` query parameters to return only events within the given date range. The frontend MUST use these parameters when fetching events for each week view navigation.

#### Drag-to-Reschedule

- **FR-008**: Dragging a Lobby-status event block **vertically (up/down)** MUST move it to a new time slot, snapping to the nearest 30-minute interval.
- **FR-009**: Dragging a Lobby-status event block **horizontally (left/right)** MUST move it to a different day column.
- **FR-010**: A live preview ghost block MUST appear during drag showing the proposed new position and time label.
- **FR-011**: On drop, the UI MUST update optimistically immediately, then persist the new `event_date` and/or `event_time` via `PATCH /api/v1/events/{id}`.
- **FR-012**: If the backend `PATCH` call fails, the event block MUST revert to its pre-drag position and an error toast MUST be displayed.
- **FR-013**: Running and Finished event blocks MUST NOT be draggable (drag action must be rejected; cursor must show `not-allowed`).
- **FR-014**: Dropping an event outside the 07:00–00:00 bounds MUST clamp the time to the nearest boundary (07:00 minimum, 23:30 maximum start time).

#### Click-to-Edit

- **FR-015**: Clicking a Lobby event block MUST open a **side drawer** (sliding in from the right) pre-filled with: event name, event type, date, start time, duration, and court list. The calendar grid MUST remain visible behind the open drawer.
- **FR-016**: The side drawer MUST allow updating: event name, date, start time, duration (60/90/120/custom minutes), and court list.
- **FR-017**: Saving changes in the side drawer MUST persist updates via `PATCH /api/v1/events/{id}` and update the calendar block immediately.
- **FR-018**: The side drawer MUST include a "Delete" button that, after a confirmation dialog, deletes the event via `DELETE /api/v1/events/{id}` and removes the block from the calendar.
- **FR-019**: Clicking a Running or Finished event block MUST open the same side drawer in read-only mode; no Save or Delete controls MUST be present.
- **FR-020**: The side drawer MUST show a "Discard changes?" confirmation if the organiser attempts to close it with unsaved changes.

#### Drag-to-Create

- **FR-021**: Clicking and dragging on an empty calendar grid cell MUST initiate an event creation gesture, showing a ghost block growing from the drag origin.
- **FR-022**: On release, a **side drawer** MUST slide in from the right pre-filled with the date from the column, the start time from the drag origin (snapped to 30 minutes), and duration derived from drag length (minimum 60 minutes). The calendar grid MUST remain visible behind the open drawer.
- **FR-023**: The side drawer MUST require event name and event type before allowing submission.
- **FR-024**: Cancelling the side drawer MUST remove the ghost block and create no event.

#### Recurring Events

- **FR-025**: The creation panel MUST include an optional "Repeat weekly" toggle.
- **FR-026**: When "Repeat weekly" is enabled and the organiser creates the event, the system MUST automatically calculate the remaining occurrences of the same weekday in the current calendar month (from the week following the original event's date) and create one additional Lobby event per occurrence via individual `POST /api/v1/events` calls, each with the same time, duration, event type, and court list as the original.
- **FR-027**: If "Repeat weekly" is enabled but the original event falls on the last occurrence of that weekday in the current month, the system MUST create only the original event and display a non-blocking notice to the organiser.
- **FR-028**: Each occurrence created by "Repeat weekly" MUST be a fully independent event — no shared identifier, no linked state. Editing, moving, or deleting one occurrence MUST NOT affect any other occurrence.

#### Daily Court View

- **FR-029**: The Calendar MUST include a "Day" view toggle that switches to a single-day layout with courts on the y-axis and time on the x-axis.
- **FR-030**: In daily view, each unique court number used by any event on that day MUST appear as a labelled row (e.g., "Court 1").
- **FR-031**: In daily view, dragging a Lobby event block horizontally MUST update its `event_time`; dragging vertically MUST update its `selectedCourts` list — both persisted via `PATCH`.

### Key Entities

- **Calendar Block**: A visual representation of a scheduled event on the calendar grid. Has a position (day, start time), height (duration), colour (event type), and status indicator. Lobby blocks are interactive; Running/Finished blocks are locked.
- **Recurring Occurrence**: One of the auto-created Lobby events generated when "Repeat weekly" is enabled. Each occurrence is an independent event with no shared state or linkage to the others.
- **Unscheduled Event**: An event with `event_date` set but `event_time` = null. Displayed in a separate strip below the main grid, outside the timed area.
- **Ghost Block**: A semi-transparent placeholder shown during drag operations (drag-to-reschedule or drag-to-create), indicating where the event will land.
- **Edit/Create Side Drawer**: A panel that slides in from the right edge of the screen. Used for both creating new events (pre-filled from drag gesture) and editing existing Lobby events (pre-filled from current event data). The calendar grid remains visible behind it. Read-only variant opens for Running/Finished events with no Save or Delete controls.

## Assumptions

- **A1**: `round_duration_minutes` is stored in the backend but not yet exposed in the event API response. The spec assumes this field will be added to `GET /api/v1/events` and `GET /api/v1/events/{id}` responses as part of the implementation plan.
- **A2**: Courts are integers only (no user-defined names). All court labels are rendered as "Court N" by the frontend.
- **A3**: Recurrence is entirely frontend-computed. No recurrence metadata is stored in the backend — no `recurrence_tag` field, no grouping. When "Repeat weekly" is toggled, the frontend calculates the remaining same-weekday dates in the current month and fires individual `POST` calls. Each resulting event is a plain independent Lobby event.
- **A4**: The Calendar page is accessible to admin users only — it does not appear in the player-facing navigation.
- **A5**: Events spanning midnight are not supported in v1. Blocks are clipped at 00:00.
- **A6**: No new npm packages are allowed. Drag-and-drop must be implemented using native HTML5 drag-and-drop APIs or pointer events — no external DnD library.
- **A7**: `PATCH /api/v1/events/{id}` supports partial updates — only the fields included in the request body are updated; omitted fields are left unchanged. The frontend MUST send only the changed fields on drag-drop and drawer-save operations.

## Dependencies

- Existing `GET /api/v1/events` endpoint — **requires addition of `?from` / `?to` date-range filter parameters** (backend work required).
- Existing `POST /api/v1/events`, `PATCH /api/v1/events/{id}`, `DELETE /api/v1/events/{id}` endpoints.
- `round_duration_minutes` field exposure in the event API response (currently stored in DB but not returned — requires backend addition).
- Existing React Router navigation structure and admin-only route guard.
- Existing toast/notification system for error feedback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The weekly calendar view renders all events for the current week at the correct day and time position in 100% of tested scenarios with up to 20 events in a week.
- **SC-002**: Dragging a Lobby event to a new time slot updates the block position and persists the change to the backend within 2 seconds in 100% of tested drag operations.
- **SC-003**: Clicking a Lobby event block opens the side drawer with all fields pre-filled correctly in 100% of tested cases.
- **SC-004**: Enabling "Repeat weekly" on a Monday event created on March 10 results in exactly 2 additional backend events (March 17, March 24), each with the same time and configuration as the original, verified via API state after creation.
- **SC-005**: Running and Finished events are never moved by drag operations in 100% of tested cases (drag attempts are rejected).
- **SC-006**: All existing backend tests continue to pass with no regressions after backend changes (duration field exposure and `?from`/`?to` filter addition only — no schema change required for recurrence).
- **SC-007**: All existing frontend tests continue to pass with no regressions after calendar component additions.
- **SC-008**: New tests cover: weekly grid rendering, drag-reschedule optimistic update + revert on error, side drawer pre-fill, recurring occurrence auto-calculation (correct remaining-weekdays-in-month logic), independent occurrence editing, and locked-event drag rejection.
