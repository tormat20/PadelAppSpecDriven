# Feature Specification: Event Setup Label + Run Card Transparency + Inline Team Result Badges

**Feature Branch**: `002-run-result-badges`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Feature: Event Setup Label + Run Card Transparency + Inline Team Result Badges"

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

### User Story 1 - Show mirrored results directly on team buttons (Priority: P1)

As a host running a live event, I want selected outcomes shown directly inside each team button so I can confirm both teams' current status without scanning extra helper text.

**Why this priority**: This is the fastest feedback loop for live score entry and directly reduces operator mistakes.

**Independent Test**: In run-event flow, select outcomes for Americano, BeatTheBox, and Mexicano and verify each team button shows mirrored values/outcomes correctly on the right side.

**Acceptance Scenarios**:

1. **Given** a Mexicano match, **When** the host selects score `X` on one team button, **Then** that button shows `X` and the opposing team button shows `24 - X`.
2. **Given** an Americano match, **When** one side is set to `Win`, **Then** the opposing side shows `Loss`.
3. **Given** an Americano match, **When** one side is set to `Loss`, **Then** the opposing side shows `Win`.
4. **Given** a BeatTheBox match, **When** one side is set to `Draw`, **Then** both sides show `Draw`.
5. **Given** an outcome has been selected, **When** the card refreshes, **Then** no extra muted helper text is needed below the card.

---

### User Story 2 - Improve event setup player section clarity (Priority: P2)

As a host preparing an event, I want a clear `Players` section heading and a fully visible assigned-player list so I can confirm lineup completeness quickly.

**Why this priority**: Setup clarity prevents downstream run-event confusion, but it is slightly less critical than active match scoring feedback.

**Independent Test**: Open create-event and verify `Players` heading placement above add/search controls and verify assigned list grows downward without clipping.

**Acceptance Scenarios**:

1. **Given** create-event page is open, **When** the host scans the player area, **Then** the section heading reads `Players`.
2. **Given** multiple players are assigned, **When** the list grows, **Then** all assigned entries remain visible in a downward-expanding list.
3. **Given** normal event setup usage, **When** host reviews assignments, **Then** no fixed-height scroll box hides assigned players.

---

### User Story 3 - Increase court image visibility without losing readability (Priority: P3)

As a host running matches, I want the court image to be clearer while keeping tinted team buttons readable and clickable.

**Why this priority**: This is a visual polish improvement that supports orientation and confidence, but does not alter core scoring logic.

**Independent Test**: Open started event view and verify reduced grey overlay, readable tinted team buttons, and absence of muted text below cards.

**Acceptance Scenarios**:

1. **Given** run-event court cards are shown, **When** the host views the court area, **Then** the grey overlay is reduced so the court image is more visible.
2. **Given** overlay is reduced, **When** the host reads team controls, **Then** left/right team buttons remain tinted and readable.
3. **Given** run-event cards render, **When** host checks card footer, **Then** no muted helper text appears below court cards.

---

### Edge Cases

- If a host changes a previously selected outcome, both team-button badges update to the latest mirrored state.
- If a host cancels modal selection, existing button badges remain unchanged.
- If no result is selected yet, team buttons show names with no stale badge value.
- If court image fails to load, team button tint/readability still supports scoring.
- Rapid repeated selections must converge to the last submitted outcome shown on both team buttons.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display selected match outcomes as right-aligned badges/values inside each team button.
- **FR-002**: The system MUST remove redundant muted helper text below run-event court cards.
- **FR-003**: For Mexicano selection, the selected team button MUST show `X` and the opposing team button MUST show `24 - X`.
- **FR-004**: For Americano and BeatTheBox win/loss selections, team-button outcomes MUST be mirrored as `Win/Loss` or `Loss/Win`.
- **FR-005**: For BeatTheBox draw selection, both team buttons MUST show `Draw`.
- **FR-006**: Team-button displayed results MUST update immediately after a valid selection and remain visible until changed.
- **FR-007**: The create-event player area MUST use `Players` as the section heading above add/search controls.
- **FR-008**: The assigned-player list in create-event MUST expand downward and avoid fixed-height clipping for normal event setup usage.
- **FR-009**: The run-event court card grey overlay MUST be reduced so the court image is visibly clearer.
- **FR-010**: Left/right team grouping buttons MUST preserve tinted readability after court-card transparency adjustments.
- **FR-011**: Existing submission flow, match completion, and event progression behavior MUST remain unchanged.

### Key Entities *(include if feature involves data)*

- **Team Button Result Display**: Visual state combining team names and the current mirrored outcome badge/value.
- **Mirrored Outcome Pair**: Coupled representation of both team outcomes derived from a single selection.
- **Player Setup Panel**: Create-event section containing heading, add/search controls, and assigned-player list behavior.
- **Court Card Visual Layer**: Match-card background/overlay treatment balancing court visibility and control readability.

### Assumptions & Dependencies

- Existing mode-specific selection logic remains the source of truth for submitted outcomes.
- This feature changes UI presentation and feedback behavior, not match-scoring formulas.
- Route structure and event lifecycle endpoints remain unchanged.
- Existing player display-name data is already available in current flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In host validation sessions, at least 95% of users identify both teams' current selected outcomes from button labels in under 2 seconds per card.
- **SC-002**: In Mexicano validation, 100% of tested selections display complementary values summing to 24 across both team buttons.
- **SC-003**: In Americano/BeatTheBox validation, 100% of tested selections display correct mirrored outcomes across both team buttons.
- **SC-004**: In create-event validation, 100% of assigned players are visible without fixed-height clipping during normal setup usage.
- **SC-005**: In run-event visual review, at least 90% of hosts report improved court readability with no loss of team-button readability.
- **SC-006**: Regression validation confirms existing match submission and progression behavior remains unchanged across previously passing event-flow checks.
