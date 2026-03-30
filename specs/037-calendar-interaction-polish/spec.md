# Feature Specification: Calendar Interaction Polish + Event Template Drag-Create

**Feature Branch**: `037-calendar-interaction-polish`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "Calendar interaction polish + event template drag-create"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move and Resize Modes on Events (Priority: P1)

As an admin host scheduling events in Calendar, I can clearly move events from the event body and resize events from a dedicated bottom-edge handle so that scheduling actions are predictable and fast.

**Why this priority**: Clear interaction modes are required for core calendar usability and prevent accidental scheduling errors.

**Independent Test**: Open Calendar, drag an existing event from its body to a different slot, then resize it from the bottom edge and confirm both actions behave independently.

**Acceptance Scenarios**:

1. **Given** an event is shown in Calendar, **When** the user hovers the event body, **Then** the event indicates move mode and can be dragged to a new slot with landing preview.
2. **Given** an event is shown in Calendar, **When** the user hovers the bottom 4px of the event, **Then** the cursor indicates vertical resize mode and dragging changes only the event duration.
3. **Given** the user starts resizing from the bottom edge, **When** the pointer moves, **Then** duration updates in 30-minute steps and is constrained to 60, 90, or 120 minutes.
4. **Given** the user starts dragging from the event body, **When** the event is dropped, **Then** date/time updates and duration remains unchanged.

---

### User Story 2 - Drag Event Templates into Calendar (Priority: P2)

As an admin host, I can drag event type templates from a side menu into the calendar grid to quickly create empty event slots.

**Why this priority**: Template drag-create greatly speeds planning and mirrors expected scheduler behavior.

**Independent Test**: Open Calendar, drag each template type into a grid slot, and verify a new event appears at the target date/time with correct defaults.

**Acceptance Scenarios**:

1. **Given** the template panel is visible, **When** the user drags a template to a valid day/time slot, **Then** a new event is created in that slot.
2. **Given** a new event is created from template drop, **When** it appears on the grid, **Then** it has a default duration of 90 minutes and an editable placeholder event name.
3. **Given** the Team Mexicano template is dropped, **When** the event is created, **Then** it is represented as Mexicano with Team Mexicano flag behavior and shows Team Mexicano label.
4. **Given** a template-created event exists, **When** the user interacts with it, **Then** it supports both move mode and resize mode like existing events.

---

### User Story 3 - Polish Interaction Feedback (Priority: P3)

As an admin host, I get clear visual feedback during hover and drag actions so that calendar controls feel consistent with the rest of the application.

**Why this priority**: Consistent interaction feedback improves confidence and reduces mis-clicks in high-frequency scheduling tasks.

**Independent Test**: Verify event cards show interactive glare on hover/focus, and drag landing previews remain visible during move operations.

**Acceptance Scenarios**:

1. **Given** an event card is hoverable/focusable, **When** the user hovers or focuses it, **Then** the card shows interactive glare feedback consistent with existing interactive surfaces.
2. **Given** an event is being dragged, **When** the pointer moves over valid slots, **Then** the landing preview remains visible and accurately reflects the intended drop position.

---

### Edge Cases

- What happens when the user starts dragging near the bottom-edge boundary between move and resize zones?
- How does the system handle resize attempts that would produce durations below 60 or above 120 minutes?
- What happens when a template is dropped outside a valid calendar slot?
- How does the system behave when creating multiple template events in quick succession?
- What happens when a newly created event has no custom title set yet and must still be distinguishable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Calendar must support two distinct event interaction modes: move mode from event body and resize mode from the bottom 4px zone.
- **FR-002**: Move mode must allow dragging events to a new valid day/time slot while preserving event duration.
- **FR-003**: Resize mode must allow changing duration only, in 30-minute increments.
- **FR-004**: Duration values must always resolve to one of 60, 90, or 120 minutes.
- **FR-005**: Resizing must update both event duration state and visual event height/time-range feedback immediately.
- **FR-006**: Move and resize interactions must be mutually exclusive during a single pointer gesture.
- **FR-007**: Calendar must retain visible landing preview feedback while dragging events.
- **FR-008**: Calendar must include a left-side draggable template menu for Americano, Mexicano, Team Mexicano, WinnersCourt, and RankedBox.
- **FR-009**: Dropping a template onto a valid slot must create a new empty event at that slot with default duration 90 minutes.
- **FR-010**: Template-created events must include a safe placeholder name and remain editable after creation.
- **FR-011**: Team Mexicano template creation must be represented as Mexicano with Team Mexicano flag semantics.
- **FR-012**: Event cards must show interactive glare feedback on hover/focus consistent with the app's existing interactive style language.
- **FR-013**: Calendar route access behavior and main menu navigation must remain unchanged.
- **FR-014**: This iteration must keep local-state behavior and exclude full backend persistence model changes.
- **FR-015**: Existing or obsolete calendar placeholder assumptions in tests must be replaced with behavior-based tests for the new interactions.

### Key Entities *(include if feature involves data)*

- **Calendar Event (Local State)**: A calendar-rendered event with type, date, start time, duration, display label/name, and optional Team Mexicano flag.
- **Template Event Type**: A draggable template definition used to create a new calendar event at drop time.
- **Interaction Mode**: A pointer-state context that determines whether a gesture is interpreted as move or resize.
- **Resize Zone**: The bottom 4px interaction area on an event card used to initiate duration changes.

## Assumptions

- A 90-minute duration is the default for all template-created events.
- Template-created events are immediately movable and resizable without extra setup.
- Template drops outside valid slots are ignored with no invalid event created.
- The current calendar remains usable with local in-memory updates in this phase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of attempted move gestures from event body result in correct date/time updates without unintended duration changes.
- **SC-002**: In acceptance testing, 100% of resize gestures from the bottom-edge zone update duration in valid 30-minute steps and remain within 60/90/120.
- **SC-003**: In acceptance testing, at least 95% of users can correctly trigger resize mode on first attempt using the bottom-edge affordance.
- **SC-004**: In acceptance testing, 100% of template drops into valid slots create a new event with correct type mapping, date/time placement, placeholder name, and 90-minute default duration.
- **SC-005**: In UX review, event cards consistently show interactive glare/hover feedback and visible landing preview during drag across all supported calendar interactions.
