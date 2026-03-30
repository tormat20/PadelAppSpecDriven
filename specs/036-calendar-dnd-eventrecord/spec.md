# Feature Specification: Calendar Drag-and-Drop POC using EventRecord

**Feature Branch**: `036-calendar-dnd-eventrecord`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "Calendar Drag-and-Drop POC using EventRecord model"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schedule events directly on weekly calendar (Priority: P1)

As an admin host, I can open Calendar and drag an event to a different day/time so I can quickly schedule and reschedule events without leaving the calendar view.

**Why this priority**: The core value of this feature is direct weekly scheduling from Calendar. Without this, the POC does not demonstrate drag-and-drop value.

**Independent Test**: Can be fully tested by opening Calendar, dragging one event block to a new slot, and verifying the event's date and start time update in the displayed calendar state.

**Acceptance Scenarios**:

1. **Given** the user is on Calendar with scheduled events visible, **When** the user drags an event block to a new valid day/time slot, **Then** the event appears in the new slot and no longer appears in the original slot.
2. **Given** the user drags an event block, **When** the drop completes, **Then** the event state reflects the updated calendar date and start time for that week.

---

### User Story 2 - Keep event semantics aligned to EventRecord (Priority: P2)

As an admin host, I can see calendar items represented as events (not generic activities), including event type labels used across the app.

**Why this priority**: Consistent event semantics reduce confusion and make the POC usable as a foundation for full integration.

**Independent Test**: Can be fully tested by loading Calendar and confirming event cards show event names and supported event type labels.

**Acceptance Scenarios**:

1. **Given** Calendar is loaded, **When** event cards are rendered, **Then** each card shows the event name and one of the supported event types: Americano, Mexicano, Team Mexicano, WinnersCourt, or RankedBox.
2. **Given** an event is moved to another slot, **When** it re-renders, **Then** its event type remains unchanged.

---

### User Story 3 - Update and constrain duration in calendar state (Priority: P3)

As an admin host, I can change event duration in Calendar and have that change reflected in the event state using allowed durations.

**Why this priority**: Duration is critical to realistic scheduling and must stay within approved options for this POC.

**Independent Test**: Can be fully tested by changing a calendar event duration and verifying the updated event state uses only 60, 90, or 120 minutes.

**Acceptance Scenarios**:

1. **Given** an event on Calendar, **When** the user changes its duration, **Then** the event duration updates and remains one of 60, 90, or 120 minutes.
2. **Given** an unsupported duration input is attempted, **When** the change is applied, **Then** the event duration is normalized to the nearest allowed value and remains valid.

---

### Edge Cases

- Dragging an event outside valid calendar bounds must not produce an invalid scheduled time.
- Dropping an event into a slot that cannot be represented in the calendar time format must resolve to the nearest valid slot.
- Events without a scheduled start time must still be visible in Calendar context and be schedulable.
- If multiple events are present in nearby slots, dragging one event must only update the dragged event.
- If the user navigates away and back during POC phase, the view can reset to last loaded state without implying persistence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Calendar route must display a functional weekly drag-and-drop scheduling view instead of a placeholder.
- **FR-002**: The scheduling view must operate on event objects aligned with EventRecord semantics, not generic activity objects.
- **FR-003**: The system must map calendar position changes to event scheduling fields such that day changes update `eventDate` and time-slot changes update `eventTime24h` in calendar state.
- **FR-004**: The system must initialize Calendar state from loaded events and apply drag-and-drop updates in local in-memory state for the POC.
- **FR-005**: Event cards must display event name, event type, scheduled time range, and current duration.
- **FR-006**: The system must support event type labels in Calendar for Americano, Mexicano, Team Mexicano, WinnersCourt, and RankedBox.
- **FR-007**: The system must allow duration updates and constrain resulting duration to allowed values: 60, 90, or 120 minutes.
- **FR-008**: Duration changes must immediately update the corresponding event in calendar state.
- **FR-009**: Calendar integration must preserve existing menu access and route access behavior for `/calendar`.
- **FR-010**: The feature must exclude full backend write persistence in this phase while clearly keeping behavior ready for a persistence follow-up.
- **FR-011**: Existing obsolete placeholder-only Calendar behavior and tests must be removed or replaced with behavior-based coverage for the new POC.
- **FR-012**: The Calendar presentation must remain visually consistent with the application's established theme and interaction language.

### Key Entities *(include if feature involves data)*

- **Calendar Event Record**: A schedulable event used by the Calendar view containing event identity, name, event type, scheduled date, scheduled start time, and duration.
- **Weekly Calendar Slot**: A day/time position in the visible week that can be translated to a valid event date and time value.
- **Duration Option**: An allowed scheduling duration value constrained to 60, 90, or 120 minutes.

## Assumptions

- Team Mexicano is represented in calendar behavior as an event variant of Mexicano with a distinct user-facing label "Team Mexicano."
- For this POC, schedule and duration edits are expected to remain in local session state and are not required to survive refresh/navigation.
- Calendar remains admin-scoped under existing route guard behavior.

## Dependencies

- Existing event listing data must be available to populate the weekly calendar view.
- Existing route and main menu wiring for `/calendar` remain in place.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of users who can access Calendar can open `/calendar` and view at least one interactive event block when events exist in the selected week.
- **SC-002**: In validation scenarios, at least 95% of drag-and-drop moves place events into the intended day/time slot on first attempt.
- **SC-003**: In validation scenarios, 100% of duration updates result in a valid duration value (60, 90, or 120 minutes).
- **SC-004**: In acceptance tests, 100% of calendar event cards show the required information (name, event type, time range, duration).
- **SC-005**: At least 90% of pilot users report the Calendar POC as "usable for scheduling experiments" without additional guidance.
