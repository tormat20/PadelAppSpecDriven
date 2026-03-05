# Feature Specification: Player Stats, Search & Monthly Leaderboards

**Feature Branch**: `022-player-stats-search`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "Player of the Month leaderboards and player search with statistics page"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Search for a Player and View Their Stats (Priority: P1)

A user opens the navigation menu, taps "Search Player" (the new 4th menu card), lands on a search page, types a name into the search bar and sees matching player names appear as they type. They tap a name and are taken to that player's statistics page showing all-time stats.

**Why this priority**: This is the entry point to the entire player statistics feature. Without it nothing else in this feature is reachable. It also adds standalone value as a player lookup tool.

**Independent Test**: Can be fully tested by navigating to "Search Player", searching for an existing player by partial name, selecting them, and verifying their statistics page loads with correct data.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user taps the "Search Player" menu card, **Then** they are taken to a dedicated search page with a text input and empty state.
2. **Given** the search page is open and players exist, **When** the user types one or more characters, **Then** a list of matching player names appears filtered in real time (prefix/substring match, case-insensitive).
3. **Given** a filtered list is showing, **When** the user types more characters, **Then** the list narrows to only names that still match the longer query.
4. **Given** a filtered list is showing, **When** the user taps a player name, **Then** they are taken to that player's statistics page.
5. **Given** no players match the typed query, **When** the user views the list, **Then** a "no players found" empty state is shown.

---

### User Story 2 – View Player Statistics Page (Priority: P1)

After selecting a player from search, the user sees a dedicated statistics page for that player. The page shows: total Mexicano points accumulated all-time; total Beat the Box score all-time; total number of events attended; total WinnersCourt matches played; a win/loss doughnut chart for WinnersCourt matches; a win/loss/draw doughnut chart for Beat the Box matches.

**Why this priority**: This is the core deliverable of the player stats concept. The search page is only meaningful if it leads somewhere useful.

**Independent Test**: Can be fully tested by navigating directly to a player stats page for a player with known event history, and verifying each stat value is correct.

**Acceptance Scenarios**:

1. **Given** a player has played Mexicano events, **When** their stats page is viewed, **Then** the all-time accumulated Mexicano score is shown and matches the sum of their scores across all finalized Mexicano events.
2. **Given** a player has played Beat the Box events, **When** their stats page is viewed, **Then** the all-time Beat the Box score is shown and a win/loss/draw doughnut chart is rendered.
3. **Given** a player has played WinnersCourt events, **When** their stats page is viewed, **Then** the number of matches played and a win/loss doughnut chart are shown.
4. **Given** a player has attended events of any type, **When** their stats page is viewed, **Then** the total events attended count is correct.
5. **Given** a player has no recorded stats yet, **When** their stats page is viewed, **Then** all counters show zero and charts show a graceful empty/placeholder state.

---

### User Story 3 – Player of the Month Leaderboard (Priority: P2)

From the home/menu page, the user sees a "Player of the Month" section showing a ranked list of all players ordered by: (1) number of events played this calendar month (descending), (2) total Mexicano points this month as a tiebreaker, (3) total Beat the Box score this month as a second tiebreaker.

**Why this priority**: High engagement and gamification value but depends on the stats data infrastructure from Stories 1 and 2 being in place first.

**Independent Test**: Can be fully tested by creating and finalizing multiple events in the current month, then verifying the leaderboard ordering matches the three-tier ranking rule.

**Acceptance Scenarios**:

1. **Given** events have been finalized this calendar month, **When** the home page is viewed, **Then** the Player of the Month leaderboard shows all participating players ranked by events-played count descending.
2. **Given** two players have the same events-played count, **When** the leaderboard is displayed, **Then** the player with the higher Mexicano points this month ranks higher.
3. **Given** two players are still tied after Mexicano points, **When** the leaderboard is displayed, **Then** the player with the higher Beat the Box score this month ranks higher.
4. **Given** no events have been finalized this calendar month, **When** the home page is viewed, **Then** the leaderboard shows an empty state message ("No games yet this month" or similar).
5. **Given** the calendar month rolls over, **When** the leaderboard is viewed in the new month, **Then** only events from the new calendar month are counted.

---

### User Story 4 – Mexicano Player of the Month Leaderboard (Priority: P2)

From the home/menu page, the user sees a "Mexicano Player of the Month" section showing a ranked list of players ordered by total Mexicano points accumulated across all finalized Mexicano events in the current calendar month.

**Why this priority**: Companion to Story 3; same infrastructure, slightly different ranking rule focused purely on Mexicano performance.

**Independent Test**: Can be fully tested by finishing multiple Mexicano events in the current month and verifying the leaderboard sums scores correctly and ranks the highest scorer first.

**Acceptance Scenarios**:

1. **Given** Mexicano events have been finalized this month, **When** the home page shows the Mexicano leaderboard, **Then** players are ranked by their total Mexicano points this month, highest first.
2. **Given** a player participated in multiple Mexicano events this month, **When** the leaderboard is shown, **Then** their score is the sum of their scores across all those events.
3. **Given** a player played only non-Mexicano events this month, **When** the Mexicano leaderboard is shown, **Then** they do not appear on this leaderboard.
4. **Given** no Mexicano events have been finalized this month, **When** the leaderboard is viewed, **Then** an empty state is shown.

---

### Edge Cases

- What happens when a player is registered but has never played? → They appear in search results; their stats page shows all zeros with graceful empty-chart states.
- What happens if an event was finalized and is viewed again later — does it re-credit stats? → No. Stats contributions are idempotent; each finalized event contributes exactly once per player.
- What if there is only one player on a leaderboard? → A single-row leaderboard is shown normally at rank #1.
- What if the month rolls over at midnight while the app is open? → Leaderboard data refreshes on next page load; no real-time month-boundary updates required.
- What if a WinnersCourt match has no result recorded? → That match is excluded from win/loss counting; only completed match results are counted.
- What if a doughnut chart has a 100%/0% split (e.g., all wins, no losses)? → Chart renders a full single-colour ring without errors or division-by-zero.
- What if the player stats page is loaded with no network connection? → An error state with a retry option is shown; no crash or blank screen.

---

## Requirements *(mandatory)*

### Functional Requirements

**Navigation**

- **FR-001**: The navigation menu MUST expose a 4th menu card labelled "Search Player" alongside the existing Create Event, View Events, and Register Player cards.
- **FR-002**: Tapping "Search Player" MUST navigate the user to a dedicated player search page.

**Player Search**

- **FR-003**: The search page MUST contain a text input that filters the full list of registered players in real time as the user types.
- **FR-004**: Filtering MUST be case-insensitive and match on any substring of the player's display name.
- **FR-005**: The filtered list MUST update with every keystroke without requiring a manual submit action.
- **FR-006**: Tapping a player name in the filtered list MUST navigate to that player's statistics page.
- **FR-007**: When the search query matches no players, an empty-state message MUST be shown.

**Player Statistics Page**

- **FR-008**: The player statistics page MUST display the player's display name as the page heading.
- **FR-009**: The page MUST show the player's all-time accumulated Mexicano points total (sum of scores from all finalized Mexicano events the player participated in).
- **FR-010**: The page MUST show the player's all-time Beat the Box score total.
- **FR-011**: The page MUST show the total number of distinct finalized events the player has attended (any event type).
- **FR-012**: The page MUST show the total number of WinnersCourt matches the player has played.
- **FR-013**: The page MUST render a doughnut/ring chart for WinnersCourt match results showing wins vs. losses.
- **FR-014**: The page MUST render a doughnut/ring chart for Beat the Box match results showing wins, losses, and draws.
- **FR-015**: When a player has no data for a chart category, the chart MUST render a graceful empty or zero state without errors.

**Stats Timing — When Stats Are Assigned**

- **FR-016**: Player statistics MUST only be updated when an event is **finalized**, not during in-progress rounds. This ensures each event contributes exactly once and prevents partial or volatile stats from appearing.
- **FR-017**: A finalized event's contribution to a player's stats MUST be idempotent — re-processing or re-viewing the event MUST NOT increment any stat counter a second time.

**Monthly Leaderboards (Home Page)**

- **FR-018**: The home page MUST display a "Player of the Month" leaderboard section ranking players by number of events played in the current calendar month (most first).
- **FR-019**: In the Player of the Month leaderboard, ties in events played MUST be broken first by Mexicano points this month (descending), then by Beat the Box score this month (descending).
- **FR-020**: The home page MUST display a "Mexicano Player of the Month" leaderboard section ranking players by total Mexicano points in the current calendar month (highest first).
- **FR-021**: Both monthly leaderboards MUST only count contributions from finalized events whose finalization date falls within the current calendar month.
- **FR-022**: When no qualifying data exists for the current month, each leaderboard MUST display an appropriate empty state message.
- **FR-023**: Each leaderboard row MUST show at minimum: rank position, player display name, and the primary ranking metric value.

### Key Entities

- **PlayerStats**: Represents a player's aggregate all-time statistics. Identified by player. Attributes: total Mexicano points all-time, total Beat the Box score all-time, total events attended, total WinnersCourt matches played, WinnersCourt wins, WinnersCourt losses, Beat the Box wins, Beat the Box losses, Beat the Box draws. Updated atomically when an event is finalized; each event contributes at most once per player.

- **MonthlyPlayerStats**: Represents a player's aggregate statistics scoped to a single calendar month (year + month). Attributes: events played this month, Mexicano points this month, Beat the Box score this month. Derived from the same finalization trigger as PlayerStats. Used exclusively for the monthly leaderboards.

- **PlayerSearchResult**: A lightweight read projection used by the search page — player ID and display name only, no stats payload.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate a specific player by name and reach their statistics page in 3 taps or fewer from the home screen.
- **SC-002**: The search input filters visible results with no perceptible delay — the list visibly updates within one animation frame of each keystroke for any realistic player roster (up to 500 players).
- **SC-003**: All statistics shown on a player's page are accurate to the most recently finalized event, with no manual refresh required after finalization.
- **SC-004**: Both monthly leaderboards correctly reflect the current calendar month's data at all times, including immediately after a month boundary.
- **SC-005**: Both doughnut charts render correctly for all valid data combinations, including 100%/0% splits, without visual errors or layout breakage.
- **SC-006**: A player with zero activity has a complete, error-free statistics page showing zero values rather than a blank or broken screen.
- **SC-007**: The "Search Player" menu card is visible in the navigation menu without scrolling or additional interaction to reveal it.

---

## Assumptions

- Stats are assigned at **event finalization only** (not during live rounds). This matches the user's stated preference and is the simplest correct model.
- "Calendar month" is defined as the calendar month in the server's local time zone. Multi-timezone handling is out of scope for this feature.
- WinnersCourt "win/loss" is determined per individual match within the event (not overall event placement). Per-match result data is assumed to be accessible from the existing match persistence layer.
- Beat the Box "win/loss/draw" per match is assumed to be derivable from the existing Beat the Box result model.
- All-time stats are computed from all finalized events ever recorded, regardless of when they occurred.
- Monthly leaderboards on the home page do not require pagination in the initial version; a scrollable full list is acceptable.
- The player statistics page is read-only; no editing or correction of stats is in scope.
- There is no authentication or privacy gating — any user of the app can view any player's stats page.
- The two doughnut charts (WinnersCourt win/loss and Beat the Box win/loss/draw) are the only charts in scope; additional chart types are deferred.
- The "Search Player" page lists all registered players as the initial state before any query is typed (or shows an empty prompt — either is acceptable).
