# Feature Specification: Run Event UI Polish

**Feature Branch**: `043-run-event-ui-polish`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Three small UI improvements to the Run Event page and supporting components: collapse the page header panel into the court grid, replace the calendar event block moment label with a lifecycle status label, and fix the player stats court chart Y-axis to always show courts 1–7 with a larger chart size."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Event page has less wasted vertical space (Priority: P1)

An event host running a live padel event on a laptop wants to see as many courts as possible on screen at once. Currently the Run Event page has two stacked panels — a header panel with the round title and stepper, then a separate court grid panel below it — which wastes vertical space and forces scrolling on smaller screens.

After this change the round title and stepper appear at the top of the court grid panel, removing the gap between the two panels and the extra border chrome of the redundant header.

**Why this priority**: Directly reduces scrolling during an active event. The host needs to click results quickly; less vertical waste means faster access to all court cards.

**Independent Test**: Open the Run Event page for any in-progress event. Confirm one panel appears above the action buttons (the court grid panel) with the round title and optional stepper inside it — not as a separate panel above.

**Acceptance Scenarios**:

1. **Given** a running event with multiple rounds, **When** the host opens the Run Event page, **Then** the round title ("Run Event - Round N") appears inside the court grid panel, not in a separate panel above it.
2. **Given** a non-Mexicano event where a round stepper is shown, **When** the host views the Run Event page, **Then** the round stepper appears below the round title inside the court grid panel.
3. **Given** a Mexicano event where no stepper is shown, **When** the host views the Run Event page, **Then** only the round title appears at the top of the court grid panel with no empty stepper space.
4. **Given** the subtitle text "Submit each result to unlock the next round." that previously appeared in the header, **When** viewing the page after this change, **Then** that text is gone entirely — not moved elsewhere.

---

### User Story 2 - Calendar event blocks show lifecycle status (Priority: P2)

A user browsing the calendar wants to know at a glance whether an event is being planned, is currently running, or has already finished. Currently each event block shows a time-of-day moment label (e.g. "Wednesday Afternoon") which is redundant alongside the time-range label already shown on the same block.

After this change the moment slot shows "Planned", "Ongoing", or "Finished" based on the event's lifecycle state.

**Why this priority**: Status is more actionable information than a time-of-day label the user can already infer from the time range. Improves at-a-glance scanning of the calendar.

**Independent Test**: Open the calendar with events in all three states. Each event block should show the correct status label where the moment used to appear, while the time-range line below it is unchanged.

**Acceptance Scenarios**:

1. **Given** a Lobby (planned) event on the calendar, **When** the user views the event block, **Then** the moment slot reads "Planned".
2. **Given** a Running event on the calendar, **When** the user views the event block, **Then** the moment slot reads "Ongoing".
3. **Given** a Finished event on the calendar, **When** the user views the event block, **Then** the moment slot reads "Finished".
4. **Given** any event block, **When** the user views it, **Then** the time range (e.g. "10:00–12:00") still appears on the line below the status label, unchanged.

---

### User Story 3 - Player stats court chart has consistent Y-axis and is larger (Priority: P3)

A user reviewing player stats sees a court line chart showing which court the player was assigned to each round. Currently the Y-axis only goes as high as the player's highest court number, so two players look different even if their patterns are similar. The chart is also small and hard to read.

After this change the Y-axis always spans courts 1–7 and the chart is larger.

**Why this priority**: Consistency and readability improvement. Does not affect core event flow.

**Independent Test**: View the Player Stats page for a player whose highest court assignment is court 5. The Y-axis should still show ticks for courts 1 through 7.

**Acceptance Scenarios**:

1. **Given** a player whose highest court assignment is court 5, **When** the user views the court line chart, **Then** the Y-axis shows ticks for all seven courts 1 through 7.
2. **Given** any player with court data, **When** the user views the court chart, **Then** the chart is visibly wider and taller than its previous size.
3. **Given** a player with no court data, **When** the user views the court section, **Then** the chart does not render — no regression from current behaviour.

---

### Edge Cases

- What happens when a Mexicano event has no stepper and the round title is the only element in the round header? The round header renders cleanly with just the title and no empty space below it.
- What happens when an event has no status field (e.g. legacy or incomplete data)? The event block falls back to "Planned" as the safe default.
- What happens if a player has been on court 7 (the maximum)? Their data point plots at the top of the Y-axis correctly — the cap at 7 is intentional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Run Event page MUST NOT render a separate header panel section above the court grid panel.
- **FR-002**: The round title MUST appear at the top of the court grid panel.
- **FR-003**: The round stepper for non-Mexicano events MUST appear below the round title inside the court grid panel.
- **FR-004**: The subtitle "Submit each result to unlock the next round." MUST be removed from the page entirely and not appear anywhere else.
- **FR-005**: Each calendar event block MUST display a lifecycle status label ("Planned", "Ongoing", or "Finished") in the position previously occupied by the time-of-day moment label.
- **FR-006**: The status label mapping MUST be: Lobby state → "Planned", Running state → "Ongoing", Finished state → "Finished".
- **FR-007**: The time-range label on each calendar event block MUST remain unchanged.
- **FR-008**: The `formatEventMomentLabel` utility function MUST remain exported and its existing automated tests MUST continue to pass.
- **FR-009**: The player stats court chart Y-axis MUST always show integer ticks for courts 1 through 7, regardless of the player's actual court assignments.
- **FR-010**: The player stats court chart MUST be rendered at a larger size than its current dimensions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Run Event page renders with exactly one panel above the court action buttons (previously two) — confirmed by visual inspection.
- **SC-002**: On a 1280×800 viewport, the court grid cards are visible without vertical scrolling for events with up to 6 courts, where they previously required scrolling past the header panel.
- **SC-003**: All three lifecycle status labels ("Planned", "Ongoing", "Finished") display correctly on calendar event blocks and all existing automated tests pass with zero new failures.
- **SC-004**: The court chart Y-axis shows exactly 7 ticks (courts 1–7) for every player, confirmed by visual inspection and with no regressions in the test suite.
- **SC-005**: All existing frontend automated tests pass after all three changes are applied.

## Assumptions

- The maximum court count in this app is 7; the Y-axis cap at court 7 is intentional and correct.
- The `formatEventMomentLabel` export is retained solely for backward compatibility with existing tests; it is no longer called during calendar event block rendering after this change.
- This branch (043) is a prerequisite for branch 045-run-event-fullscreen, which references the round-header element introduced in FR-002.
