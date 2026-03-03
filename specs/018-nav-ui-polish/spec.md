# Feature Specification: Navigation & UI Polish

**Feature Branch**: `018-nav-ui-polish`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "i like how it looks now, however the main menu is on top at 'Create event' it should be down with the other buttons. Also i would like to implement this stepper function for each event, when the event has been started and we can see all courts and we assign courts and so on, We have 'Run Event - Round X', it would be perfect to have a stepper here as well, so based on the event type (how many rounds we have) we get that at the top of the UI as well, Just underneath the run event. It creates an intuitive way of seeing what round it is, and how many there are left. Also right now, i have the main menu to show Event slots and all events and so on. however, Id like to remove the panel-list stack from the main menu. And exactly this view, should be under Instead of Resume Events, i want to link it to where we can see and view all events, and call this Button 'view Events'. And player setup, should not be a way to set up an event, but rather just add players as new players maybe it should be called 'register player'"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create Event page: Move "Main Menu" button into the step action area (Priority: P1)

A user filling in the Create Event stepper currently sees the "Main Menu" button at the top of the page in the header row. The user expects navigation controls to be grouped with the other action buttons (Next, Previous), not sitting alone at the top of the form. Moving the button into the bottom action area of each step panel makes the page feel consistent with standard form navigation patterns.

**Why this priority**: Quickest, lowest-risk change — a single button relocation with no data or routing consequences. Directly addresses the user's first explicit complaint.

**Independent Test**: Open `/events/create`. Confirm no "Main Menu" button is visible in the page header. Confirm a "Main Menu" button is present alongside the step action buttons (Next / Previous / Start Event) at the bottom of each step panel.

**Acceptance Scenarios**:

1. **Given** the Create Event page is open at Step 0 (Setup), **When** the user views the page header, **Then** no "Main Menu" button is visible in the header.
2. **Given** the Create Event page is open at Step 0 (Setup), **When** the user views the step action area, **Then** a "Main Menu" button is present alongside the "Next" button.
3. **Given** the Create Event page is open at Step 1 (Roster), **When** the user views the step action area, **Then** a "Main Menu" button is present alongside "Next" and "Previous".
4. **Given** the Create Event page is open at Step 2 (Confirm), **When** the user views the step action area, **Then** a "Main Menu" button is present alongside "Start Event" and "Previous".
5. **Given** the user clicks "Main Menu" from any step, **When** the navigation resolves, **Then** the user arrives at the home page `/`.

---

### User Story 2 — Run Event page: Add a read-only round-progress stepper (Priority: P2)

A user running a live event on the Run Event page sees the heading "Run Event - Round X" but has no visual sense of how many rounds remain. Adding a read-only round-progress stepper — reusing the existing `Stepper` component — directly below the page heading gives the host an immediate at-a-glance view of current progress (e.g. Round 2 complete, Round 3 active, Rounds 4–6 pending).

**Why this priority**: High-value during live events where the host needs to quickly communicate progress to players. Reuses the already-built `Stepper` component, keeping implementation effort small.

**Independent Test**: Start a multi-round event. Navigate to `/events/:id/run`. Confirm a stepper is visible below the "Run Event" heading, showing the correct number of round indicators, with past rounds complete, the current round active, and future rounds inactive. Advance the round and confirm the stepper updates.

**Acceptance Scenarios**:

1. **Given** a running event with `totalRounds = 4` is on round 1, **When** the Run Event page loads, **Then** a stepper with 4 step indicators is displayed; indicator 1 is active, indicators 2–4 are inactive.
2. **Given** the event advances to round 3 of 4, **When** the page reloads, **Then** indicators 1–2 are complete, indicator 3 is active, indicator 4 is inactive.
3. **Given** a running event is on its final round, **When** the page loads, **Then** all prior step indicators are complete, the final indicator is active, and no indicator is inactive.
4. **Given** the stepper is rendered, **When** the user clicks a completed round indicator, **Then** nothing happens — round navigation via the stepper is disabled (read-only).
5. **Given** `totalRounds` is zero, null, or unavailable, **When** the page loads, **Then** the round stepper is not rendered; the existing heading is still visible.

---

### User Story 3 — Home page: Remove event-slots panel; add "View Events" navigation (Priority: P3)

The home page currently shows the bento menu plus a large filterable event-slots panel below it. The user wants the event-slots panel removed from the home page. The "Resume Event" bento card should be replaced by a "View Events" card that navigates to a dedicated page showing the event-slots list with all existing filter, sort, and mode-blob controls intact.

**Why this priority**: Cleans up the home screen to a simple launcher. The event-slots list is still fully accessible via "View Events" — no functionality is lost.

**Independent Test**: Open the home page. Confirm only the bento menu is visible (no event list below it). Click "View Events". Confirm navigation to a dedicated page that shows all event slots with filter/sort controls working correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the home page, **When** the page loads, **Then** the event-slots panel (list, filter tabs, sort controls) is not visible anywhere on the page.
2. **Given** the user is on the home page, **When** the user looks at the bento menu, **Then** one card is labelled "View Events".
3. **Given** the user clicks "View Events", **When** navigation resolves, **Then** the user sees a page containing all event slots, filter tabs (All / Planned / Ready / Ongoing / Finished), and sort controls.
4. **Given** events exist in various lifecycle states, **When** the user applies a lifecycle filter on the View Events page, **Then** the list updates to show only matching events — identical behaviour to the former inline panel.
5. **Given** the View Events page is open, **When** the user navigates back, **Then** they return to the home page.

---

### User Story 4 — Home page: Rename "Player Setup" card to "Register Player" (Priority: P4)

The "Player Setup" bento card currently implies it is part of the event-setup workflow. The user wants it renamed to "Register Player" with a subtitle that clearly communicates adding a new participant to the player catalog — not configuring an event.

**Why this priority**: Label-only change with subtitle update. Minimal risk, immediate clarity improvement.

**Independent Test**: Open the home page. Confirm the bento card reads "Register Player" with a subtitle about adding a player. Confirm clicking it navigates to the player registration or player management page.

**Acceptance Scenarios**:

1. **Given** the user is on the home page, **When** the user views the bento menu, **Then** a card labelled "Register Player" is present.
2. **Given** the "Register Player" card is visible, **When** the user reads its subtitle, **Then** the subtitle communicates adding or registering a new participant (e.g. "Add a new player to the roster").
3. **Given** the user clicks "Register Player", **When** navigation resolves, **Then** the user lands on the dedicated player registration page at `/players/register`.
4. **Given** the user is on the player registration page, **When** the user enters a valid display name and confirms, **Then** the new player is saved and a success confirmation is shown.
5. **Given** the user is on the player registration page, **When** the user submits an empty or duplicate name, **Then** an error message is shown and the player is not saved.
6. **Given** the user is on the player registration page, **When** the user activates the "back to home" control, **Then** they return to the home page.

---

### Edge Cases

- What if `totalRounds` is `0` or missing on the Run Event page? → The round stepper must not render; the heading "Run Event - Round X" remains unchanged.
- What if an event has only 1 round? → The stepper shows a single active indicator — valid and correct.
- What if the user clicks "Main Menu" on Step 0 with unsaved input? → Navigation proceeds without confirmation; no dialog required (consistent with existing behavior elsewhere in the app).
- What if `totalRounds` is very large (e.g. 20 rounds)? → The stepper must still render all steps; step labels are round numbers only (no long text), so overflow is manageable.
- What if the user submits a duplicate player name on the Register Player page? → An error message must be shown; no duplicate record is created.
- What if the backend is unavailable when saving a new player? → The registration page shows an error message; the user can retry without losing their input.

---

## Requirements *(mandatory)*

### Functional Requirements

**FR-001**: The "Main Menu" button MUST be removed from the `CreateEvent` page header.

**FR-002**: Every step panel on the Create Event stepper (Setup, Roster, Confirm) MUST include a "Main Menu" button in its action button row.

**FR-003**: Clicking "Main Menu" from any Create Event step MUST navigate the user to the home page without resetting or persisting draft state beyond the existing auto-save behavior.

**FR-004**: The Run Event page MUST display a read-only round-progress stepper immediately below the page heading when the event's `totalRounds` is a positive integer.

**FR-005**: The round stepper MUST show one step indicator per round. Indicators before the current round MUST be in the complete state. The current round's indicator MUST be active. Indicators for future rounds MUST be inactive.

**FR-006**: The round stepper MUST be entirely read-only — clicking any indicator MUST NOT trigger navigation, round changes, or any other action.

**FR-007**: The round stepper MUST NOT render when `totalRounds` is zero, null, undefined, or otherwise unavailable.

**FR-008**: The round stepper MUST reuse the existing shared `Stepper` component.

**FR-009**: The home page MUST NOT display the event-slots panel (the event list with filter tabs, sort controls, and mode blobs).

**FR-010**: The bento card previously labelled "Resume Event" MUST be renamed to "View Events" on the home page.

**FR-011**: Clicking "View Events" MUST navigate to a dedicated page that displays all event slots with the existing filter tabs, sort controls, and mode-blob controls fully functional.

**FR-012**: The View Events page MUST be accessible via a stable, bookmarkable URL (e.g. `/events`).

**FR-013**: The bento card previously labelled "Player Setup" MUST be renamed to "Register Player" on the home page.

**FR-014**: The "Register Player" card subtitle MUST communicate adding or registering a new participant (e.g. "Add a new player to the roster").

**FR-015**: Clicking "Register Player" MUST navigate to a dedicated player registration page at `/players/register`.

**FR-016**: The player registration page MUST allow a user to enter a new player's display name and save them to the player catalog.

**FR-017**: The player registration page MUST provide feedback on success (e.g. a confirmation message and option to register another player) and on failure (e.g. duplicate name or empty input).

**FR-018**: The player registration page MUST include a navigation control to return to the home page.

### Key Entities

- **BentoCard**: A navigation shortcut tile on the home page. Has a title, subtitle, and destination route. "Resume Event" → "View Events"; "Player Setup" → "Register Player".
- **EventSlotsView**: The filterable, sortable list of all event records. Moves from an inline home-page panel to a standalone dedicated page at a stable route.
- **RoundStepper**: A read-only instance of the shared `Stepper` component placed on the Run Event page. Steps represent rounds; no `onStepClick` handler. Step labels are round numbers.
- **RegisteredPlayer**: A player record in the player catalog. Has at minimum a display name. Created via the `/players/register` page.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the Create Event page, the "Main Menu" button appears within the step action area on every step (0, 1, 2) and is absent from the page header.
- **SC-002**: The round-progress stepper on the Run Event page reflects the correct current round immediately on page load and after each round advance, with no manual refresh required.
- **SC-003**: The home page renders with only the bento menu visible (no event list), producing a visibly shorter, less cluttered initial view.
- **SC-004**: The "View Events" page provides complete, unaltered access to all filter and sort controls — zero regression in functionality compared to the former inline event-slots panel.
- **SC-005**: Both renamed bento cards ("View Events" and "Register Player") accurately communicate their destination by label and subtitle.
- **SC-006**: All existing frontend tests continue to pass after all changes (zero regressions).
- **SC-007**: TypeScript compiles with zero errors after all changes.
