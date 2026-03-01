# Feature Specification: Event Player Logic and Summary Icon/Alignment Update

**Feature Branch**: `012-event-player-logic`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "Add event player logic updates: courts label, exact players equals courts times four requirement, assigned counter display, today's date helper below schedule row, crown-color icon usage, and summary name/crown alignment."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Enforce Court-Based Player Capacity (Priority: P1)

As an event host, I want the create-event form to require exactly four players per selected court so event setup is valid before run-time.

**Why this priority**: Invalid player/court combinations break or confuse event creation and are the highest-impact setup issue.

**Independent Test**: In `/events/create`, select courts and verify Create Event remains disabled until assigned player count equals `selected courts * 4`.

**Acceptance Scenarios**:

1. **Given** one selected court, **When** fewer than four players are assigned, **Then** Create Event is disabled.
2. **Given** five selected courts, **When** exactly twenty players are assigned, **Then** Create Event is enabled.
3. **Given** selected courts change, **When** required count changes, **Then** assigned counter and submit eligibility update immediately.

---

### User Story 2 - Improve Create-Event Clarity and Date Shortcut (Priority: P2)

As an event host, I want the form sections to clearly communicate court selection and assigned-player progress, and provide a quick "Today's date" action.

**Why this priority**: Clear cues reduce setup friction and mistakes during event creation.

**Independent Test**: In `/events/create`, verify a visible "Courts" label, assigned progress text (`assigned / required`), and a clickable "Today's date" text below schedule controls.

**Acceptance Scenarios**:

1. **Given** the create-event page, **When** the court selector is shown, **Then** a visible "Courts" label is displayed.
2. **Given** assigned players section, **When** players are added or removed, **Then** the right-aligned counter updates as `X / Y`.
3. **Given** date is unset or outdated, **When** host clicks "Today's date", **Then** date field is set to today and time remains unchanged.

---

### User Story 3 - Improve Summary Winner Visual Presentation (Priority: P3)

As an event host, I want winner icon and player-name alignment in summary to be visually clear so standings are easy to scan.

**Why this priority**: Better summary readability improves confidence when announcing winners.

**Independent Test**: In final summary, verify winner icon uses the colored crown asset, names are left-aligned, and icon is flush right within the same name cell.

**Acceptance Scenarios**:

1. **Given** final summary row with crowned player, **When** row renders, **Then** crown icon uses `crown-color` asset and fallback remains available if image fails.
2. **Given** summary table rows, **When** rendered, **Then** rank column remains centered while player names are left-aligned with emblem on right.

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- When zero courts are selected, required player count is `0` but submit remains disabled due to missing court selection.
- When assigned players exceed required count, submit remains disabled until exact match is restored.
- When host clicks "Today's date" repeatedly, date is idempotently set without changing selected time.
- When crown icon file is missing or blocked, summary falls back to visible fallback marker and does not break row layout.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST compute required player count as `selected court count * 4` on create-event page.
- **FR-002**: System MUST disable event creation unless assigned players exactly equal required player count.
- **FR-003**: System MUST display assigned player progress as `assigned / required` in the assigned section header, aligned to the right of "Assigned".
- **FR-004**: System MUST display a visible "Courts" label above court selection controls.
- **FR-005**: System MUST provide a clickable "Today's date" text control below schedule row to set date to current day.
- **FR-006**: System MUST preserve manually selected event time when "Today's date" is used.
- **FR-007**: System MUST render winner icon using colored crown asset path.
- **FR-008**: System MUST keep rank values visually centered while player names are left-aligned and winner emblem is aligned at far right within the name cell.
- **FR-009**: System MUST retain crown fallback marker behavior when icon fails to load.
- **FR-010**: System MUST include automated frontend tests covering create-event validation rules and crown asset path usage.

### Key Entities *(include if feature involves data)*

- **Required Player Count**: Derived value equal to selected courts multiplied by four; drives submit eligibility and counter text.
- **Assigned Player Progress**: UI representation of assigned players versus required players in create-event setup.
- **Summary Winner Icon Display**: Name-cell rendering behavior that combines player label and winner emblem alignment rules.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: In 100% of tested create-event scenarios, submit remains disabled unless assigned players equal `courts * 4`.
- **SC-002**: In 100% of tested create-event renders, "Courts" label and `assigned / required` counter are visible and update correctly.
- **SC-003**: In 100% of tested date shortcut scenarios, "Today's date" updates date only and does not modify existing time value.
- **SC-004**: In 100% of final-summary rendering tests, winner icon source is colored crown and name-cell alignment remains left-name/right-emblem with centered rank column.
