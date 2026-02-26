# Feature Specification: Padel Host Event Operations MVP

**Feature Branch**: `002-padel-host-app-mvp`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Padel Host App - Event Hosting (MVP)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run an event from setup to finish (Priority: P1)

A host creates an event, adds players, starts play, records results for each court, advances rounds, and finishes the event with final standings and round history.

**Why this priority**: This is the core product value and must work end-to-end for the app to be usable at all.

**Independent Test**: Can be fully tested by running one complete event in each mode and verifying that rounds, results, standings, and history are persisted and visible.

**Acceptance Scenarios**:

1. **Given** the host is in Lobby with valid event details and enough players, **When** the host creates and starts the event, **Then** the system shows round 1 assignments for all selected courts.
2. **Given** a running round with all matches completed, **When** the host clicks Next Match, **Then** the system generates and displays the next round using the selected mode rules.
3. **Given** the final round is complete, **When** the host clicks Finish Event, **Then** the system shows final standings and full match history for the event.

---

### User Story 2 - Enter results quickly during live play (Priority: P2)

A host enters results per court with low friction so rounds can advance without delay.

**Why this priority**: Live event flow depends on fast input; slow or error-prone entry reduces trust and usability.

**Independent Test**: Can be tested by entering valid and invalid results across all modes and verifying completion status and score updates.

**Acceptance Scenarios**:

1. **Given** an Americano match is in progress, **When** the host selects the winning team, **Then** the match is marked completed and player round points are updated.
2. **Given** a Mexicano match is in progress, **When** the host enters a score split that sums to 24, **Then** the match is marked completed and each player receives their team's score for the round.
3. **Given** a Beat the Box match is in progress, **When** the host selects win, loss, or draw, **Then** the match is marked completed and global ranking points are applied.

---

### User Story 3 - Share clear court assignments with players (Priority: P3)

Players can view a shared running screen to see court number, teams, and who partners with whom for the current round.

**Why this priority**: This is secondary to host control, but critical to reduce confusion and keep matches starting on time.

**Independent Test**: Can be tested by starting an event and verifying all selected courts and pairings are visible and updated each round.

**Acceptance Scenarios**:

1. **Given** an event is running, **When** the round view is displayed, **Then** all selected courts are visible with court number and both teams.
2. **Given** the host advances to the next round, **When** new assignments are generated, **Then** the shared view reflects the updated pairings and courts.

---

### Edge Cases

- Host selects players that are not divisible by 4 for the selected courts.
- Host selects more courts than can be filled by available players.
- Host attempts to start an event with missing required setup data.
- Host attempts to advance round before all court results are completed.
- Host enters an invalid Mexicano score that does not sum to 24.
- Mexicano next-round partner rules cannot be satisfied perfectly due to player count or prior pairings.
- Americano court movement reaches highest or lowest court boundaries.
- Beat the Box has players with equal global ranking at box boundaries.
- Event is interrupted mid-round and later reopened; prior saved state must remain consistent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a host to create an event with event name, event type (Americano, Mexicano, Beat the Box), event date, selected courts, and selected players.
- **FR-002**: System MUST support adding players to an event from both newly created player records and existing player records.
- **FR-003**: System MUST enforce that matches are formed as 2v2 groups of 4 players on each active court per round.
- **FR-004**: System MUST present event lifecycle states that include Lobby, Preview, Running, and Finished.
- **FR-005**: System MUST provide a Preview screen showing event metadata, selected courts, and player list before event start.
- **FR-006**: System MUST generate round 1 assignments according to the selected event mode when the host starts the event.
- **FR-007**: System MUST show all selected courts at once during Running, including court number and team composition for each court.
- **FR-008**: System MUST support mode-specific result entry: Americano team win/loss, Mexicano score split totaling 24, and Beat the Box win/loss/draw.
- **FR-009**: System MUST mark a match as completed immediately after a valid result is entered.
- **FR-010**: System MUST update per-player round scoring based on mode rules when results are entered.
- **FR-011**: System MUST apply Beat the Box global ranking updates with +25 win, -15 loss, and +5 draw and persist those updates across events.
- **FR-012**: System MUST enable the Next Match action only when all matches in the current round are completed.
- **FR-013**: System MUST generate next-round assignments per mode rules when Next Match is activated.
- **FR-014**: System MUST apply Americano movement rules where winners move up one court, losers move down one court, and winners on the highest court remain there.
- **FR-015**: System MUST apply Mexicano round progression by ranking players by round score and regrouping into successive matches of four players.
- **FR-016**: System MUST prevent identical partner repetition for the same player in consecutive Mexicano rounds when a valid alternative pairing exists.
- **FR-017**: System MUST apply Beat the Box format as 3 rounds per box where each player partners with different players across the 3 rounds.
- **FR-018**: System MUST enforce fixed event duration structures: Americano and Mexicano use 6 rounds of 15 minutes, Beat the Box uses 3 rounds of 30 minutes.
- **FR-019**: System MUST allow hosts to finish an event only after the final round is completed.
- **FR-020**: System MUST show an event summary containing final standings, per-round player results, and all match records with court and team details.
- **FR-021**: System MUST persist event metadata, players, rounds, matches, entered results, and event-level player scoring for every event.
- **FR-022**: System MUST retain historical event and match data so completed events remain available for future review.
- **FR-023**: System MUST allow event creation only when the number of selected players equals `selected_courts * 4` for all event modes.
- **FR-024**: System MUST calculate Mexicano standings using cumulative points across rounds within the same event only and MUST reset totals for new events.
- **FR-025**: System MUST not apply tie-break rules; tied players remain tied in standings.
- **FR-026**: System MUST assign Beat the Box boxes deterministically by global ranking descending, then by `created_at`, then by `player_id`, and map boxes to selected courts in ascending court-number order.
- **FR-027**: System MUST allow result corrections only while the event is Running and the affected round is not finalized; score aggregates MUST be recomputed from persisted match outcomes after each correction.

### Key Entities *(include if feature involves data)*

- **Player**: A participant with persistent identity and persistent global ranking score used by Beat the Box.
- **Event**: A hosted session with name, type, date, selected courts, participating players, status, and generated rounds.
- **Court**: One of seven globally available courts; events use a selected subset.
- **Round**: A numbered stage of an event containing one match per active court and round-level completion status.
- **Match**: A 2v2 contest tied to one court and one round, including teams, result input, and completion marker.
- **PlayerRoundScore**: Per-player scoring outcome for a round in the event.
- **EventStanding**: Per-player total ranking within an event at event completion.
- **GlobalRankingLedger**: Record of Beat the Box ranking adjustments applied to players across events.

### Assumptions

- MVP supports a single host workflow and a shared display view; no separate player login is required.
- Minimum playable event requires at least one full court (4 players).
- If player count exceeds available court slots, overflow players are out of scope for this MVP and must be excluded before event start.
- When Mexicano partner non-repetition cannot be fully satisfied, the system uses the best available valid arrangement and records that constraint handling.

## Clarifications Addendum

- Tie handling: no tie-break rules are applied for any mode; ties remain ties in standings.
- Mexicano scoring scope: round scores accumulate across the 6 rounds of a single event only; scores do not carry between events.
- Event creation gate: Create Event remains disabled unless `players = selected_courts * 4`.
- Beat the Box deterministic defaults: sort by global ranking descending, then `created_at`, then `player_id`; map Box 1..N to selected courts in ascending order.
- Result update defaults: corrections are allowed only before finalizing progression; each correction triggers recomputation of round/event/global totals from saved match results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Hosts can complete full event flow (Lobby to Summary) without manual data correction in at least 95% of rehearsal runs.
- **SC-002**: For events with up to 28 players (7 courts), round assignments are visible to host and players within 3 seconds after Start Event and Next Match actions.
- **SC-003**: At least 90% of match results are entered in under 10 seconds per court during host usability validation.
- **SC-004**: 100% of completed events retain full round and match history retrievable after event completion.
- **SC-005**: Beat the Box global ranking updates are correctly persisted and reflected in subsequent events for 100% of tested players.
