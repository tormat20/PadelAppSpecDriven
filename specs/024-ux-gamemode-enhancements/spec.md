# Feature Specification: UX Fixes & Game Mode Enhancements

**Feature Branch**: `024-ux-gamemode-enhancements`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description covering UserMenu overlay fix, court card player name layout, open-event-in-new-window, Team Mexicano mode, pre-start event mode change, mid-event player substitute, removal of hardcoded Mexicano round cap, Mexicano tiebreaker rules, and game mode rules documentation.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — UserMenu Dropdown Visible Above Navigation (Priority: P1)

An admin or logged-in user taps the user-pill/avatar in the top navigation bar. A dropdown menu appears floating visually above all other page content (including the card-nav container), showing actionable items (Settings, Sign out). The user can read and click those items without any obstruction.

**Why this priority**: The UserMenu is entirely broken/unusable today — items are rendered but obscured by the navigation layer. This is a blocker for any auth-related action.

**Independent Test**: Log in, click the user pill in the top bar, confirm the dropdown floats above the card-nav, click "Sign out" and confirm the user is signed out.

**Acceptance Scenarios**:

1. **Given** a logged-in user on any page, **When** they click the user pill, **Then** a dropdown appears with all options fully visible and not clipped or hidden behind any other element.
2. **Given** the dropdown is open, **When** the user clicks "Sign out", **Then** the session ends and the user is returned to the login page.
3. **Given** the dropdown is open, **When** the user clicks anywhere outside the dropdown, **Then** the dropdown closes without performing any action.

---

### User Story 2 — Court Card Player Names Split Into Individual Rows (Priority: P1)

During an ongoing event, each court card displays two teams. Currently each team's two players appear together in a single clickable button, which stretches when names are long. After this change, each player appears in their own separate name box. Both boxes on a given side are stacked vertically, left-aligned, and have equal width. The pair of name boxes still represents the team and can be interacted with (e.g. for result entry selection).

**Why this priority**: Long player names break the layout today and make it hard to read matchups. This is visible on every court card in every ongoing event.

**Independent Test**: Start an event with players whose names are 10+ characters, navigate to the running event view, confirm each side of a court shows two separate, left-aligned, equal-width name boxes stacked vertically.

**Acceptance Scenarios**:

1. **Given** a court with players "Alba" + "Alice" vs "Astrid" + "Ebba", **When** the court card is displayed, **Then** each side shows two stacked name boxes (one per player), not one combined box.
2. **Given** two players with very long names on the same team, **When** the court card is displayed, **Then** neither name box exceeds a consistent fixed width; names that overflow truncate gracefully.
3. **Given** all courts in a round, **When** displayed, **Then** all player name boxes across all courts have the same width on the x-axis.
4. **Given** a player name box is clicked for team selection, **When** the user taps either player's box in a team, **Then** that entire team is selected/highlighted (both boxes activate as a unit).

---

### User Story 3 — Open Running Event in New Browser Window (Priority: P2)

When an admin clicks "Start" on a ready event, the running event view opens in a new browser window (popup/tab). The main application window remains on the event list or management screen. This allows one screen to show the live event while another is used for administration.

**Why this priority**: High operational value — event organisers frequently need to display the live scoreboard on a screen while managing the event on another device or window.

**Independent Test**: Click "Start" on a ready event, confirm a new window/tab opens showing the running event, confirm the original window remains on the management view.

**Acceptance Scenarios**:

1. **Given** a ready event, **When** the admin clicks "Start", **Then** the running event view opens in a new browser window and the original window stays on the management page.
2. **Given** a new window has opened for a running event, **When** round results are submitted in the new window, **Then** the event state updates correctly (no data loss from multi-window use).
3. **Given** the user's browser blocks popups, **When** "Start" is clicked, **Then** the app falls back gracefully by opening the event in the current window and may display an informational notice.

---

### User Story 4 — Team Mexicano Mode (Priority: P2)

A new "Team Mexicano" sub-mode is available when creating a Mexicano event. It is visually distinguished by an orange toggle/slider labelled "Team Mexicano". When enabled, partners are fixed for the entire event — players never rotate partners. The scoring rules are identical to standard Mexicano (play to 24 points). The event creation flow gains an additional step to assign players into fixed teams before starting.

**Why this priority**: A frequently requested variant that changes only the partner-assignment logic while reusing all other Mexicano infrastructure.

**Independent Test**: Create a Mexicano event, enable Team Mexicano, assign players to fixed pairs, start the event, play multiple rounds, confirm partners never change across rounds.

**Acceptance Scenarios**:

1. **Given** a new Mexicano event, **When** the "Team Mexicano" toggle is switched on, **Then** an additional "Assign Teams" step appears in the setup flow after the player assignment step.
2. **Given** Team Mexicano is enabled and teams are assigned, **When** the first round is generated, **Then** each fixed pair is kept together on the same side of a court.
3. **Given** subsequent rounds in Team Mexicano, **When** round scheduling runs, **Then** partner assignments are preserved — only court/opponent matchups rotate.
4. **Given** Team Mexicano is disabled, **When** setup continues, **Then** the "Assign Teams" step is absent and partner rotation behaves as standard Mexicano.

If the number of players assigned to a Team Mexicano event is odd, the event MUST NOT be startable. The organiser is shown a clear message explaining that Team Mexicano requires an even number of players, and prompted to add or remove a player before proceeding.

---

### User Story 5 — Change Event Mode Before Starting (Priority: P2)

Before an event is started, an organiser can change the event mode (e.g. from Mexicano to WinnersCourt) directly from the event detail/management screen. The change is only permitted while the event has not yet been started. All existing player assignments for the event are preserved; only the game mode rule-set changes.

**Why this priority**: Real-world sign-up numbers often differ from expectations — mode changes avoid having to delete and recreate events.

**Independent Test**: Create a Mexicano event, add players, then change the mode to WinnersCourt from the management screen before starting; confirm mode is updated and players are still assigned.

**Acceptance Scenarios**:

1. **Given** an event in "planned" or "ready" status, **When** the organiser selects a new event mode, **Then** the mode is updated and the event remains in its current status.
2. **Given** an event in "ongoing" or "finished" status, **When** the organiser attempts to change mode, **Then** the mode change option is not available (disabled or hidden).
3. **Given** a mode change from a mode with specific setup requirements (e.g. Team Mexicano fixed teams), **When** the new mode does not require those, **Then** any mode-specific setup data is discarded gracefully with no orphaned records.

---

### User Story 6 — Substitute Player Mid-Event (Priority: P2)

During an ongoing event, an organiser can replace a player who has to leave with a substitute. The substitute takes over the leaving player's court position from the next round onwards. Stats accumulated by the leaving player up to that point are preserved and frozen. The substitute's stats start fresh from the round they enter. The match history clearly attributes results to the correct player for each round.

**Why this priority**: Unavoidable in real events; without this, a player drop-out currently requires finishing or abandoning the entire event.

**Independent Test**: Start an event, complete one round, substitute one player, complete another round; confirm the leaving player's stats show only round 1 results and the substitute's stats show only round 2+ results.

**Acceptance Scenarios**:

1. **Given** an ongoing event, **When** the organiser triggers "Substitute player" for a specific player, **Then** they can select a replacement from the player catalogue or create a new player inline.
2. **Given** a substitution is confirmed, **When** the next round is generated, **Then** the substitute appears in place of the leaving player in all court assignments.
3. **Given** the event is finished, **When** the summary is viewed, **Then** the leaving player's stats reflect only the rounds they played and the substitute's stats reflect only their rounds.
4. **Given** a substitution is declared while a round is in progress, **When** that round's result is recorded, **Then** the result is attributed to the player who started that round.

---

### User Story 7 — Unlimited Rounds in Mexicano (Priority: P2)

The hard-coded maximum number of rounds in Mexicano events is removed. The "Next Round" button and the "Finish" button are always available after at least one round has been completed. The organiser decides when to end the event.

**Why this priority**: The current hard cap (6 rounds) frequently forces premature end of events that naturally run to 7 or 8 rounds.

**Independent Test**: Start a Mexicano event, complete 6 rounds, confirm "Next Round" is still available, complete a 7th and 8th round successfully, then finish the event.

**Acceptance Scenarios**:

1. **Given** a Mexicano event that has completed its previously-capped number of rounds, **When** the organiser views the event, **Then** "Next Round" is still available and functional.
2. **Given** any ongoing Mexicano event after at least one completed round, **When** the organiser views the event, **Then** both "Next Round" and "Finish" are always present and enabled.
3. **Given** a Mexicano event with 8+ completed rounds, **When** "Finish" is clicked, **Then** the event finalises normally and the full summary is displayed correctly.

---

### User Story 8 — Mexicano Tiebreaker Hierarchy (Priority: P2)

When two or more players have the same total score in Mexicano, the ranking applies a defined tiebreaker hierarchy:

1. Most wins (a win = a match where the player's team scored more than 12 points)
2. If still tied: highest single-match score (peak score across all matches played by that player)

**Why this priority**: Players frequently question ranking fairness when scores are equal. A transparent, consistent tiebreaker eliminates disputes.

**Independent Test**: Create a test scenario where players A and B end with equal total scores; confirm A ranks above B if A has more wins; if wins are also equal, confirm the player with the higher single-match score ranks higher.

**Acceptance Scenarios**:

1. **Given** players A (score 100, 5 wins) and B (score 100, 3 wins), **When** final rankings are displayed, **Then** A is ranked above B.
2. **Given** players A (score 100, 5 wins, best match 20) and B (score 100, 5 wins, best match 18), **When** final rankings are displayed, **Then** A is ranked above B.
3. **Given** players A and B with identical score, wins, and best-match score, **When** final rankings are displayed, **Then** they share the same rank.
4. **Given** an in-progress event leaderboard, **When** tiebreaker conditions exist mid-event, **Then** the same hierarchy is applied consistently.

---

### User Story 9 — Game Mode Rules Documentation (Priority: P3)

Three Markdown documentation files are created, one per game mode (Mexicano, WinnersCourt, RankedBox). Each file explains in plain language: the scoring rules, how players/teams are assigned to courts, partner rotation logic, tiebreaker rules, and any randomisation points. These files are committed to the repository.

**Why this priority**: Reduces organiser workload answering rules questions; builds player confidence in the fairness of the system.

**Independent Test**: Open each rules file; confirm it contains all required sections and is written in non-technical plain language understandable to a casual player.

**Acceptance Scenarios**:

1. **Given** the Mexicano rules file, **When** a player reads it, **Then** they can understand: how 24-point scoring works, how partners are assigned per round (best-with-worst among the 4 on each court), the no-repeat-partner rule, and the tiebreaker hierarchy (score → wins → best match).
2. **Given** the WinnersCourt rules file, **When** a player reads it, **Then** they can understand: court movement rules, how winners advance and losers drop, and how final rankings are derived.
3. **Given** the RankedBox rules file, **When** a player reads it, **Then** they can understand: the fixed-cycle scheduling, how RB score points are awarded (win/loss/draw), and how the ladder is ranked.

---

### Edge Cases

- What if a substitute player is already assigned to the same event under a different name/slot?
- What if "Change event mode" is attempted and the new mode requires a different number of players per court than currently assigned?
- What if the browser blocks the popup when opening a running event in a new window?
- What if a Team Mexicano event has an odd number of players and pairing is impossible?
- What if a Mexicano round has no valid partner assignment that avoids a repeated partner (e.g. very few players, many rounds played)?
- What if a substitute is introduced and the original player later returns — can the substitution be reversed?

---

## Requirements *(mandatory)*

### Functional Requirements

**UserMenu Fix**

- **FR-001**: The user dropdown menu MUST render in a stacking layer above all navigation and page-content elements so that its items are fully visible and interactive.
- **FR-002**: Clicking outside the open dropdown MUST close it without triggering any menu action.

**Court Card Player Name Layout**

- **FR-003**: Each player on a court card MUST be displayed in their own individual name box; two players may not share a single combined name container.
- **FR-004**: Player name boxes on the same side of a court MUST be stacked vertically.
- **FR-005**: All player name boxes across all courts in a round MUST have identical width in the horizontal direction.
- **FR-006**: Text in all player name boxes MUST be left-aligned.
- **FR-007**: Tapping either player's name box in a team MUST select the team as a whole (both boxes highlight together).

**Open Event in New Window**

- **FR-008**: Clicking "Start" on a ready event MUST attempt to open the running event view in a new browser window.
- **FR-009**: If the browser blocks the popup, the app MUST fall back to opening the event in the current window and MAY display an informational notice.

**Team Mexicano Mode**

- **FR-010**: A "Team Mexicano" toggle (visually styled in orange) MUST be available within the Mexicano event creation flow.
- **FR-011**: When Team Mexicano is enabled, the setup flow MUST include an "Assign Teams" step where players are paired into fixed teams before the event starts.
- **FR-012**: In Team Mexicano, fixed team pairs MUST be preserved across all rounds — per-round partner rotation is disabled.
- **FR-013**: All other Mexicano scoring rules (play to 24 points, court scheduling, tiebreakers) MUST apply unchanged in Team Mexicano mode.
- **FR-013a**: A Team Mexicano event MUST NOT be startable if the number of assigned players is odd; a clear message MUST be shown directing the organiser to add or remove a player.

**Pre-Start Event Mode Change**

- **FR-014**: An event in "planned" or "ready" status MUST expose a "Change Mode" control on its management screen.
- **FR-015**: The "Change Mode" control MUST be hidden or disabled for events in "ongoing" or "finished" status.
- **FR-016**: Changing the mode MUST preserve all existing player assignments on the event.
- **FR-017**: Mode-specific setup data that is incompatible with the new mode MUST be cleared gracefully.

**Mid-Event Player Substitute**

- **FR-018**: An organiser MUST be able to initiate a player substitution for any active player in an ongoing event.
- **FR-019**: The substitute MUST be selectable from the existing player catalogue or created inline as a new player.
- **FR-020**: The substitution MUST take effect from the next round; the current in-progress round is not affected.
- **FR-021**: Stats for the departing player MUST be preserved and frozen at the point of substitution.
- **FR-022**: Stats for the substitute MUST accumulate only from the rounds they participate in.

**Unlimited Mexicano Rounds**

- **FR-023**: The "Next Round" action in Mexicano MUST remain available after every completed round with no upper cap on round count.
- **FR-024**: The "Finish" action MUST be available at any point after at least one round has been completed.

**Mexicano Tiebreaker Hierarchy**

- **FR-025**: When two Mexicano players share the same total score, rankings MUST first be resolved by number of wins (matches where the player's team scored strictly more than 12 points).
- **FR-026**: If wins are also equal, rankings MUST be resolved by the player's highest single-match score.
- **FR-027**: If all tiebreaker values are equal, the players MUST share the same rank with no further ordering applied.
- **FR-028**: This tiebreaker hierarchy MUST apply to both in-progress leaderboards and final summaries.

**Game Mode Documentation**

- **FR-029**: Three documentation files MUST exist, one for each game mode: Mexicano, WinnersCourt, and RankedBox.
- **FR-030**: Each file MUST cover: scoring rules, court/team assignment logic, partner rotation logic (where applicable), tiebreaker rules, and any randomisation steps.
- **FR-031**: Documentation MUST be written in plain, non-technical language accessible to casual players.

### Key Entities

- **Team (Team Mexicano)**: A fixed pair of players in a Team Mexicano event. Persisted throughout the event. Linked to two player records and one event.
- **Substitution Record**: Captures departing player, incoming substitute, the event, and the round number at which the substitution takes effect. Used to attribute stats correctly.
- **Tiebreaker Context**: Derived values per player in Mexicano — total score, win count, best single-match score — used solely for ranking order resolution.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The UserMenu dropdown is fully visible and all items are clickable on every page with zero overlap with the card-nav layer.
- **SC-002**: Every court card in an ongoing event displays individual player name boxes that do not stretch beyond a consistent fixed width regardless of name length.
- **SC-003**: Clicking "Start" on a ready event opens the running event in a new window in 100% of cases where the browser permits popups; a fallback occurs in all other cases with no data loss.
- **SC-004**: A Team Mexicano event can be created, teams assigned, and all rounds completed without any player swapping partners across rounds.
- **SC-005**: An organiser can change the event mode of any pre-start event in under 10 seconds with no loss of player assignment data.
- **SC-006**: A substitute player can be introduced to an ongoing event in under 30 seconds; the departing player's historical stats remain unchanged and correctly attributed after substitution.
- **SC-007**: A Mexicano event reaches and finalises at round 8 or beyond; "Next Round" is available after every completed round without restriction.
- **SC-008**: In all Mexicano ranking scenarios, players with tied total scores are always ordered first by wins and then by best-match score — no arbitrary ordering occurs for tied scores.
- **SC-009**: All three game-mode documentation files are present, cover every required topic, and are readable by a non-technical player without confusion.

---

## Assumptions

- "Open in new window" uses the standard browser popup mechanism; no native app or Electron wrapper is involved.
- The existing Mexicano round-scheduling logic (best-with-worst pairing among the 4 players on a court, no-repeat-partner constraint) continues to apply in standard Mexicano. Team Mexicano bypasses per-round partner rotation entirely.
- "Change event mode" does not require re-validation of player counts against the new mode's court-size rules — that validation is handled at the existing "ready" status check point.
- A "win" for tiebreaker purposes is defined as the player's team scoring **strictly more than 12 points** in a single match (i.e. 13–24), regardless of the opponent's score.
- A substitute player does not need to already exist in the system — a new player record can be created inline during substitution.
- Documentation files are Markdown (`.md`) stored in the repository. In-app rendering or a help screen is out of scope for this feature.
- If a substitution is declared while a round is in progress, the result of that round is attributed to the player who started it; the substitute takes over from the next round only.
- Reversing a substitution (re-entering the original player) is out of scope for this feature.
