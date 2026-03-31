# Feature Specification: Run Event Fullscreen Mode

**Feature Branch**: `045-run-event-fullscreen`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "We are not utilising the screen very well. On a big screen, the card-nav-container and the page header panel take too much space. Add a fullscreen mode where we only show the courts and the Prev/Next buttons. In fullscreen, courts and text should be bigger — names fill the name box, the score badge takes up more space, and icons are larger."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host enters fullscreen to fill the screen with court cards (Priority: P1)

A host running a live padel event on a large monitor wants to show the current round's court assignments to all players in the room. The standard layout wastes screen space with the navigation bar, round header, and page margins. The host clicks a fullscreen button and the page instantly switches to a mode that covers the entire screen with just the court grid and the Prev/Next round buttons. No navigation bar is visible.

**Why this priority**: This is the primary motivation for the feature. The host uses a large screen as a display for the room; the standard layout is too small for everyone to read player names from a distance.

**Independent Test**: On the Run Event page, click the fullscreen button. The navigation bar should disappear and the court cards should expand to fill the full viewport. Clicking the button again (or pressing Escape) returns to the normal view.

**Acceptance Scenarios**:

1. **Given** the Run Event page in normal mode, **When** the host clicks the fullscreen toggle button, **Then** the navigation bar is no longer visible and the court grid fills the entire screen.
2. **Given** fullscreen mode is active, **When** the host clicks the toggle button again, **Then** the page returns to normal layout with the navigation bar visible.
3. **Given** fullscreen mode is active, **When** the host presses the Escape key, **Then** fullscreen exits and the normal layout is restored.
4. **Given** fullscreen mode is active, **When** the page is scrolled to the top, **Then** the court cards are the first visible elements with no navigation bar above them.

---

### User Story 2 - Court cards and player text are larger in fullscreen (Priority: P1)

In fullscreen mode, the court cards must be visibly taller so that player names and score badges fill their allocated space. Player names should be large enough to read from across a room. The score badge (shown on the right side of each team grouping) should be larger and more legible.

**Why this priority**: Fullscreen mode without larger text defeats its own purpose — the host's goal is for all players in the room to read the screen from a distance.

**Independent Test**: Enter fullscreen and compare a court card side by side with normal mode. The court card height, player name font size, score badge size, and streak icons should all be noticeably larger.

**Acceptance Scenarios**:

1. **Given** fullscreen mode is active, **When** the user views a court card, **Then** the court card is taller than in normal mode.
2. **Given** fullscreen mode is active, **When** the user views player names inside a court card, **Then** the font size is larger than in normal mode, filling more of the name area.
3. **Given** fullscreen mode is active, **When** a score badge is visible on a team grouping, **Then** the badge is larger (taller, wider, bigger text) than in normal mode.
4. **Given** fullscreen mode is active, **When** fire or snowflake streak icons are visible, **Then** the icons are larger than in normal mode.
5. **Given** fullscreen mode is active, **When** the court grid is viewed, **Then** each court card column is wider, fitting fewer but larger cards per row.

---

### User Story 3 - Result submission still works in fullscreen (Priority: P1)

The host needs to submit match results by clicking a team grouping to open the result modal. This flow must work identically in fullscreen mode — the result entry modal opens on top of the fullscreen overlay, the host enters the score, submits, and the court card updates.

**Why this priority**: Without working result submission, fullscreen mode is unusable for its intended purpose.

**Independent Test**: Enter fullscreen, click a team grouping on a court card, fill in a score, and submit. The modal should appear correctly, submission should succeed, and the court card should show the result badge afterwards.

**Acceptance Scenarios**:

1. **Given** fullscreen mode is active, **When** the host clicks a team grouping on any court card, **Then** the result entry modal opens on top of the fullscreen view.
2. **Given** the result modal is open in fullscreen, **When** the host submits a score, **Then** the submission succeeds and the result badge appears on the court card.
3. **Given** the result modal is open in fullscreen, **When** the host closes the modal without submitting, **Then** fullscreen mode remains active and the court grid is still visible.

---

### User Story 4 - Prev/Next round buttons are accessible in fullscreen (Priority: P2)

The host needs to advance or go back to a previous round. In fullscreen mode the Prev and Next buttons must remain accessible, either visible on screen or reachable by scrolling within the fullscreen view.

**Why this priority**: The host must be able to advance rounds without exiting fullscreen every time.

**Independent Test**: Enter fullscreen and scroll to find the Prev/Next buttons. They should be present and clickable, and clicking Next should advance the round while staying in fullscreen.

**Acceptance Scenarios**:

1. **Given** fullscreen mode is active, **When** the host scrolls down, **Then** the Prev/Next round buttons are visible and clickable.
2. **Given** fullscreen mode is active and the host clicks Next, **When** the next round loads, **Then** the page stays in fullscreen and scrolls back to the top of the court grid.
3. **Given** fullscreen mode is active, **When** the host clicks Prev, **Then** the previous round loads and the page stays in fullscreen.

---

### Edge Cases

- What happens on a small or mobile screen where fullscreen mode would make things worse? Fullscreen mode is intended for large screens; on small viewports the enlarged cards may overflow horizontally. The layout should remain scrollable and not break.
- What happens when the user opens the result modal in fullscreen and then dismisses it with Escape? The Escape key should close the modal first; a second Escape press would then exit fullscreen. Confirm the key handler does not conflict with the modal's own dismiss behaviour.
- What happens if fullscreen mode is active and the user navigates away (e.g. uses the browser back button)? The fullscreen state is local to the page session and resets on navigation — normal behaviour for in-memory state.
- What happens when there are no court cards (e.g. no matches for this round)? The fullscreen overlay renders without court cards — the same empty state as normal mode.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Run Event page MUST provide a toggle button that enters and exits fullscreen mode.
- **FR-002**: In fullscreen mode, the application navigation bar MUST NOT be visible.
- **FR-003**: In fullscreen mode, the court grid MUST be the primary visible content, filling the available screen space.
- **FR-004**: In fullscreen mode, the Prev/Next round action buttons MUST remain accessible (visible on screen or reachable by scrolling).
- **FR-005**: In fullscreen mode, court cards MUST be taller than in normal mode.
- **FR-006**: In fullscreen mode, player name text inside court cards MUST be larger than in normal mode.
- **FR-007**: In fullscreen mode, score badges on team groupings MUST be larger than in normal mode.
- **FR-008**: In fullscreen mode, streak icons (fire and snowflake) MUST be larger than in normal mode.
- **FR-009**: In fullscreen mode, the court grid column minimum width MUST be wider, so each card takes up more horizontal space.
- **FR-010**: Pressing Escape while in fullscreen mode MUST exit fullscreen and restore the normal layout.
- **FR-011**: The result entry modal MUST open and function correctly while fullscreen mode is active.
- **FR-012**: Fullscreen mode MUST only affect the Run Event page — no other page in the application is affected.
- **FR-013**: Fullscreen mode MUST NOT use the browser's native Fullscreen API — it is implemented purely through layout and visual overlay.
- **FR-014**: When entering fullscreen mode, the view MUST scroll to the top of the court grid.
- **FR-015**: This feature MUST depend on branch 043 (run-grid__round-header) being merged first, as the toggle button is placed in the round header element introduced there.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In fullscreen mode on a 1920×1080 display, the court grid fills the full viewport width and the navigation bar is not visible at all.
- **SC-002**: Player name text in fullscreen mode is at least 25% larger than in normal mode, measurable by comparing rendered font sizes.
- **SC-003**: The result submission flow (click team → enter score → submit) completes successfully in fullscreen mode with no additional steps compared to normal mode.
- **SC-004**: Pressing Escape exits fullscreen within one keystroke, with no delay or additional confirmation required.
- **SC-005**: Entering and exiting fullscreen mode takes under 1 second with no visible layout flash or transition artefacts.
- **SC-006**: All existing frontend tests pass with no new failures after this feature is added.

## Assumptions

- Branch 043 (run-event-ui-polish) is merged before this branch is implemented, providing the `run-grid__round-header` element where the fullscreen toggle button is placed.
- The fullscreen overlay is positioned to cover the navigation bar using CSS fixed positioning, not the browser Fullscreen API, so no browser permissions are required.
- The result entry modal (z-index 40) naturally sits above the fullscreen overlay (z-index 30) without any additional changes — this is confirmed by the existing z-index layering in the codebase.
- Fullscreen state is not persisted across page reloads or navigation; it resets to normal mode automatically.
- Mobile layout support for fullscreen is not required for this feature — the mode is designed for large screens.
