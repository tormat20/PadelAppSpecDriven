# Feature Specification: Tournament Engine and Round Summary Overhaul

**Feature Branch**: `001-tournament-engine-summary`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Spec A: Tournament engine and summary overhaul. Final summary must be per round (R1..RN + Total), not per match columns. Top court is always the highest selected court number for that event. Americano has no draws: winner required for every match; winners move up one court, losers move down one court, clamped at top/bottom selected courts. Mexicano: rank by cumulative points, top 4 players go to highest court group, next 4 to next court, etc; re-pair each round so no one has the same partner as previous round. BeatTheBox: rotate partners only within each court group, no inter-court movement. Keep existing scoring formulas unless explicitly changed"

## Clarifications

### Session 2026-02-27

- Q: How should Mexicano ties on cumulative points be broken before court grouping? → A: Use previous round rank, then player ID.
- Q: Which BeatTheBox partner-rotation rule should be enforced? → A: Use fixed 3-round cycle per quartet.
- Q: How should Americano court-overflow conflicts be resolved if too many players target one court? → A: Hard-cap each court at 4 players and randomly spill overflow to adjacent courts.
- Q: How should round cells be represented in the final summary across modes? → A: Use numeric points in round cells for all modes.
- Q: How should Americano overflow randomness coexist with deterministic output requirements? → A: Use pseudo-random spill with a fixed event seed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct Court Movement by Mode (Priority: P1)

As a host running an event, I need next-round assignments to follow mode-specific movement rules so players are placed on the correct courts and the event stays fair.

**Why this priority**: If round transitions are wrong, the core event flow becomes invalid regardless of how scores are displayed.

**Independent Test**: Create one event for each mode, complete one full round, trigger next round, and verify that each player's next-court assignment follows the mode's movement rules and event-specific top/bottom court limits.

**Acceptance Scenarios**:

1. **Given** an Americano event with selected courts, **When** all results are submitted and next round is generated, **Then** winners move exactly one court toward the highest selected court and losers move exactly one court toward the lowest selected court, with no movement beyond bounds.
2. **Given** an Americano event, **When** a result is submitted, **Then** the result must identify a winner and cannot be stored as a draw.
3. **Given** a Mexicano event with cumulative player totals, **When** next round is generated, **Then** players are ranked by total points and grouped in sets of four from highest rank to lowest rank, assigned from highest selected court downward.
4. **Given** a BeatTheBox event, **When** next round is generated, **Then** players remain in their court group and only partner rotation changes within that group.

---

### User Story 2 - Partner Rotation Integrity (Priority: P2)

As a host, I need partner assignments to rotate predictably so players do not repeat the same partner in consecutive rounds when the mode rules require partner changes.

**Why this priority**: Correct court movement still feels unfair if partner variety rules are violated.

**Independent Test**: Run two consecutive rounds in Mexicano and BeatTheBox; compare each player's partner in round N vs round N+1 and verify immediate partner repetition does not occur where prohibited.

**Acceptance Scenarios**:

1. **Given** a Mexicano event, **When** next round pairings are generated, **Then** no player is paired with the same partner they had in the immediately previous round.
2. **Given** a BeatTheBox event, **When** multiple rounds are generated, **Then** partner rotation stays inside each court group and follows a deterministic rotation pattern.

---

### User Story 3 - Round-Based Final Summary (Priority: P3)

As a host reviewing finished events, I need final summary columns by round instead of by match so I can quickly evaluate round-by-round performance.

**Why this priority**: This is highly visible and improves interpretation, but event correctness depends first on movement and pairing rules.

**Independent Test**: Finish an event with at least 3 rounds and verify the final summary table shows one column per round plus total, with correct per-player round values.

**Acceptance Scenarios**:

1. **Given** a finished event, **When** the final summary is loaded, **Then** columns appear as `R1...RN` and `Total`, with no `M1...MK` match-level columns.
2. **Given** any player in the final summary, **When** round values are displayed, **Then** each round cell reflects that player's round contribution under that mode's scoring output.

---

### Edge Cases

- Event uses non-contiguous courts (for example `2,4,5`): movement still uses selected-court ordering, with top defined as the highest selected number and bottom as the lowest selected number.
- Event has only one active court group: court movement requests resolve within the same top/bottom boundary without invalid court assignments.
- Americano overflow on a target court is resolved by pseudo-random spill to adjacent valid courts using a fixed event seed.
- Players tied on cumulative totals in Mexicano: ties are resolved deterministically so next-round generation is stable and repeatable.
- A round cannot advance while any match is pending: no movement or re-pairing is generated until all required results are complete.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate next-round assignments according to the event mode (Americano, Mexicano, BeatTheBox) using event-selected courts as the only valid court set.
- **FR-002**: System MUST treat the highest selected court number as the top court and the lowest selected court number as the bottom court for all movement rules.
- **FR-003**: System MUST require a winner for Americano results and MUST reject any Americano draw outcome.
- **FR-004**: System MUST move Americano winners one court toward the top court and losers one court toward the bottom court, clamping movement at bounds.
- **FR-004a**: System MUST cap each Americano court group at 4 players when generating next-round assignments.
- **FR-004b**: If more than 4 players target the same Americano court, System MUST spill overflow players to adjacent valid courts using pseudo-random selection seeded by event identity so identical input state yields identical assignments.
- **FR-005**: System MUST rank Mexicano players by cumulative event points before each new round and assign quartets from highest rank to lowest rank, mapped from top court downward.
- **FR-005a**: System MUST break Mexicano cumulative-point ties by previous round rank, and then by player ID when still tied.
- **FR-006**: System MUST ensure Mexicano next-round partner assignment does not repeat a player's immediate previous-round partner.
- **FR-007**: System MUST keep BeatTheBox players within their current court group across rounds and MUST rotate partners within that group only.
- **FR-007a**: System MUST enforce BeatTheBox quartet rotation cycle as `AB vs CD` in cycle round 1, `AC vs BD` in cycle round 2, and `AD vs BC` in cycle round 3, repeating this cycle for later rounds.
- **FR-008**: System MUST keep existing scoring formulas unchanged unless explicitly overridden by a future approved requirement.
- **FR-009**: System MUST present finished-event summary columns by round (`R1...RN`) plus `Total`, replacing match-index columns.
- **FR-009a**: System MUST render round cell values as numeric points for all modes so each player's `Total` is the numeric sum of round cells.
- **FR-010**: System MUST provide deterministic next-round and summary outputs for identical input state.

### Key Entities *(include if feature involves data)*

- **Court Ladder**: Ordered list of selected courts for one event, defining top/bottom bounds and legal movement targets.
- **Round Assignment**: Per-round mapping of player-to-court-group and team partner relationships.
- **Partner History**: Immediate prior-round partner linkage used to prevent prohibited repeat pairings.
- **Mode Movement Rule Set**: Policy object defining how players move and pair between rounds for each mode.
- **Round Summary Matrix**: Final report structure containing players, per-round values (`R1...RN`), and total.

### Assumptions

- Tied cumulative totals for Mexicano are broken by previous round rank, then player ID.
- If strict no-repeat pairing constraints cannot be fully satisfied in a constrained group, the system applies the minimal-repeat deterministic fallback and records a valid round assignment.
- Americano overflow rebalancing uses pseudo-random spill seeded by event identity.
- BeatTheBox partner rotation expects complete court groups for active matches.
- BeatTheBox uses a fixed repeating 3-round partner cycle per quartet.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance tests for all three modes, 100% of next-round assignments match the defined movement rules for the selected court set.
- **SC-002**: In Mexicano and BeatTheBox validation scenarios, 100% of players avoid immediate partner repetition when a valid non-repeating pairing exists.
- **SC-003**: In finished-event summary validation, 100% of generated columns use round labels (`R1...RN`) plus `Total`, with zero match-index labels, and 100% of round cells are numeric.
- **SC-004**: In repeated runs with identical event state, next-round assignments and summary outputs are identical in 100% of runs.
