# Feature Specification: 3-Step Create Event Stepper

**Feature Branch**: `017-create-event-stepper`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Add a 3-step stepper to the Create Event flow to guide first-time users through Planned → Ready → Ongoing, using the ReactBits Stepper component (motion library). Step 1: Setup (mode, date, name) → creates an event slot. Step 2: Roster (courts + players) → makes event ready. Step 3: Confirm (summary before starting). Replace the current all-in-one Create Event page."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — First-time user creates a new event end-to-end (Priority: P1)

A host who has never used the app before opens the Create Event page and is guided through three clearly labelled steps: **Setup**, **Roster**, and **Confirm**. Animated step indicators show their position in the flow at all times. Pressing "Next" on Step 1 saves a planned event slot and advances to Step 2. Completing Step 2 promotes the event to "ready". Step 3 shows a final summary with a "Start Event" button.

**Why this priority**: This is the core user journey the entire feature exists to improve. A new user must be able to complete this flow without confusion. All other stories depend on this path working.

**Independent Test**: Open the app as a first-time user, navigate to Create Event, and complete all three steps without external guidance. Verify the event reaches "ready" status after Step 2 and can be started from Step 3.

**Acceptance Scenarios**:

1. **Given** the user opens the Create Event page, **When** the page loads, **Then** the stepper is visible with three labelled steps ("Setup", "Roster", "Confirm") and Step 1 is active.
2. **Given** the user fills in mode, date, and name on Step 1, **When** they press "Next", **Then** an event slot is created (Planned status) and the stepper transitions to Step 2 with a slide animation.
3. **Given** the user is on Step 2 with a planned event slot, **When** they assign courts and players meeting the minimum requirement, **Then** the event is updated to "ready" status.
4. **Given** the user presses "Next" on Step 2, **When** the event is ready, **Then** the stepper transitions to Step 3 showing a summary of all chosen details.
5. **Given** the user is on Step 3, **When** they press "Start Event", **Then** the event starts and the user is taken to the run-event view.

---

### User Story 2 — User resumes an existing planned event slot through the stepper (Priority: P2)

A host previously created an event slot (mode, date, and name only — no courts or players yet). They return to the app and open that slot. The stepper opens at Step 2 ("Roster"), because Step 1 is already complete. The step indicator shows Step 1 as completed and Step 2 as active. They add courts and players and advance to Step 3.

**Why this priority**: Event slots are explicitly part of the described workflow. A user who returns mid-flow must be oriented instantly — the stepper must reflect the slot's current progress state, not always start at Step 1.

**Independent Test**: Create an event slot (Step 1 only), navigate away, then open the event again via the Preview page "Edit Event" link. Verify the stepper opens at Step 2 with Step 1 shown as complete.

**Acceptance Scenarios**:

1. **Given** an event with "planned" status (slot only, no courts/players), **When** the user opens it for editing, **Then** the stepper starts at Step 2 with the Step 1 indicator showing complete.
2. **Given** the user is on Step 2 for a planned slot, **When** they press "Previous", **Then** the stepper moves back to Step 1 allowing them to change mode, date, or name.
3. **Given** the user changes the event name on Step 1 while editing, **When** they press "Next", **Then** the event slot is updated with the new name before advancing to Step 2.

---

### User Story 3 — User navigates back to Step 1 and changes event mode (Priority: P3)

While on Step 2, a host realises they chose the wrong game mode. They press "Previous" to return to Step 1, change the mode, then press "Next" again. The required player count on Step 2 updates to reflect the new mode's court configuration.

**Why this priority**: Back-navigation must not trap the user. When mode changes, downstream requirements (player count per court) must update accordingly. This protects data integrity without blocking the user.

**Independent Test**: Reach Step 2 with WinnersCourt selected and courts partially filled. Press "Previous", change mode to Mexicano, advance to Step 2 again. Verify required player count still reads courts × 4 (unchanged rule, but the mode label updates).

**Acceptance Scenarios**:

1. **Given** the user is on Step 2, **When** they press "Previous", **Then** they return to Step 1 with previously entered values (mode, date, name) preserved.
2. **Given** the user changes mode on Step 1 and presses "Next", **Then** Step 2 shows the updated mode label and recalculates requirements based on the newly selected mode and currently selected courts.

---

### Edge Cases

- What happens when the user presses "Next" on Step 1 but the event name or date is missing? → The "Next" button is disabled until mode, date, and event name are all provided.
- What happens if the API call to save the event slot fails when pressing "Next" on Step 1? → An inline error message is shown on Step 1; the user stays on Step 1 and can retry.
- What happens if the user leaves the page mid-flow? → The already-created event slot persists on the server. Returning via "Edit Event" on the Preview or Home page resumes the stepper at the correct step.
- What happens on Step 3 if the event is no longer "ready" (e.g. a player was removed)? → The "Start Event" button is disabled with a brief message explaining what is missing.
- What happens if the user clicks a completed step indicator to jump backward? → Clicking a completed step indicator navigates back to that step. Clicking a future (incomplete) step indicator has no effect.
- What happens when opening the stepper in edit mode for an already "ongoing" or "finished" event? → The stepper is not shown for ongoing/finished events; those remain on the existing Preview page.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Create Event page MUST present the event creation flow as a 3-step stepper with steps labelled "Setup", "Roster", and "Confirm".
- **FR-002**: The stepper MUST use an animated step indicator bar showing inactive, active, and complete states, with slide transitions between step content panels.
- **FR-003**: Step indicators MUST display three visually distinct states: inactive (numbered, muted), active (highlighted with a dot), and complete (filled with a checkmark).
- **FR-004**: Completed step indicators MUST be clickable to navigate back to that step; future step indicators MUST NOT respond to clicks.
- **FR-005**: On **Step 1 (Setup)**, the user MUST be able to select event mode (WinnersCourt / Mexicano / BeatTheBox), event date, event time, and event name.
- **FR-006**: On Step 1, the "Next" button MUST be disabled until mode, date, and event name are all provided.
- **FR-007**: Pressing "Next" on Step 1 MUST create or update an event slot (Planned status) via the backend before animating to Step 2. On API failure, an inline error is shown and the user stays on Step 1.
- **FR-008**: On **Step 2 (Roster)**, the user MUST be able to select courts and search for and assign players to the event.
- **FR-009**: Step 2 MUST display the required player count (courts × 4) and the current assigned player count so the user can see when readiness is achieved.
- **FR-010**: Pressing "Next" on Step 2 MUST save courts and players to the event (updating it to "ready" if requirements are met) before animating to Step 3.
- **FR-011**: On **Step 3 (Confirm)**, the user MUST see a read-only summary of: event name, mode, date/time, number of courts, and number of players assigned.
- **FR-012**: Step 3 MUST display a "Start Event" button that is enabled only when the event has "ready" status. When disabled, a brief explanation of the missing requirement MUST be shown.
- **FR-013**: A "Main Menu" navigation option MUST be accessible from every step without discarding already-saved progress.
- **FR-014**: When editing an existing "planned" event slot (mode/date/name set, no courts/players), the stepper MUST open at Step 2 with Step 1 shown as complete.
- **FR-015**: When editing an existing "ready" event (courts and players assigned), the stepper MUST open at Step 3 with Steps 1 and 2 shown as complete.
- **FR-016**: The stepper component MUST be extracted as a standalone reusable component so it can be used independently of the Create Event flow.
- **FR-017**: Step labels ("Setup", "Roster", "Confirm") MUST be visible alongside each step indicator circle so users understand the meaning of each step without counting.

### Key Entities

- **Event Slot**: An event record in "planned" status that has mode, date, and name but may lack courts and/or players.
- **Ready Event**: An event record in "ready" status that has all required courts and players assigned, satisfying the minimum player count.
- **Stepper Step**: One of three enumerated stages in the creation flow (Setup, Roster, Confirm), each with its own entry condition and "Next" action.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can create a new event and reach "ready" status in a single uninterrupted flow without referring to external documentation.
- **SC-002**: The active step and completed steps are always visually distinguishable at a glance — a user can determine their position in the flow without reading text labels.
- **SC-003**: Pressing "Next" on Step 1 with all required fields filled always results in a persisted event slot; no data is lost if the user navigates away after that point.
- **SC-004**: The stepper opens at the correct step in 100% of cases when resuming an in-progress event (planned → Step 2, ready → Step 3).
- **SC-005**: The "Start Event" action on Step 3 is never enabled when the event does not meet readiness criteria.
- **SC-006**: Step content transitions animate without visible layout jumps or content flashes.
- **SC-007**: All existing event creation and editing tests continue to pass after the stepper is introduced — no regression in Create Event functionality.

---

## Assumptions

- The existing `createEvent` and `updateEvent` API calls are sufficient to support the split-step saves; no new backend endpoints are required.
- The `motion` library will be added as a new frontend dependency; it is not currently in the project.
- The stepper replaces the current combined Create Event page layout; the existing two-column grid is redesigned to fit the stepped structure.
- For the edit flow, the "Edit Event" button on the Preview page navigates to the existing create route with an `editEventId` query param; the stepper infers the starting step from the event's lifecycle status.
- Event slots created on Step 1 appear immediately on the Home page event list (existing behaviour preserved).
- The color scheme for active/complete step indicators uses the existing app accent color, not hardcoded values, to stay consistent with the design system.
- Player draft persistence (localStorage) remains in place across steps so players selected in Step 2 survive a page refresh.
- The "Roster" naming is used for Step 2 — it conveys "assigning the team/squad to an event" clearly to a non-technical host audience.
