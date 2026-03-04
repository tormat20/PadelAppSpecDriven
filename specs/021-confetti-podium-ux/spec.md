# Feature Specification: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Feature Branch**: `021-confetti-podium-ux`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "confetti celebration on final summary entry, winner podium for Mexicano/WinnersCourt, event creation UX polish (mode label, date label, Today button placement, inline roster validation)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confetti Burst on Final Summary Entry (Priority: P1)

When a host navigates to the final summary page of a completed event, a confetti burst animation plays automatically. Ten bursts fire from random screen positions, one every 0.1 seconds, completing the full sequence in 1 second total. The animation plays once and does not repeat or loop.

**Why this priority**: This is the centerpiece celebration moment — it delivers immediate delight and is fully self-contained with no dependencies on other stories.

**Independent Test**: Navigate to a completed event's summary page. Verify 10 confetti bursts fire automatically over ~1 second from randomised positions. Navigate to an in-progress event summary — no confetti fires.

**Acceptance Scenarios**:

1. **Given** a completed event with a final summary, **When** the final summary page first loads, **Then** 10 confetti bursts fire from 10 randomised screen positions at 0.1-second intervals (total ~1 second).
2. **Given** the confetti sequence has completed, **When** the user stays on the page, **Then** no further confetti fires — the animation plays exactly once per visit.
3. **Given** an in-progress event, **When** the summary page loads, **Then** no confetti fires.

---

### User Story 2 - Winner Podium on Final Summary (Priority: P2)

When viewing the final summary of a Mexicano or Winners Court event, a podium display appears above the results table showcasing the top 3 finishers. For Mexicano: 1 player per position. For Winners Court: 2 players per position. Beat the Box has no podium.

**Why this priority**: The podium is a high-visibility social moment that adds ceremony to the result and is visible before the full table.

**Independent Test**: Complete a Mexicano event → final summary shows 3-position podium (1/1/1) above the table. Complete a Winners Court event → podium shows 3 positions (2/2/2). Complete a Beat the Box event → no podium.

**Acceptance Scenarios**:

1. **Given** a final Mexicano summary, **When** the page loads, **Then** a 3-position podium appears above the results table: center = 1st place (rank 1), left = 2nd place (rank 2), right = 3rd place (rank 3), each with one player name.
2. **Given** a final Winners Court summary, **When** the page loads, **Then** the same 3-position podium shows two player names per position: ranks 1–2 share 1st, ranks 3–4 share 2nd, ranks 5–6 share 3rd.
3. **Given** a final Beat the Box summary, **When** the page loads, **Then** no podium is rendered.
4. **Given** a final summary with fewer players than slots require, **When** the page loads, **Then** only filled podium positions are shown; empty slots are hidden.

---

### User Story 3 - Inline Roster Validation in the Roster Step (Priority: P2)

On the Roster step of event creation, inline orange hints appear in real time: "Choose courts" near the courts selector (disappears when courts are selected), and "Assign players" near the player assignment area (disappears when player count matches requirement).

**Why this priority**: Currently validation only fires on the Confirm step — earlier inline feedback prevents wasted navigation.

**Independent Test**: Go to Events → Create → Roster step with 0 courts and 0 players. Verify "Choose courts" hint visible. Select 1 court — hint gone, "Assign players" visible. Assign 4 players — both hints gone.

**Acceptance Scenarios**:

1. **Given** the Roster step with zero courts selected, **When** the step renders, **Then** an orange inline hint "Choose courts" is displayed near the Courts selector.
2. **Given** at least one court is selected, **When** the court count changes to ≥1, **Then** the "Choose courts" hint disappears immediately.
3. **Given** courts are selected but players are insufficient, **When** the step renders, **Then** an orange inline hint "Assign players" appears near the player assignment area.
4. **Given** the correct number of players is assigned, **When** the count matches courts × 4, **Then** the "Assign players" hint disappears immediately.

---

### User Story 4 - Event Setup Labels for Mode and Date (Priority: P3)

On the Setup step of event creation, a short descriptive label appears above the mode selector ("Choose mode") and above the date/time inputs ("Choose date and time").

**Why this priority**: Low-effort polish improving first-time comprehension.

**Independent Test**: Navigate to Events → Create. On Setup step, verify labels "Choose mode" and "Choose date and time" appear above their respective controls.

**Acceptance Scenarios**:

1. **Given** the Create Event Setup step, **When** the user views the screen, **Then** a short label "Choose mode" appears directly above the mode selector options.
2. **Given** the Create Event Setup step, **When** the user views the screen, **Then** a short label "Choose date and time" appears directly above the date and time inputs.

---

### User Story 5 - "Today's Date" Button Repositioned and Recoloured (Priority: P3)

The "Today's date" shortcut button moves to appear above the date input field (not below it), and its colour changes to match the existing past-schedule warning colour (orange).

**Why this priority**: Small logical UX fix — the shortcut should lead the field visually.

**Independent Test**: Navigate to Events → Create Setup step. "Today's date" button is above the date field and uses the same orange colour as the "This event is scheduled in the past" warning. Clicking it still sets today's date.

**Acceptance Scenarios**:

1. **Given** the Create Event Setup step, **When** the user views the date section, **Then** the "Today's date" button appears above the date input, not below it.
2. **Given** the "Today's date" button, **When** the user views it, **Then** its colour matches the existing past-schedule warning text colour.
3. **Given** the user clicks "Today's date", **Then** the date input is set to today's date (existing behaviour preserved).

---

### Edge Cases

- What happens when the confetti library fails to load? The summary must still render — confetti is progressive enhancement only.
- What happens if a final summary has 0 ranked players? No podium is rendered.
- What happens if a Mexicano event has fewer than 3 players? Only filled podium positions are shown.
- What happens if a Winners Court event has fewer than 6 ranked players? Only slots with available players are shown.
- What happens if courts are deselected after players were assigned? The "Assign players" hint reappears if the required count changes.

## Requirements *(mandatory)*

### Functional Requirements

**Confetti:**

- **FR-001**: The final summary page MUST automatically trigger a confetti animation on first mount, only when the event summary is in final (completed) mode.
- **FR-002**: The confetti animation MUST consist of exactly 10 bursts, each from a unique randomised screen position.
- **FR-003**: Each burst MUST be separated by 0.1 seconds, completing the full sequence in approximately 1 second.
- **FR-004**: The confetti animation MUST play exactly once per page mount — it MUST NOT loop or repeat.
- **FR-005**: If the confetti capability is unavailable, the summary page MUST render normally without error.

**Podium:**

- **FR-006**: A winner podium MUST be displayed on the final summary page for Mexicano and Winners Court event types only.
- **FR-007**: No podium MUST be displayed for Beat the Box events.
- **FR-008**: For Mexicano, the podium MUST show three positions — one player name per position (ranks 1, 2, 3).
- **FR-009**: For Winners Court, the podium MUST show three positions — two player names per position (ranks 1–2, 3–4, 5–6).
- **FR-010**: Podium positions with no available ranked player MUST be hidden.
- **FR-011**: The podium MUST appear above the results table on the final summary page.
- **FR-012**: The 1st-place position MUST be visually elevated (taller) compared to 2nd and 3rd.

**Event Creation UX:**

- **FR-013**: On the Setup step, a short descriptive label MUST appear directly above the mode selector.
- **FR-014**: On the Setup step, a short descriptive label MUST appear directly above the date and time inputs.
- **FR-015**: The "Today's date" button MUST be positioned above the date input field.
- **FR-016**: The "Today's date" button MUST use the same colour as the existing past-schedule warning text.
- **FR-017**: On the Roster step, an orange inline hint "Choose courts" MUST appear near the courts selector when zero courts are selected, and disappear when ≥1 court is selected.
- **FR-018**: On the Roster step, an orange inline hint "Assign players" MUST appear near the player assignment area when the assigned player count does not equal the required count, and disappear when it matches.
- **FR-019**: Both inline hints MUST use the same orange colour as the existing warning text in the application.

### Key Entities

- **FinalEventSummary**: Existing entity. The final/progress mode flag gates confetti and podium rendering. The player rows (sorted by rank) provide the data for podium slots. The event type (Mexicano / WinnersCourt / BeatTheBox) determines whether a podium is shown and how many players fill each slot.
- **PodiumSlot**: Logical concept for one podium position. Has a place number (1/2/3), a label, a visual height, and a list of 1 or 2 player names depending on event type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The confetti animation completes in approximately 1 second (10 bursts × 0.1s) with no visible page freeze or interaction block.
- **SC-002**: The podium renders correctly for 100% of Mexicano and Winners Court final summaries with correct player names at correct positions.
- **SC-003**: The podium is absent from 100% of Beat the Box final summaries.
- **SC-004**: Inline roster hints appear and disappear in real time as courts and players change — no page reload required.
- **SC-005**: Both inline hints and the "Today's date" button use exactly the same colour as the existing past-schedule warning text.
- **SC-006**: The "Today's date" button appears above the date input in all supported viewport sizes.
- **SC-007**: The confetti animation does not cause any visible layout shift or block interaction with the summary page content.
- **SC-008**: All new labels and hints are readable and do not obscure existing UI elements.

## Assumptions

- The event type (Mexicano/WinnersCourt/BeatTheBox) will be added to the final summary API response as a one-field backend extension — no database migration required.
- "Orange" for hints and the "Today's date" button matches the existing warning text colour token used throughout the application — no new colour value is introduced.
- Confetti plays once per component mount; navigating away and back triggers it again — no session-level deduplication is required.
- Podium player names are sourced from the ranked player rows already present on the summary page, sorted ascending by rank with alphabetical tiebreak.
- The Winners Court podium packs ranks 1–2 into 1st place, ranks 3–4 into 2nd, ranks 5–6 into 3rd.
