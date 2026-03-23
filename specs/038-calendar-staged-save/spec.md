# Feature Specification: Calendar Reliability, Naming, and Day-Court Workflow

**Feature Branch**: `038-calendar-staged-save`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "Calendar reliability, staged save workflow, simplified blocks, naming rules, redo reset, and day-court view"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stage and Save Calendar Changes (Priority: P1)

As an admin host, I can make multiple calendar changes quickly and save them in one action so scheduling stays fast and reliable.

**Why this priority**: This addresses both performance concerns and data reliability for the primary calendar workflow.

**Independent Test**: Perform move, resize, template-create, and modal-edit changes; verify unsaved indicator appears, then click Save Changes and confirm backend data matches the staged state.

**Acceptance Scenarios**:

1. **Given** a user edits events in calendar, **When** at least one change exists, **Then** a Save Changes action appears in the calendar header area.
2. **Given** staged edits exist, **When** Save Changes succeeds, **Then** the unsaved indicator clears and persisted calendar data matches the edited state.
3. **Given** staged edits exist, **When** saving fails, **Then** staged edits remain visible and the user sees clear retry feedback.
4. **Given** staged edits exist, **When** user attempts to navigate away, **Then** a confirmation warning is shown before losing unsaved changes.

---

### User Story 2 - Refined Calendar Interaction Modes and Editing (Priority: P2)

As an admin host, I can clearly distinguish move, resize, and edit-name interactions so event editing feels precise and predictable.

**Why this priority**: Mode clarity prevents accidental changes and improves confidence during dense scheduling sessions.

**Independent Test**: Verify body hover indicates move, bottom 4px indicates resize, and name hover indicates clickable edit; open modal edit from name click without leaving calendar.

**Acceptance Scenarios**:

1. **Given** an event card is hovered on body area, **When** user drags, **Then** the event moves and duration remains unchanged.
2. **Given** an event card is hovered in bottom 4px, **When** user drags, **Then** duration changes in 30-minute steps and remains one of 60, 90, or 120 minutes.
3. **Given** event name area is hovered, **When** user hovers name text, **Then** text is underlined and cursor indicates click-to-edit.
4. **Given** user clicks event name, **When** edit overlay opens, **Then** user can edit setup fields in a modal and return directly to calendar without route redirect.
5. **Given** an event has duration 90 or 120, **When** it is dragged, **Then** the drag preview height matches the actual duration footprint.
6. **Given** an event card is rendered, **When** card content is shown, **Then** no inline duration dropdown is shown inside event cards.
7. **Given** event duration is 60 minutes, **When** card is rendered, **Then** card displays event name and event type only.
8. **Given** event duration is 90 minutes, **When** card is rendered, **Then** card displays event name, event type, and time range.
9. **Given** event duration is 120 minutes, **When** card is rendered, **Then** card displays event name, event type, time range, and duration label.

---

### User Story 3 - Event Administration and Visual Clarity (Priority: P3)

As an admin host, I can reset all events from account settings and quickly interpret event types and schedule density from color and layout.

**Why this priority**: Administrative control and visual clarity improve maintainability and day-to-day operational usage.

**Independent Test**: Use Account Settings Event Management to remove all events with confirmation; verify calendar shows consistent type colors, subtle interaction highlight style, and wider laptop-optimized layout.

**Acceptance Scenarios**:

1. **Given** user is in Account Settings, **When** user selects Remove All Events and confirms, **Then** all events are removed and views refresh accordingly.
2. **Given** event templates and calendar events are shown, **When** user views them, **Then** each event type uses consistent color mapping across templates and scheduled slots.
3. **Given** user hovers navigation and event surfaces, **When** hover/focus feedback appears, **Then** style uses subtle edge emphasis rather than heavy glow.
4. **Given** user opens calendar on common laptop widths, **When** layout renders, **Then** calendar uses wider space while remaining readable and stable.
5. **Given** calendar has unsaved staged edits, **When** user clicks Redo Changes, **Then** all staged edits reset to last saved server state for that week.

---

### User Story 4 - Day-to-Court Detail View (Priority: P2)

As an admin host, I can click a weekday header and inspect one-day court occupancy lanes so I can reason about simultaneous bookings clearly.

**Why this priority**: Weekly view is good for recurring patterns but court-level conflicts need a dedicated day-court lane view.

**Independent Test**: Click weekday header, confirm day-court view opens with court lanes, multi-court highlighting, and planned-without-courts dotted rendering.

**Acceptance Scenarios**:

1. **Given** the weekly header row is visible, **When** user clicks a day header, **Then** the calendar switches to single-day court-lane view.
2. **Given** day-court view is open, **When** header renders, **Then** top-left header area shows selected day/date context.
3. **Given** an event has selected courts, **When** rendered in day-court view, **Then** it occupies only those court lanes for its time range.
4. **Given** an event has no selected courts, **When** rendered in day-court view, **Then** it spans all court lanes and uses dotted-border styling.
5. **Given** an event occupies multiple court lanes, **When** one segment is hovered, **Then** all segments for that event are highlighted together.
6. **Given** day-court view is open, **When** user attempts per-lane drag/resize edits, **Then** lane-splitting edits are not permitted in that view.

---

### Edge Cases

- How does staged-save handle mixed operations on the same event (move + resize + modal edit) before save?
- What happens if some events save successfully and others fail during Save Changes?
- What happens when user triggers Remove All Events while unsaved calendar edits are pending?
- How are legacy events normalized when required duration/type metadata is missing or inconsistent?
- What happens if user attempts to resize below minimum or above maximum duration repeatedly?
- How should day-court view choose fallback court lanes when no events have explicit courts in the selected week?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system must provide an Event Management section under Account Settings.
- **FR-002**: Event Management must include a Remove All Events action with explicit confirmation.
- **FR-003**: Calendar edits (move, resize, template-create, modal edit) must update staged local state immediately.
- **FR-004**: Calendar must show Save Changes control in header when staged edits exist, and hide it when no edits are pending.
- **FR-005**: Save Changes must persist all pending staged edits to backend event data.
- **FR-006**: If save fails, staged edits must remain and user must receive actionable retry feedback.
- **FR-007**: Navigating away with unsaved calendar edits must prompt user confirmation.
- **FR-008**: Calendar interaction must support three distinct modes: move (body), resize (bottom 4px), and edit (name area click).
- **FR-009**: Resize behavior must use 30-minute granularity and enforce durations of 60, 90, or 120 minutes.
- **FR-010**: Drag preview height must match event duration footprint.
- **FR-011**: Event-name hover must show explicit click-to-edit affordance and clicking must open in-place edit modal overlay.
- **FR-012**: Edit modal must allow event setup editing and closing without route redirect away from calendar.
- **FR-013**: Existing and legacy events must be normalized so old records behave consistently with newly created events.
- **FR-014**: Event type colors must be consistent between template items and scheduled event slots.
- **FR-015**: Interaction highlighting for calendar controls and events must use subtle edge emphasis consistent with established app interaction style.
- **FR-016**: Calendar layout must be widened and optimized for laptop usage while remaining responsive.
- **FR-017**: Team Mexicano must remain represented as Mexicano type with team flag semantics.
- **FR-018**: New template-created event names must follow `<Weekday> <TimeCategory> <EventTypeLabel>` and must not include `(New)`.
- **FR-019**: Event cards must not use `interactive-surface` glare behavior; hover/focus edge emphasis must use event-type accent color.
- **FR-020**: Calendar header must include a Redo Changes action that resets all unsaved staged edits to last saved server state.
- **FR-021**: Save Changes and Redo Changes controls must match week-navigation button sizing.
- **FR-022**: Weekly day headers must be clickable and open a single-day court-lane view.
- **FR-023**: Day-court view must render time vertically and courts horizontally with a selected day/date header context.
- **FR-024**: Day-court view must render unspecified-court events as all-lane occupancy with dotted border.
- **FR-025**: Multi-court events in day-court view must highlight all linked segments on hover.
- **FR-026**: Day-court view must not allow independent per-lane drag/resize operations.

### Key Entities *(include if feature involves data)*

- **Staged Calendar Change Set**: The pending local edits collection for create/move/resize/update operations that are not yet persisted.
- **Calendar Event (Normalized)**: Calendar event data standardized across old and new records for interaction and rendering.
- **Save Session State**: UI state that tracks dirty status, save progress, save success/failure, and retry behavior.
- **Event Management Action**: Administrative bulk deletion command requiring explicit confirmation.
- **Event Type Color Mapping**: A consistent visual mapping between event type and card/template presentation.
- **Day Court-Lane Segment**: One rendered occupancy slice of an event in a specific court lane for the selected day.
- **Calendar View Mode**: Weekly mode or day-court mode with selected-date context.

## Assumptions

- Save Changes persists pending edits in a single user-triggered save flow rather than per-interaction auto-save.
- Remove All Events applies to all events visible to the admin scope in the current system.
- Modal-based event editing reuses existing editing capabilities and writes into staged state before save.
- Laptop-first responsive targets include typical widths from 1280 to 1920 pixels.
- Default fallback court lanes in day-court view are courts 1-8 if no explicit court assignments are available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of staged calendar edits remain visible until explicit save or discard.
- **SC-002**: In acceptance testing, 100% of successful Save Changes operations clear dirty state and persist all staged edits correctly.
- **SC-003**: In validation scenarios, at least 95% of users complete multi-edit scheduling sessions without perceivable interruption from save workflow.
- **SC-004**: In acceptance testing, 100% of resize interactions maintain valid duration bounds and matching preview/event height.
- **SC-005**: In acceptance testing, 100% of name-click edit interactions open modal overlay and return user to calendar context without route change.
- **SC-006**: In acceptance testing, 100% of event type displays use consistent color mapping across templates and scheduled events.
- **SC-007**: In acceptance testing, Remove All Events always requires confirmation and fully clears event lists upon confirmation.
- **SC-008**: In acceptance testing, 100% of template-created events use generated names without `(New)` and match weekday/time-category/type format.
- **SC-009**: In acceptance testing, 100% of unsaved staged edits are reverted by Redo Changes and dirty state clears.
- **SC-010**: In acceptance testing, clicking any weekly day header opens day-court view in under 1 second and reflects court occupancy correctly.
