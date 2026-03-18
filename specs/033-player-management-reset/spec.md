# Feature Specification: Player Management & Reset Controls

**Feature Branch**: `033-player-management-reset`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Account settings: reset all player stats, remove all players. Player search: show name/email, edit mode with per-player delete and confirmation dialogs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reset All Player Stats (Priority: P1)

An admin on the Account Settings page wants to wipe all accumulated stats (scores, wins, losses, leaderboard data) for every player — for example at the start of a new season — without removing the players themselves. They click "Reset Player Stats", confirm the action in a dialog, and all stats are zeroed while the player roster stays intact.

**Why this priority**: Seasonal resets are a common need and the safest destructive action — players remain, only accumulated numbers are cleared. Delivers immediate value without requiring the more complex player-deletion flow.

**Independent Test**: Navigate to Account Settings, click "Reset Player Stats", confirm the dialog, then visit Player Search and verify all players still appear but their stats are zeroed.

**Acceptance Scenarios**:

1. **Given** the Account Settings page is open, **When** the user clicks "Reset Player Stats", **Then** a confirmation dialog appears asking "Are you sure? This will clear all stats for every player." with "Yes, reset" and "Cancel" buttons.
2. **Given** the confirmation dialog is open, **When** the user clicks "Cancel", **Then** the dialog closes and no data is changed.
3. **Given** the confirmation dialog is open, **When** the user clicks "Yes, reset", **Then** all player stats (scores, wins, losses, leaderboard totals) are cleared, the dialog closes, and a success message is shown.
4. **Given** stats have been reset, **When** the user visits the player search page, **Then** all players are still listed and their stats show as zero/empty.

---

### User Story 2 - Remove All Players (Priority: P2)

An admin wants a completely fresh start — removing every player from the system entirely along with all their associated data. They click "Remove All Players", read the stronger warning in the confirmation dialog, confirm, and the entire player roster and all related data is deleted.

**Why this priority**: More destructive than a stats reset and less frequently needed. Blocked behind a clearer warning to reduce risk of accidental use.

**Independent Test**: Navigate to Account Settings, click "Remove All Players", confirm the dialog, then visit Player Search and verify the list is empty.

**Acceptance Scenarios**:

1. **Given** the Account Settings page is open, **When** the user clicks "Remove All Players", **Then** a confirmation dialog appears with a strong warning: "Are you sure? This will permanently delete all players and all associated data. This cannot be undone." with "Yes, delete all" and "Cancel" buttons.
2. **Given** the confirmation dialog is open, **When** the user clicks "Cancel", **Then** the dialog closes and no data is changed.
3. **Given** the confirmation dialog is open, **When** the user clicks "Yes, delete all", **Then** every player and all their associated data is deleted, the dialog closes, and a success message is shown.
4. **Given** all players have been deleted, **When** the user visits the player search page, **Then** the empty state is shown with no players listed.

---

### User Story 3 - Richer Player Search Rows (Priority: P3)

A user browsing the Player Search page sees each player's first name, surname, and email address in the search result rows — making it easier to identify the correct player when names are similar.

**Why this priority**: Non-destructive display enhancement. Adds clarity without blocking any other functionality.

**Independent Test**: Navigate to Player Search and verify each result row displays first name, surname, and email.

**Acceptance Scenarios**:

1. **Given** the Player Search page is open, **When** players are listed, **Then** each row shows the player's first name, surname, and email address.
2. **Given** a player has no email address, **When** they appear in search results, **Then** the email field is shown as blank — no crash or missing row.
3. **Given** the search input is used, **When** a query is typed, **Then** results are filtered across first name, surname, and email (a match in any field returns the player).

---

### User Story 4 - Per-Player Delete in Search (Priority: P4)

A user on the Player Search page can switch into edit mode by clicking an "Edit" button in the top-right of the player list panel. In edit mode a "−" remove button appears next to each player. Clicking "−" for a specific player shows a confirmation dialog before permanently deleting that player and all their data.

**Why this priority**: Fine-grained single-player deletion is less urgent than bulk operations but important for correcting individual mistakes such as duplicate entries or test players.

**Independent Test**: Navigate to Player Search, click "Edit", click "−" next to one player, confirm the dialog, and verify only that player is removed while others remain.

**Acceptance Scenarios**:

1. **Given** the Player Search page is open, **When** the user clicks "Edit", **Then** the list enters edit mode: a "−" remove button appears next to every player row and the "Edit" button changes to "Done".
2. **Given** edit mode is active, **When** the user clicks "Done", **Then** edit mode exits and all "−" buttons disappear.
3. **Given** edit mode is active, **When** the user clicks "−" next to a player, **Then** a confirmation dialog appears: "Remove [Player Name]? This will permanently delete this player and all their data." with "Yes, remove" and "Cancel" buttons.
4. **Given** the per-player confirmation dialog is open, **When** the user clicks "Cancel", **Then** the dialog closes and the player is not deleted.
5. **Given** the per-player confirmation dialog is open, **When** the user clicks "Yes, remove", **Then** the player is deleted and removed from the list without a page reload.
6. **Given** edit mode is active and a search filter is applied, **When** a player is deleted, **Then** only that player is removed; all other filtered results remain.

---

### Edge Cases

- What happens when "Reset Player Stats" is triggered but there are no stats to reset? → Operation succeeds silently; success message still shown.
- What happens when "Remove All Players" is triggered but the player list is already empty? → Operation succeeds silently; success message still shown.
- What happens if a network error occurs mid-operation? → An error message is shown; the dialog remains open or re-opens so the user can retry. No partial state is silently left behind.
- What happens when a player being individually deleted is part of an active ongoing event? → Deletion is always allowed. The player and all their records are removed; the active event may show a missing player slot but continues uninterrupted.

## Requirements *(mandatory)*

### Functional Requirements

**Account Settings — Stats Reset**

- **FR-001**: The Account Settings page MUST include a "Reset Player Stats" button.
- **FR-002**: Clicking "Reset Player Stats" MUST open a confirmation dialog before any data is changed.
- **FR-003**: The confirmation dialog MUST present "Yes, reset" and "Cancel" options.
- **FR-004**: Confirming MUST clear all player statistics (scores, wins, losses, leaderboard totals) for every player.
- **FR-005**: The player roster MUST remain intact after a stats reset — only accumulated stats are cleared.
- **FR-006**: A success message MUST be shown after a successful stats reset.

**Account Settings — Remove All Players**

- **FR-007**: The Account Settings page MUST include a "Remove All Players" button.
- **FR-008**: Clicking "Remove All Players" MUST open a confirmation dialog with a prominent destructive warning before any data is changed.
- **FR-009**: The confirmation dialog MUST present "Yes, delete all" and "Cancel" options.
- **FR-010**: Confirming MUST permanently delete every player and all data associated with them.
- **FR-011**: A success message MUST be shown after successful removal.

**Player Search — Richer Rows**

- **FR-012**: Each player row in the search results MUST display the player's first name, surname, and email address.
- **FR-013**: The search filter MUST match against first name, surname, and email — a match in any field returns the player.

**Player Search — Edit Mode & Per-Player Delete**

- **FR-014**: The player list panel MUST include an "Edit" button in its top-right corner.
- **FR-015**: Clicking "Edit" MUST reveal a "−" remove button on every player row and change "Edit" to "Done".
- **FR-016**: Clicking "Done" MUST exit edit mode and hide all "−" buttons.
- **FR-017**: Clicking "−" on a player row MUST open a per-player confirmation dialog naming the specific player.
- **FR-018**: The per-player confirmation dialog MUST present "Yes, remove" and "Cancel" options.
- **FR-019**: Confirming MUST permanently delete that player and all their associated data.
- **FR-020**: After deletion the player MUST disappear from the list without a full page reload.
- **FR-021**: Cancelling any confirmation dialog MUST leave all data unchanged.

### Key Entities

- **Player**: A registered participant with first name, surname, email, and accumulated stats. Deletion removes the player and all related records.
- **Player Stats**: Aggregated scores, wins, losses, and leaderboard totals tied to a player. Can be zeroed independently of the player record.
- **Confirmation Dialog**: A modal prompt requiring explicit user acknowledgement before any destructive action proceeds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can complete a full stats reset in under 30 seconds from opening Account Settings to seeing the success message.
- **SC-002**: An admin can remove all players in under 30 seconds from opening Account Settings to seeing the success message.
- **SC-003**: No destructive action (reset or delete) can be triggered with a single click — a confirmation step is always required.
- **SC-004**: A user can identify a specific player in search results by name and email without navigating away from the search page.
- **SC-005**: A user can delete a single player in under 15 seconds from entering edit mode to seeing confirmation of deletion.
- **SC-006**: Cancelling any confirmation dialog leaves the system state completely unchanged — verifiable by inspecting data before and after cancel.

## Assumptions

- Only users with admin role can access Account Settings and the destructive reset/delete controls. Non-admin users do not see these buttons.
- "All associated data" for player deletion includes stats, leaderboard entries, and event-player participation records. Historical event results already recorded are not rolled back.
- The two Account Settings actions are separate buttons and cannot be triggered simultaneously.
- Edit mode in Player Search is a UI-only toggle — navigating away from the page resets to normal (non-edit) mode.
- Confirmation dialogs are modal — the user cannot interact with the page behind them until dismissed.
