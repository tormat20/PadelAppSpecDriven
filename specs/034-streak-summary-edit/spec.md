# Feature Specification: Ongoing Summary and Streak Badges

**Feature Branch**: `034-streak-summary-edit`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Replace recent-win fire badge with crown, add 3-win/3-loss streak badges in ongoing events, and add an inline editable summary view during active events."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Event Context While Reviewing and Correcting Scores (Priority: P1)

As an event host running an ongoing event, I can open a summary panel inside the same ongoing-event screen and edit entered scores directly there, so I can verify standings and correct mistakes without leaving or resetting event context.

**Why this priority**: Losing ongoing event context creates operational risk during live play. Hosts need immediate score visibility and correction in place.

**Independent Test**: Start an event with at least one submitted result, open the in-page summary view, adjust a score, and confirm updated standings appear immediately while the event remains ongoing.

**Acceptance Scenarios**:

1. **Given** an event is ongoing and has recorded results, **When** the host selects "View Summary", **Then** a summary panel expands within the ongoing-event page and shows current standings and match scores.
2. **Given** the inline summary is open, **When** the host edits a previously entered score and saves, **Then** the updated score is stored and standings are recalculated without leaving the ongoing-event page.
3. **Given** the host closes the inline summary, **When** they continue event operations, **Then** round state and navigation context remain unchanged.

---

### User Story 2 - Highlight Hot and Cold Streaks During Ongoing Play (Priority: P2)

As an event host, I can see visual streak indicators in ongoing events so I can quickly identify players on strong or weak momentum and keep the event engaging.

**Why this priority**: Streak indicators improve live readability and player engagement, but they are secondary to preserving event operations.

**Independent Test**: Run an ongoing event where a player wins three consecutive matches and another loses three consecutive matches; confirm the correct streak symbols appear and disappear when the streak breaks.

**Acceptance Scenarios**:

1. **Given** an ongoing event, **When** a player reaches three consecutive wins, **Then** that player is shown with a hot-streak indicator (fire symbol) next to their name.
2. **Given** an ongoing event, **When** a player reaches three consecutive losses, **Then** that player is shown with a cold-streak indicator (snowflake symbol) next to their name.
3. **Given** a player has a hot or cold streak indicator, **When** their streak is broken, **Then** the indicator is removed or updated based on the new consecutive sequence.
4. **Given** an ongoing event scoreboard, **When** a player wins a match, **Then** that player's score is visually emphasized with underlining for that result display.

---

### User Story 3 - Replace Weekly Winner Fire Badge with Crown (Priority: P3)

As a user viewing player recognition badges, I see a crown for recent event winners instead of a fire icon, so winner recognition is visually consistent with the existing winner symbol.

**Why this priority**: This is a visual consistency improvement and does not block core live-event operation.

**Independent Test**: Open any view that currently shows the "recent winner" badge and verify the fire symbol no longer appears there and a crown appears instead.

**Acceptance Scenarios**:

1. **Given** a player qualifies for the current "recent event winner" badge condition, **When** badges are rendered, **Then** a crown badge is shown for that condition instead of fire.
2. **Given** a player does not qualify for that condition, **When** badges are rendered, **Then** no replacement crown is shown for that condition.

### Edge Cases

- If a score correction changes a previous win/loss outcome, streak indicators are recalculated from the corrected sequence, not partially patched.
- If both players in a match were previously on streaks, and a correction reverses the result, both streak states update consistently.
- If an event has started but no results are recorded yet, "View Summary" still opens and shows an empty-or-initial summary state.
- If a host attempts to save an invalid score correction, the system rejects the save and keeps prior valid results unchanged.
- If two hosts edit the same result near-simultaneously, the system avoids silent overwrites and presents a clear conflict outcome.
- If a player qualifies for multiple badge types simultaneously, badge precedence and coexistence rules are applied consistently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace the current "recent event winner" fire badge with a crown badge wherever that specific recognition rule is displayed.
- **FR-002**: The system MUST keep the existing recent-winner qualification logic unchanged while only changing the displayed symbol for that rule.
- **FR-003**: During an ongoing event, the system MUST underline or otherwise clearly emphasize a winning score in the live score display.
- **FR-004**: During an ongoing event, the system MUST assign a hot-streak indicator (fire symbol) to a player once they reach 3 consecutive wins.
- **FR-005**: During an ongoing event, the system MUST assign a cold-streak indicator (snowflake symbol) to a player once they reach 3 consecutive losses.
- **FR-006**: The system MUST recompute streak indicators whenever new results are submitted or existing results are corrected.
- **FR-007**: The ongoing-event view MUST provide a "View Summary" action that expands an in-page summary panel without navigating away from the ongoing-event screen.
- **FR-008**: The inline summary panel MUST display the same core standings and score information that hosts rely on in the existing summary flow.
- **FR-009**: The inline summary panel MUST allow hosts to edit previously entered match scores for the ongoing event.
- **FR-010**: When a host saves a score edit, the system MUST persist the correction and recalculate standings and streak indicators before presenting updated values.
- **FR-011**: If a score edit cannot be saved, the system MUST show a clear error message and keep the previous saved score values unchanged.
- **FR-012**: Closing the inline summary panel MUST return the host to the same ongoing-event state (same event and round context) without resetting progress.
- **FR-013**: The system MUST enforce existing permissions for score editing so only authorized hosts/admin users can edit match results.
- **FR-014**: The system MUST maintain an auditable record that a score was corrected, including editor identity and correction time.

### Assumptions

- The existing definition of "recent event winner" (currently tied to the fire badge) remains the same; only its symbol changes to crown.
- "Three in a row" means three consecutive recorded match outcomes within the same ongoing event.
- Score corrections are allowed only for matches already recorded in the current event lifecycle and do not reopen completed events.
- The existing summary information model is sufficient for inline display; no new summary dimensions are required for this feature.

### Dependencies

- Existing ongoing-event result capture must remain available and reliable as the source for streak and summary calculations.
- Existing winner-recognition rule evaluation must remain available so the icon replacement can be applied to the same qualified players.

### Key Entities *(include if feature involves data)*

- **Player Streak State**: Tracks each player's current consecutive win/loss count in an ongoing event and the derived momentum indicator (none, hot, cold).
- **Inline Ongoing Summary**: The in-page summary view state for an active event, including standings, scores, visibility state, and edit availability.
- **Match Result Correction**: A host-submitted change to a previously saved match score, including original score, corrected score, editor identity, correction time, and recalculation outcome.
- **Recognition Badge**: A player-facing visual marker tied to a qualification rule (e.g., recent winner crown, hot streak, cold streak).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability validation, at least 95% of hosts can open and close the ongoing-event inline summary without leaving the event screen.
- **SC-002**: In score-correction test runs, 100% of valid inline summary edits immediately update displayed standings and streak indicators correctly after save.
- **SC-003**: In streak-rule validation scenarios, hot and cold indicators appear with at least 98% correctness for predefined consecutive-result sequences.
- **SC-004**: During pilot usage, host-reported interruptions caused by navigating away from an active event to check summary drop by at least 80%.
