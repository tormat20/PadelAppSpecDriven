# Tasks: UX Fixes & Game Mode Enhancements (024)

**Input**: Design documents from `/specs/024-ux-gamemode-enhancements/`  
**Branch**: `024-ux-gamemode-enhancements`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.  
**Tests**: Included for backend logic changes (tiebreaker, round service, substitution). Frontend-only stories have no test tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US9)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migrations and shared model changes that all backend stories depend on.

- [ ] T001 Write migration `backend/app/db/migrations/008_team_mexicano.sql` — `ALTER TABLE events ADD COLUMN is_team_mexicano BOOLEAN NOT NULL DEFAULT FALSE` and `CREATE TABLE event_teams`
- [ ] T002 Write migration `backend/app/db/migrations/009_substitutions.sql` — `CREATE TABLE event_substitutions`
- [ ] T003 [P] Add `is_team_mexicano: bool` field to `Event` dataclass in `backend/app/domain/models.py`
- [ ] T004 [P] Add `EventTeam` dataclass to `backend/app/domain/models.py`
- [ ] T005 [P] Add `EventSubstitution` dataclass to `backend/app/domain/models.py`

**Checkpoint**: Migrations exist; domain models updated — backend stories can now proceed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Repository + schema wiring that multiple user stories depend on.

- [ ] T006 Update `backend/app/repositories/sql/events/create.sql` to include `is_team_mexicano` column in INSERT
- [ ] T007 Update `backend/app/repositories/sql/events/get_by_id.sql` to SELECT `is_team_mexicano` (add to column list; update `row[N]` index in `EventsRepository.get()`)
- [ ] T008 Update `backend/app/repositories/sql/events/list_all.sql` to SELECT `is_team_mexicano`
- [ ] T009 Update `backend/app/repositories/sql/events/update_setup.sql` to SET `is_team_mexicano`
- [ ] T010 Update `EventsRepository.get()` and `EventsRepository.list_all()` in `backend/app/repositories/events_repo.py` to read `is_team_mexicano` from the new column index and pass it to the `Event` constructor
- [ ] T011 Update `EventsRepository.create()` in `backend/app/repositories/events_repo.py` to accept and pass `is_team_mexicano` param
- [ ] T012 Update `EventsRepository.update_setup()` in `backend/app/repositories/events_repo.py` to accept and pass `is_team_mexicano` param
- [ ] T013 [P] Create `backend/app/repositories/sql/event_teams/create.sql` — INSERT into `event_teams`
- [ ] T014 [P] Create `backend/app/repositories/sql/event_teams/list_by_event.sql` — SELECT by `event_id`
- [ ] T015 [P] Create `backend/app/repositories/sql/event_teams/delete_by_event.sql` — DELETE by `event_id`
- [ ] T016 Create `backend/app/repositories/event_teams_repo.py` — `EventTeamsRepository` with `create()`, `list_by_event()`, `delete_by_event()` using `load_sql()` and `row[N]` index access
- [ ] T017 [P] Create `backend/app/repositories/sql/substitutions/create.sql` — INSERT into `event_substitutions`
- [ ] T018 [P] Create `backend/app/repositories/sql/substitutions/list_by_event.sql` — SELECT by `event_id`
- [ ] T019 Create `backend/app/repositories/substitutions_repo.py` — `SubstitutionsRepository` with `create()`, `list_by_event()` using `load_sql()` and `row[N]` index access
- [ ] T020 Add `isTeamMexicano: bool` field to `EventResponse` in `backend/app/api/schemas/events.py`
- [ ] T021 Add `isTeamMexicano: bool | None` field to `CreateEventRequest` and `UpdateEventSetupRequest` in `backend/app/api/schemas/events.py`
- [ ] T022 Add `isTeamMexicano?: boolean` to `EventRecord` type in `frontend/src/lib/types.ts`
- [ ] T023 [P] Add `EventTeam` type and `SubstitutePlayerPayload` type to `frontend/src/lib/types.ts`

**Checkpoint**: Repositories and schema wiring complete — all backend stories can now proceed independently.

---

## Phase 3: User Story 1 — UserMenu Dropdown Visible Above Navigation (Priority: P1) 🎯 MVP

**Goal**: The UserMenu dropdown escapes the `card-nav` overflow clip and renders above all other page content.

**Independent Test**: Log in → click the user pill → confirm the dropdown is fully visible and not clipped behind the nav panel → click "Sign out" → confirm the session ends.

- [ ] T024 [US1] In `frontend/src/components/nav/CardNav.css` — add `overflow: visible` and `position: relative; z-index: 10` to the `.card-nav-top` rule so the top-bar strip never clips its children
- [ ] T025 [US1] In `frontend/src/styles/components.css` — change `.user-menu__dropdown { z-index: ... }` from `100` to `200` so the dropdown paints above all other stacking contexts within the nav

**Checkpoint**: UserMenu dropdown fully visible and interactive on every page. ✅

---

## Phase 4: User Story 2 — Court Card Player Names Split Into Individual Rows (Priority: P1)

**Goal**: Each player appears in their own name box; no combined "Alice + Bob" button.

**Independent Test**: Start any event with 10+-character player names → navigate to `/events/{id}/run` → confirm each side of every court card shows two separate stacked name boxes with consistent width and left-aligned text.

- [ ] T026 [US2] Refactor `frontend/src/components/courts/CourtGrid.tsx` — replace the single `<button className="team-grouping">` for each team with a wrapper `<div>` that holds the click/hover handlers and contains two individual `<span>` elements (one per player), stacked vertically; apply `role="group"` to the wrapper and keep `onClick` delegating to the team
- [ ] T027 [US2] Add CSS rules to `frontend/src/styles/components.css` for the new individual player name elements: fixed `max-width` matching the existing team-grouping width, `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`, `text-align: left`, and vertical stacking via `flex-direction: column` on the wrapper

**Checkpoint**: Every court card shows individual name boxes; long names truncate gracefully. ✅

---

## Phase 5: User Story 3 — Open Running Event in New Browser Window (Priority: P2)

**Goal**: Clicking "Start" opens the running event in a new tab/window; the management page stays open.

**Independent Test**: Create a ready event → click "Start Event" → confirm a new tab opens at `/events/{id}/run` → confirm original tab remains on the preview page.

- [ ] T028 [US3] In `frontend/src/pages/PreviewEvent.tsx` — modify `onStart()`: after `await startEvent(eventId)` succeeds, call `const win = window.open('/events/${eventId}/run', '_blank')` and only call `navigate()` as a fallback if `win` is null (popup blocked)
- [ ] T029 [US3] In `frontend/src/pages/PreviewEvent.tsx` — add a state variable `popupBlocked: boolean`; when fallback activates, set it to `true` and render an informational notice below the "Start Event" button

**Checkpoint**: New window opens on Start; fallback handles blocked popups gracefully. ✅

---

## Phase 6: User Story 7 — Unlimited Rounds in Mexicano (Priority: P2)

> Implemented before S4 (Team Mexicano) because S4 extends the Mexicano service; removing the round cap first keeps the diff clean.

**Goal**: "Next Round" remains available after any completed round in Mexicano; no hard cap enforced.

**Independent Test**: Start a Mexicano event → complete 6 rounds → confirm "Next Round" is still enabled → complete rounds 7 and 8 → click "Finish" → confirm event finalises normally.

- [ ] T030 [US7] In `backend/app/services/round_service.py` — remove (or guard with `event.event_type != EventType.MEXICANO`) the `EVENT_FINAL_ROUND_REACHED` check at lines 123–128 so Mexicano events can advance past `round_count`
- [ ] T031 [US7] In `frontend/src/pages/RunEvent.tsx` — decouple the "Next Round" and "Finish" buttons for Mexicano: always render both buttons when `eventData.eventType === 'Mexicano'`; "Next Round" calls `next()`, "Finish" calls `finishEvent()` then navigates to summary; non-Mexicano events keep the current merged `onAdvanceClick` logic
- [ ] T032 [US7] In `frontend/src/pages/RunEvent.tsx` — update `getRoundStepperProps` usage: when `eventData.eventType === 'Mexicano'`, pass `totalRounds = 0` (so `getRoundStepperProps` returns `null` and the stepper is hidden) — this prevents the stepper from falsely showing "Round 7 of 6"

**Checkpoint**: Mexicano events run unlimited rounds; both buttons always present; stepper hidden for Mexicano. ✅

---

## Phase 7: User Story 8 — Mexicano Tiebreaker Hierarchy (Priority: P2)

**Goal**: Tied Mexicano scores are resolved by wins first, then best single-match score.

**Independent Test**: Set up a Mexicano event where players share equal total score with different win counts → view the summary → confirm the higher-wins player ranks above the other.

- [ ] T033 [US8] In `backend/app/services/summary_ordering.py` — add helper `_compute_mexicano_tiebreakers(matches: list) -> tuple[dict[str, int], dict[str, int]]` that returns `(wins_by_player, best_match_by_player)` by iterating completed matches: a win = player's team scored > 12; best match = max single-match score per player
- [ ] T034 [US8] In `backend/app/services/summary_ordering.py` — update the Mexicano sort key in `order_final_rows()` from `(-total, name, id)` to `(-total, -wins, -best_match, name, id)`, passing the new tiebreaker maps; update `_assign_competition_rank()` to compare all three values for shared-rank detection
- [ ] T035 [US8] In `backend/app/services/summary_ordering.py` — apply the same tiebreaker sort key update to `order_progress_rows()` (in-progress leaderboard uses the same ordering)
- [ ] T036 [US8] Update callers of `order_final_rows()` and `order_progress_rows()` in `backend/app/services/summary_service.py` (or wherever these are called) to pass the matches list so tiebreakers can be computed; confirm method signatures align

**Checkpoint**: Mexicano final and in-progress rankings apply wins → best-match tiebreaker correctly. ✅

---

## Phase 8: User Story 5 — Change Event Mode Before Starting (Priority: P2)

**Goal**: Mode changes are permitted only on `planned` or `ready` events; blocked on `ongoing`/`finished`.

**Independent Test**: Create a Mexicano event → change mode to WinnersCourt → confirm save succeeds and players are preserved → start the event → try to change mode again → confirm a `409` error is returned.

- [ ] T037 [US5] In `backend/app/services/event_service.py` — at the start of `update_event_setup()`, check `derive_lifecycle_status(current)` and raise `DomainError("EVENT_MODE_CHANGE_BLOCKED", ..., status_code=409)` if the result is `"ongoing"` or `"finished"` and `event_type` is being changed (i.e., new `event_type` differs from current)
- [ ] T038 [US5] In `backend/app/services/event_service.py` — when `is_team_mexicano` changes from `True` to `False` (or `event_type` changes away from Mexicano), call `event_teams_repo.delete_by_event(event_id)` to clean up orphaned team assignments; the `EventService` constructor must gain an `event_teams_repo` dependency
- [ ] T039 [US5] Wire `EventTeamsRepository` into `services_scope()` in `backend/app/api/deps.py` — instantiate alongside existing repos and pass to `EventService`
- [ ] T040 [US5] Add `EVENT_MODE_CHANGE_BLOCKED` to the `ERROR_MESSAGE_BY_CODE` map in `frontend/src/lib/api.ts` with a user-friendly message

**Checkpoint**: Mode changes are blocked on running/finished events; orphaned team data is cleaned up. ✅

---

## Phase 9: User Story 4 — Team Mexicano Mode (Priority: P2)

**Goal**: A Mexicano event can be created with fixed partner pairs that persist across all rounds.

**Independent Test**: Create Mexicano event → toggle "Team Mexicano" → assign 4 fixed pairs (8 players) → start → complete multiple rounds → confirm no partner swaps occur. Also verify: an odd player count blocks start with a clear message.

- [ ] T041 [US4] In `backend/app/services/event_service.py` — update `evaluate_setup()` to add `"team_mexicano_odd_players"` to `missing_requirements` when `is_team_mexicano` is `True` and `len(player_ids) % 2 != 0`
- [ ] T042 [US4] In `backend/app/services/event_service.py` — update `create_event()` to accept `is_team_mexicano: bool = False` and pass it to `events_repo.create()`; update `update_event_setup()` to pass `is_team_mexicano` to `events_repo.update_setup()`
- [ ] T043 [US4] Create `backend/app/api/schemas/teams.py` — Pydantic models: `TeamPairRequest`, `SetTeamsRequest`, `TeamResponse`, `TeamsResponse`
- [ ] T044 [US4] Add route handler `POST /events/{event_id}/teams` to `backend/app/api/routers/events.py` — calls new `EventTeamsService.set_teams(event_id, pairs)` (see T045); validates event is Mexicano + Team Mexicano + not started
- [ ] T045 [US4] Add route handler `GET /events/{event_id}/teams` to `backend/app/api/routers/events.py` — returns current team assignments from `event_teams_repo.list_by_event(event_id)`
- [ ] T046 [US4] In `backend/app/services/mexicano_service.py` — add `generate_next_round_team_mexicano(current_round, fixed_teams, courts, previous_matches, event_seed)` that keeps each fixed pair as partners and only rotates opponents/courts; implement by splitting fixed pairs into "locked" partner sets before calling the opponent-matching logic
- [ ] T047 [US4] In `backend/app/services/round_service.py` — in `next_round()`, after resolving `EventType.MEXICANO`, check `event.is_team_mexicano`; if `True`, load teams from `event_teams_repo.list_by_event()` and call `mexicano_service.generate_next_round_team_mexicano()`; the `RoundService` constructor must gain `event_teams_repo`
- [ ] T048 [US4] In `backend/app/services/event_service.py` — in `start_event()`, apply the same Team Mexicano branch: if `event.is_team_mexicano`, generate round 1 using fixed teams (call `mexicano_service.generate_round_1_team_mexicano()` or adapt `generate_round_1`)
- [ ] T049 [US4] Wire `SubstitutionsRepository` into `services_scope()` in `backend/app/api/deps.py` (pair with T039 which adds `EventTeamsRepository`)
- [ ] T050 [US4] Add `isTeamMexicano?: boolean` prop and orange toggle UI to the Mexicano step in `frontend/src/features/create-event/` (locate the game-mode selector step and add the toggle with an `orange`-themed style)
- [ ] T051 [US4] Add "Assign Teams" step component in `frontend/src/features/create-event/` — renders when `isTeamMexicano === true`; shows the assigned player list split into draggable/selectable pairs; stores pairs in local state
- [ ] T052 [US4] Add `setEventTeams(eventId, teams)` and `getEventTeams(eventId)` API functions to `frontend/src/lib/api.ts` — `POST /events/{id}/teams` and `GET /events/{id}/teams`
- [ ] T053 [US4] In `frontend/src/pages/PreviewEvent.tsx` — when `eventData.isTeamMexicano && missingRequirements.includes('team_mexicano_odd_players')`, show the specific blocking message "Team Mexicano requires an even number of players"

**Checkpoint**: Team Mexicano events can be created, teams assigned, and all rounds run with fixed pairs. ✅

---

## Phase 10: User Story 6 — Substitute Player Mid-Event (Priority: P2)

**Goal**: An organiser can replace a player in an ongoing event; the substitute takes over from the next round.

**Independent Test**: Start a Mexicano event → complete round 1 → substitute one player → complete round 2 → finish → confirm the departed player has only round-1 stats and the substitute has only round-2+ stats.

- [ ] T054 [US6] In `backend/app/api/schemas/events.py` — add `SubstitutePlayerRequest` and `SubstitutePlayerResponse` Pydantic models
- [ ] T055 [US6] Add route handler `POST /events/{event_id}/substitute` to `backend/app/api/routers/events.py` — validates event is ongoing, departing player is in `event_players`, substitute exists in `players` table, substitute is not already in the event; calls new service method
- [ ] T056 [US6] Add `substitute_player(event_id, departing_id, substitute_id)` to `backend/app/services/event_service.py` — replaces `departing_id` with `substitute_id` in `event_players` via `events_repo.replace_players()`; writes record to `substitutions_repo.create()`; `effective_from_round = event.current_round_number + 1`
- [ ] T057 [US6] Wire `SubstitutionsRepository` into `EventService` constructor (alongside the `event_teams_repo` addition from T049)
- [ ] T058 [US6] Add `substitutePlayer(eventId, payload)` API function to `frontend/src/lib/api.ts` — `POST /events/{id}/substitute`
- [ ] T059 [US6] Add "Substitute Player" button to `frontend/src/pages/RunEvent.tsx` — visible only when `lifecycleStatus === 'ongoing'`; opens a modal with a player-search combobox (reuse existing `searchPlayers` pattern) and an optional inline "Create player" flow
- [ ] T060 [US6] Implement the substitution modal component in `frontend/src/features/run-event/SubstituteModal.tsx` — player search input, "Who is leaving?" selector (dropdown from current match players), "Who is joining?" search/create input; on confirm, calls `substitutePlayer()` then triggers `load()` to refresh the page

**Checkpoint**: Player substitution works end-to-end; historical stats remain correct for departed player. ✅

---

## Phase 11: User Story 9 — Game Mode Documentation (Priority: P3)

**Goal**: Three plain-language Markdown files documenting each game mode, committed to the repository.

**Independent Test**: Open each file; confirm all required sections are present and language is non-technical.

- [ ] T061 [P] [US9] Create `docs/game-modes/mexicano.md` — cover: scoring (play to 24 points, Mexicano scoring), how courts are assigned (best-with-worst pairing), partner rotation logic (per-round rotation, no-repeat rule), Team Mexicano variant (fixed pairs), tiebreaker hierarchy (score → wins → best match), randomisation points
- [ ] T062 [P] [US9] Create `docs/game-modes/winners-court.md` — cover: court movement rules (winners advance, losers drop), scoring, how final rankings are derived from final-round court positions, tie handling
- [ ] T063 [P] [US9] Create `docs/game-modes/ranked-box.md` — cover: fixed-cycle scheduling, RB score points (win/loss/draw deltas), how the ladder is ranked (global score then group score), what a "ranked box" cycle looks like in practice

**Checkpoint**: All three documentation files exist and pass the plain-language readability check. ✅

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final wiring, validation pass, and any remaining glue.

- [ ] T064 [P] Verify `backend/app/api/deps.py` `services_scope()` correctly instantiates `EventTeamsRepository` and `SubstitutionsRepository` and injects them into `EventService` and `RoundService`
- [ ] T065 [P] Update `backend/app/api/routers/events.py` `_format_event_response()` helper (or wherever `EventResponse` is constructed) to include `isTeamMexicano` from the event model
- [ ] T066 [P] Confirm `frontend/src/lib/api.ts` `ERROR_MESSAGE_BY_CODE` has entries for all new error codes: `EVENT_MODE_CHANGE_BLOCKED`, `EVENT_NOT_TEAM_MEXICANO`, `PLAYER_NOT_IN_EVENT`, `SUBSTITUTE_NOT_FOUND`, `SUBSTITUTE_ALREADY_IN_EVENT`
- [ ] T067 Run full test suite (`npm test && npm run lint`) and fix any failures introduced by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all backend stories**
- **Phase 3 (US1 UserMenu)**: Frontend CSS only — can start immediately, no Phase 2 dependency
- **Phase 4 (US2 Player names)**: Frontend JSX/CSS only — can start immediately, no Phase 2 dependency
- **Phase 5 (US3 New window)**: Frontend JS only — can start immediately, no Phase 2 dependency
- **Phase 6 (US7 Unlimited rounds)**: Backend: depends on Phase 2. Frontend: depends on Phase 5 (same file `RunEvent.tsx` — sequence after T028/T029)
- **Phase 7 (US8 Tiebreaker)**: Depends on Phase 2
- **Phase 8 (US5 Mode change guard)**: Depends on Phase 2 (needs `EventTeamsRepository` from T016)
- **Phase 9 (US4 Team Mexicano)**: Depends on Phase 2, Phase 6, Phase 8
- **Phase 10 (US6 Substitute)**: Depends on Phase 2, Phase 9 (needs `SubstitutionsRepository` wiring from T049)
- **Phase 11 (US9 Docs)**: No dependencies — can start at any time
- **Phase 12 (Polish)**: Depends on all preceding phases

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (UserMenu CSS) | None | Pure CSS, fully independent |
| US2 (Player names) | None | Pure JSX/CSS, fully independent |
| US3 (New window) | None | Frontend only |
| US7 (Unlimited rounds) | Phase 2 (backend), US3 (same file) | Backend guard removal; frontend in RunEvent.tsx |
| US8 (Tiebreaker) | Phase 2 | Backend service change only |
| US5 (Mode change guard) | Phase 2 + EventTeamsRepo (T016) | Needs team cleanup on mode change |
| US4 (Team Mexicano) | Phase 2, US7, US5 | Full-stack; scheduling builds on unlimited-rounds backend |
| US6 (Substitute) | Phase 2, US4 (T049 wiring) | Reuses service wiring from US4 |
| US9 (Docs) | None | Markdown files only |

### Within Each User Story

- SQL files before repository methods
- Repository methods before service layer
- Service layer before router handlers
- Backend changes before frontend API integration
- Models/types before components

### Parallel Opportunities

- T003, T004, T005 (domain model additions) — fully parallel
- T013–T015 (event_teams SQL) and T017–T018 (substitutions SQL) — parallel with each other
- T006–T009 (events SQL updates) — parallel with SQL for new tables
- T016, T019 (new repositories) — parallel with each other after their respective SQL files
- T024, T026, T028 (US1, US2, US3) — all parallel; different files
- T030, T033, T037 (US7 backend, US8, US5) — parallel after Phase 2
- T061, T062, T063 (US9 docs) — fully parallel

---

## Parallel Example: Foundational Phase

```
Parallel batch 1 (no dependencies):
  T001: migrations/008_team_mexicano.sql
  T002: migrations/009_substitutions.sql
  T003: models.py — Event.is_team_mexicano
  T004: models.py — EventTeam dataclass
  T005: models.py — EventSubstitution dataclass

Parallel batch 2 (after T001/T002):
  T006–T009: events SQL updates
  T013–T015: event_teams SQL files
  T017–T018: substitutions SQL files

Sequential after batch 2:
  T010–T012: EventsRepository updates (depend on SQL)
  T016: EventTeamsRepository (depends on T013–T015)
  T019: SubstitutionsRepository (depends on T017–T018)
```

## Parallel Example: Frontend-Only Stories (US1, US2, US3)

```
All three can run fully in parallel immediately:
  T024–T025: CardNav.css + components.css (US1)
  T026–T027: CourtGrid.tsx + CSS (US2)
  T028–T029: PreviewEvent.tsx (US3)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only — US1 + US2)

1. Complete Phase 1 + Phase 2 (migrations + repo wiring)
2. Complete Phase 3 (US1 UserMenu fix) — CSS only, 2 tasks
3. Complete Phase 4 (US2 Player name split) — CSS + JSX, 2 tasks
4. **STOP and VALIDATE**: Login → check dropdown → start an event → check court cards
5. These two P1 fixes ship independently of all backend changes

### Incremental Delivery Order

1. **P1 fixes** (US1 + US2): Pure frontend — shippable immediately, zero backend risk
2. **US3** (new window): One-line frontend change — minimal risk
3. **US7** (unlimited rounds): One backend guard removal + small frontend button change
4. **US8** (tiebreaker): Backend ordering logic — no schema change
5. **US5** (mode change guard): Backend guard + team cleanup
6. **US4** (Team Mexicano): Full-stack, most complex — build last among P2s
7. **US6** (substitute): Full-stack, builds on US4 wiring
8. **US9** (docs): Anytime

### Risk Assessment

| Story | Risk | Notes |
|-------|------|-------|
| US1 | Low | CSS variable change only |
| US2 | Low | JSX restructure, no logic change |
| US3 | Low | `window.open` with fallback |
| US7 | Low | Removes a guard + button layout change |
| US8 | Medium | Ordering logic touches ranking output |
| US5 | Low | Adds a guard, deletes orphan rows |
| US4 | High | New table, new scheduling algorithm branch, new UI step |
| US6 | Medium | New endpoint + repo; stats attribution is automatic |
| US9 | None | Markdown files |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps each task to a user story for traceability
- `RunEvent.tsx` is touched by US7 (T031–T032) and US6 (T059–T060) — sequence these; do US7 first
- `events.py` router is touched by US4 (T044–T045) and US6 (T055) — sequence US4 before US6
- `deps.py` is touched by US5 (T039) and US4 (T049) — consolidate into one edit pass at T049
- Pre-existing LSP errors in `users_repo.py` and `round_service.py` are not introduced by this feature — do not fix unless explicitly asked
- Run `npm test && npm run lint` after each phase as a checkpoint before moving on
