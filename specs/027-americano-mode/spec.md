# Spec 027 — Americano Game Mode

**Feature Branch**: `027-americano-mode`
**Created**: 2026-03-08
**Status**: Draft
**Input**: Add Americano as a new event mode. Americano is a social padel format where all rounds are pre-computed at event start using a Whist tournament schedule, guaranteeing each player partners with every other player exactly once (for supported counts). Scoring is identical to Mexicano (scores sum to 24). Supported player counts: any multiple of 4. Optimal Whist schedules for 8, 12, 16 players; Berger-table circle rotation fallback for other multiples of 4. Round count is fixed by player count (N-1 rounds for optimal counts; `(adjusted_N - 1)` for fallback). Finish-early allowed. Result input and leaderboard identical to Mexicano.

## Clarifications

### Session 2026-03-08

- Q: Should round count be fixed or operator-chosen? → A: Fixed by player count; operator can finish early at any point.
- Q: Which player counts are supported? → A: Any multiple of 4; non-multiples of 4 blocked at setup.
- Q: Should result input differ from Mexicano? → A: No — identical Score24 widget.
- Q: Should the summary differ from Mexicano? → A: No — same ranked-by-total-points layout.
- Q: Finish early allowed? → A: Yes — same as Mexicano, Finish button available after any completed round.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create and Run a Full Americano Event (Priority: P1)

As an organiser, I can create an Americano event, start it, submit results each round, and advance through all pre-computed rounds until I finish the event or choose to finish early.

**Why this priority**: This is the entire happy path. Everything else is a variant of it.

**Independent Test**: Create an Americano event with 8 players on 2 courts. Start it. Verify 7 rounds are pre-computed and stored. Submit results for round 1 (each court, scores summing to 24). Advance to round 2. Repeat. Finish the event. Verify the summary shows a ranked leaderboard by total points.

**Acceptance Scenarios**:

1. **Given** an Americano event with 8 players, **When** I start it, **Then** all 7 rounds are generated upfront and persisted; the event is `ongoing` and round 1 is the current round.
2. **Given** an ongoing Americano event, **When** I submit scores on every court (each pair summing to 24), **Then** the Next Round button becomes active.
3. **Given** all results are submitted in the current round, **When** I press Next Round, **Then** the pre-stored next round is loaded — no new scheduling occurs.
4. **Given** an Americano event with 12 players, **When** it is started, **Then** 11 rounds are generated (one per `N-1` round count rule).
5. **Given** an Americano event with 16 players, **When** it is started, **Then** 15 rounds are generated.
6. **Given** an Americano event with 20 players (Berger fallback), **When** it is started, **Then** rounds are generated using circle rotation (19 rounds) and every player partners with every other player exactly once.

---

### User Story 2 — Americano Appears in Setup and Is Selectable (Priority: P2)

As an organiser, I can choose Americano as the event mode during event creation, see a correct player-count requirement, and be blocked if player count is not a multiple of 4.

**Why this priority**: Mode selection and validation are gates that must work before any event can run.

**Independent Test**: Open Create Event, select Americano. Verify the roster requirement shows courts × 4. Try to set 10 players on 2 courts — verify a validation error prevents starting. Set 8 players on 2 courts — verify it passes.

**Acceptance Scenarios**:

1. **Given** I am on the Create Event mode selector, **When** I view the mode options, **Then** Americano appears as a selectable mode alongside WinnersCourt, Mexicano, and RankedBox.
2. **Given** Americano is selected, **When** I configure 2 courts, **Then** the roster hint shows exactly 8 players required.
3. **Given** Americano is selected with 9 players on 2 courts, **When** I try to start the event, **Then** setup validation blocks it with a clear error message (player count must be a multiple of 4).
4. **Given** Americano is selected with 8 players on 2 courts, **When** setup is complete, **Then** the event status is `ready` and `Start Event` is available.
5. **Given** an Americano event is created and in the event slot list, **When** I view the list, **Then** the mode label reads "Americano".

---

### User Story 3 — Score Input and Summary Identical to Mexicano (Priority: P3)

As an organiser running an Americano event, I can enter scores using the same Score24 input widget, and see a ranked leaderboard in the summary identical in layout to Mexicano.

**Why this priority**: Scoring correctness and summary correctness are required for a usable event, but are secondary to the scheduling being correct.

**Independent Test**: In an ongoing Americano event, open the result modal for a match — verify it shows the Score24 input (1–23 slider/selector, auto-complement). Finish the event. Verify the summary page shows players ranked by total accumulated points, with ties broken by match wins then point differential.

**Acceptance Scenarios**:

1. **Given** an Americano match result modal is open, **When** I inspect the input, **Then** it shows the Score24 widget (scores for each team, pair summing to 24) — identical to Mexicano.
2. **Given** I enter a score of 15 for team 1, **Then** team 2 auto-shows 9 (24 − 15).
3. **Given** an Americano event is finished, **When** I open the summary, **Then** players are ranked by total points with ties broken by match wins, then point differential.
4. **Given** a 12–12 draw score is entered, **When** the result is submitted, **Then** both teams receive 12 points each and `is_draw = true` is stored.

---

### Edge Cases

- Player count is not a multiple of 4 (e.g. 9, 10): setup validation blocks `ready` status and `Start Event` is unavailable.
- Organiser presses Finish before all rounds are complete: event finishes immediately; partial summary is shown with rounds played so far.
- Organiser resumes an ongoing Americano event after navigating away: pre-stored round data is re-loaded from backend, no re-scheduling.
- Scores of 0–24 and 24–0 are valid; 13–12 (sum ≠ 24) is rejected.
- After all N-1 rounds are completed, "Next Round" is replaced by "Finish" (same as WinnersCourt).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `Americano` as a valid `EventType` in backend enum and frontend type union.
- **FR-002**: System MUST generate all rounds for an Americano event at `start_event()` time and persist them before returning a response.
- **FR-003**: System MUST use the Whist schedule for 8 players (7 rounds, 2 courts), 12 players (11 rounds, 3 courts), and 16 players (15 rounds, 4 courts).
- **FR-004**: System MUST use the Berger-table circle rotation fallback for any other multiple-of-4 player count, producing `N-1` rounds.
- **FR-005**: System MUST block `ready` status and `Start Event` for Americano events where player count is not a multiple of 4.
- **FR-006**: System MUST apply the court-rotation optimization pass (minimize same-court repeats) to Americano schedules, identical to the reference implementation.
- **FR-007**: System MUST use `Score24` result type for Americano: both team scores required, must sum to exactly 24, each score in range 0–24.
- **FR-008**: System MUST accumulate raw team scores as individual player points for the in-event leaderboard, identical to Mexicano scoring.
- **FR-009**: System MUST advance to the next pre-stored round on `next_round()` for Americano — no new scheduling is performed after start.
- **FR-010**: System MUST block `next_round()` when `current_round_number >= total_americano_rounds` — returning a "final round reached" error — unless the organiser calls `finish_event()` instead.
- **FR-011**: System MUST allow `finish_event()` at any completed round for Americano (finish-early allowed).
- **FR-012**: System MUST display the Americano summary ranked by total points, with ties broken by match wins then point differential — identical to Mexicano summary layout.
- **FR-013**: System MUST display `Americano` as the mode label wherever event mode is shown (event list, preview, run view, summary).
- **FR-014**: System MUST NOT mutate global player ranking scores during Americano events (no `apply_update` to `players.global_ranking_score` — same as Mexicano).
- **FR-015**: System MUST hide the Team Mexicano toggle when Americano is the selected mode.
- **FR-016**: System MUST show the round stepper in the run view for Americano (total rounds known upfront, same as WinnersCourt).

### Key Entities *(include if feature involves data)*

- **Americano Schedule**: The complete pre-computed set of all rounds (all matches with fixed team assignments) generated once at `start_event()` and stored as standard `rounds` + `matches` rows.
- **Whist Table**: Hardcoded mathematically-optimal pairing table for 8, 12, or 16 players guaranteeing each player partners every other player exactly once.
- **Berger Rotation**: Circle-rotation fallback algorithm for other multiples of 4, also guaranteeing each player partners every other player exactly once.
- **Score24 Result**: Match result where team 1 score + team 2 score = 24; each player earns their team's raw score as points.

## Assumptions

- All existing round/match/result persistence tables are reused with no schema changes — Americano rounds and matches are stored as ordinary `rounds` and `matches` rows.
- The only migration needed is adding `"Americano"` to the `EventType` enum constraint in the DB (or it is schema-free if the column is plain TEXT, which it is).
- No `Team Americano` variant is in scope for this feature.
- Court-rotation optimization is applied to all Americano schedules (including the fallback) but does not affect the partner/opponent guarantees of the Whist/Berger tables.

## Implementation Notes *(for the implementing agent)*

### Backend

1. **`backend/app/domain/enums.py`** — add `AMERICANO = "Americano"` to `EventType`.
2. **`backend/app/domain/scheduling.py`** — add `generate_americano_rounds(player_ids, num_courts)` returning a `list[RoundPlan]` (all rounds at once). Implement:
   - Whist tables for 8 and 16 (hardcoded, identical to reference repo `SCHEDULE_8` / `SCHEDULE_16`)
   - Z-cyclic seeds for 12 (identical to reference repo `WHIST_SEEDS[12]` with `(idx + r) % mod` rotation)
   - Berger circle rotation fallback for other multiples of 4
   - Court-rotation optimization pass (same logic already in scheduling.py for Mexicano)
3. **`backend/app/services/event_service.py`** — in `start_event()`, detect `EventType.AMERICANO`, call `generate_americano_rounds()`, and insert **all** returned rounds + matches in one pass. Set `round_count` to the number of generated rounds.
4. **`backend/app/services/round_service.py`** — in `next_round()`, for `EventType.AMERICANO`, do **not** call any scheduling function; instead look up the already-persisted next round by `round_number = current + 1` and return its view. In `record_result()`, route Americano to `Score24` scoring (identical path to Mexicano).
5. **`backend/app/domain/scoring.py`** — no change needed; `mexicano_score()` already handles Score24 and can be reused or aliased.
6. **`backend/app/services/event_service.py` `evaluate_setup()`** — extend the `players = courts × 4` check to Americano; add extra guard: player count must be a multiple of 4.
7. **Migration** — add `012_americano_event_type.sql`. If `event_type` column is plain `TEXT` (no CHECK constraint), the migration is a no-op comment. If there is a CHECK constraint enumerating valid types, the migration must drop and recreate it to include `'Americano'`. Verify which applies before writing the migration.

### Frontend

1. **`frontend/src/lib/types.ts`** — add `"Americano"` to `EventType` union.
2. **`frontend/src/lib/eventMode.ts`** — add `"Americano": "Americano"` to `getEventModeLabel()`.
3. **`frontend/src/components/mode/ModeAccordion.tsx`** — add an Americano card/option to the mode selector. No Team Mexicano toggle for Americano.
4. **`frontend/src/features/create-event/validation.ts`** — `buildEventName()` and `getRequiredPlayerCount()` already work generically; just ensure Americano is passed through.
5. **`frontend/src/features/run-event/resultEntry.ts`** — Americano uses the same `Score24` payload path as Mexicano; verify the mode check routes correctly.
6. **`frontend/src/features/run-event/modeInputs.tsx`** — Americano maps to the same Score24 input widget as Mexicano; add `|| eventType === "Americano"` to the Mexicano branch.
7. **`frontend/src/pages/RunEvent.tsx`** — `isMexicano` stays false for Americano; round stepper is shown. `isFinalRound` check uses existing `roundNumber >= totalRounds` logic which already works correctly since `totalRounds` is set at start time.

### Tests to write

- **Backend unit**: `test_americano_schedule_8_players` — assert 7 rounds, each player appears in exactly 1 match per round, each pair of players partners exactly once across all 7 rounds.
- **Backend unit**: `test_americano_schedule_12_players` — same guarantees, 11 rounds.
- **Backend unit**: `test_americano_schedule_berger_fallback_20_players` — 19 rounds, partner-once guarantee.
- **Backend contract**: `test_americano_event_flow` — create → patch to ready → start → verify round count → submit results → next → finish → summary.
- **Backend contract**: `test_americano_next_round_does_not_reschedule` — verify that no new scheduling SQL is called on `next_round()` for Americano (round already exists).
- **Frontend unit**: Americano label in `getEventModeLabel`.
- **Frontend unit**: `ModeAccordion` renders Americano option.
- **Frontend unit**: result entry routes Americano to Score24.

## Dependencies

- Existing `Score24` result type, `mexicano_score()` function, and Mexicano summary rendering.
- Existing `rounds` + `matches` persistence tables (no schema change needed beyond enum).
- Existing round stepper component (already shown for WinnersCourt, hidden for Mexicano — Americano follows WinnersCourt stepper behaviour).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Americano events with 8 players generate exactly 7 rounds at start; 12 players → 11 rounds; 16 players → 15 rounds.
- **SC-002**: In Americano schedule validation, each player appears in exactly 1 match per round and partners with every other player exactly once across all rounds (for 8, 12, 16 player counts).
- **SC-003**: 100% of Americano `next_round()` calls advance the round pointer without re-generating matches.
- **SC-004**: 100% of submitted Americano scores are validated as summing to 24; scores not summing to 24 are rejected.
- **SC-005**: The Americano mode label appears in 100% of event-list, preview, run-view, and summary surfaces.
- **SC-006**: Americano events with a non-multiple-of-4 player count are blocked at `evaluate_setup()` with a validation error in 100% of tested cases.
