# Feature Specification: Player Selection and Favicon Improvements

**Feature Branch**: `001-player-selection-favicon`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Fix player selection UX/data behavior in event setup and add application favicon branding."

## Clarifications

### Session 2026-02-26

- Q: How should duplicate player names be handled when adding a new player (case-insensitive match)? → A: Reuse existing player record, auto-assign to the event draft, and show a clear message instead of creating a duplicate.
- Q: Should assigned players persist for the active event draft when the user refreshes or returns to that draft? → A: Assigned-player list persists for the active draft and is restored when returning to that draft.
- Q: What favicon compatibility strategy should be required for the Molndal logo asset? → A: Use the provided SVG as the primary favicon with a PNG fallback for browsers with weaker SVG favicon support.
- Q: After how many typed characters should player prefix suggestions begin? → A: Start showing prefix suggestions after 1 typed character.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and assign players during event setup (Priority: P1)

As an event host creating an event, I can add a new player and immediately see that player assigned in the event's selected-player list so I can continue setup without confusion.

**Why this priority**: Event setup is blocked when hosts cannot add and confirm players in context. This is the highest-impact usability and workflow issue.

**Independent Test**: Start a new event setup with an empty player database, add a new player, and verify the player appears in the event-assigned list without additional navigation.

**Acceptance Scenarios**:

1. **Given** no existing players, **When** the host adds a new player during event setup, **Then** the player is created in the player catalog and appears in the event-assigned list immediately.
2. **Given** a host has added multiple players, **When** the host views the event-assigned list, **Then** all assigned players are visible and identifiable as part of the current event draft.

---

### User Story 2 - Find and manage assigned players quickly (Priority: P2)

As an event host, I can search players by prefix and remove assigned players using a left-side minus control so I can manage the event roster quickly and accurately.

**Why this priority**: Fast discovery and correction of assigned players directly impacts setup speed and confidence, but depends on the ability to add and view players first.

**Independent Test**: With a populated player catalog, search with prefix input (for example, "A") and verify relevant names are suggested; remove one assigned player using the left-side minus control and verify only event assignment is removed.

**Acceptance Scenarios**:

1. **Given** players exist whose names start with the entered prefix, **When** the host types into player search, **Then** matching suggestions are shown using case-insensitive prefix matching.
2. **Given** a player is currently assigned to the event draft, **When** the host clicks the left-side minus control for that row, **Then** the player is unassigned from the event draft and remains available in the global player catalog.

---

### User Story 3 - Show correct browser tab branding (Priority: P3)

As a host using the app in a browser, I see the Molndal padel logo as the app icon in the browser tab.

**Why this priority**: Branding improves recognition and trust but does not block event setup workflows.

**Independent Test**: Open the application in a browser and verify the tab icon uses the provided Molndal logo asset.

**Acceptance Scenarios**:

1. **Given** the app is loaded in a supported browser, **When** the tab icon is rendered, **Then** it uses the provided Molndal logo asset and not the default icon.

---

### Edge Cases

- When the host adds a name that case-insensitively matches an existing player, the existing player is reused and assigned to the event draft, and the UI shows a clear duplicate-handling message.
- How does search behave when no players match the typed prefix?
- Player prefix suggestions begin after one typed character.
- What happens when a host rapidly adds and removes players before submitting event setup?
- How is the assigned-player list presented when it is empty at first load?
- How does the UI behave when player names are very long or contain special characters?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a host add a new player during event setup and create that player in the global player catalog.
- **FR-002**: The system MUST automatically assign a newly created player to the current event draft immediately after creation.
- **FR-003**: The event setup screen MUST always display the current list of players assigned to the event draft.
- **FR-004**: Each assigned-player row MUST include a left-aligned minus control that removes that player from the event draft assignment.
- **FR-005**: Removing a player from the event-assigned list MUST NOT delete that player from the global player catalog.
- **FR-006**: Player search in event setup MUST support case-insensitive prefix matching and return relevant suggestions as the host types.
- **FR-007**: When no players match search input, the system MUST show a clear empty-result state.
- **FR-008**: When no players are assigned yet, the system MUST show a clear empty assigned-list state.
- **FR-009**: The improved player selection flow MUST preserve existing event creation outcome rules and submission constraints.
- **FR-011**: The feature MUST include validation coverage for add-and-assign behavior, prefix search suggestions, assigned-list removal behavior, and unchanged event setup constraints.
- **FR-012**: When a host attempts to add a player whose name case-insensitively matches an existing player, the system MUST reuse the existing player record, auto-assign that player to the current event draft, and show a clear duplicate-handling message.
- **FR-013**: Assigned-player selections for an active event draft MUST persist and be restored when the host refreshes or returns to that same draft.
- **FR-014**: Browser tab icon configuration MUST use the provided Molndal SVG asset as primary favicon source and include a PNG fallback for compatibility.
- **FR-015**: Player search suggestions MUST begin displaying after the host enters the first character and continue updating with case-insensitive prefix matching.

### Key Entities *(include if feature involves data)*

- **Player Catalog Entry**: A reusable player identity available across events; includes a unique identifier and display name.
- **Event Draft Assignment List**: The set of player catalog entries currently assigned to the in-progress event setup session.
- **Search Suggestion Set**: The dynamically filtered list of player catalog entries matching current search input by case-insensitive prefix.
- **Assigned Player Row Action**: A row-level control model containing a remove action that unassigns a player from the current event draft only.
- **Application Tab Icon**: The branding artifact shown in browser tabs for app recognition.

### Dependencies & Assumptions

- Event setup remains a single-host workflow with no new permission model introduced.
- Existing event creation constraints remain unchanged unless required to fix incorrect behavior.
- Removing a player from the event draft affects only assignment in the current setup context, not global player persistence.
- Active event drafts maintain assigned-player state across refresh and return to the same draft.
- Browser favicon display follows normal browser caching behavior and may require refresh to observe updates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation runs that start with no players, hosts can add and immediately see assigned players in 100% of observed attempts.
- **SC-002**: For prefix searches in validation data, at least 95% of expected matching names appear in suggestions, including names starting with the typed letter regardless of casing.
- **SC-003**: In roster management checks, 100% of remove actions from the assigned-player list unassign the player from the event draft without removing the player from the global catalog.
- **SC-004**: Event setup completion outcomes remain unchanged for baseline scenarios after the player-selection improvements.
- **SC-005**: Browser-tab icon verification passes in supported test browsers using the provided Molndal logo asset.
- **SC-006**: In duplicate-name validation checks, 100% of case-insensitive duplicates are resolved by reusing existing players without creating additional player records.
- **SC-007**: In draft-resume checks, assigned-player lists are restored correctly in 100% of refresh-and-return scenarios for the same active draft.
- **SC-008**: In supported-browser verification, favicon rendering succeeds using primary SVG source with fallback coverage where needed.
- **SC-009**: In search interaction checks, prefix suggestions appear after one typed character in 100% of tested setup sessions.
