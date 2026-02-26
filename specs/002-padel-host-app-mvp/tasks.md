# Tasks: Padel Host Event Operations MVP

**Input**: Design documents from `/specs/002-padel-host-app-mvp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Included (explicitly requested in plan.md testing strategy and quickstart validation flow).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- [P] means task can run in parallel (different files, no blocking dependency)
- [Story] maps to user story labels from `spec.md` (`US1`, `US2`, `US3`)
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend/frontend tooling and baseline project wiring.

- [X] T001 Initialize backend dependencies and tooling in `backend/pyproject.toml`
- [X] T002 [P] Initialize frontend dependencies and scripts in `frontend/package.json`
- [X] T003 [P] Configure frontend styling baseline in `frontend/tailwind.config.ts`
- [X] T004 [P] Create backend package layout placeholders in `backend/app/__init__.py`
- [X] T005 [P] Create frontend app shell and route skeleton in `frontend/src/app/router.tsx`
- [X] T006 Document setup and run commands in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core architecture and persistence foundations required before user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase completes.

- [X] T007 Implement runtime settings in `backend/app/core/config.py`
- [X] T008 [P] Implement structured logging configuration in `backend/app/core/logging.py`
- [X] T009 [P] Implement DuckDB connection lifecycle in `backend/app/db/connection.py`
- [X] T010 Implement migration runner with schema tracking in `backend/app/db/migrate.py`
- [X] T011 [P] Create initial schema migration in `backend/app/db/migrations/001_init.sql`
- [X] T012 [P] Implement repository SQL loader utilities in `backend/app/db/repositories/sql_loader.py`
- [X] T013 Implement FastAPI dependency wiring in `backend/app/api/deps.py`
- [X] T014 [P] Implement health router in `backend/app/api/routers/health.py`
- [X] T015 Implement FastAPI app bootstrap and router registration in `backend/app/main.py`

**Checkpoint**: Foundation complete; user story work can begin.

---

## Phase 3: User Story 1 - Run an event from setup to finish (Priority: P1) 🎯 MVP

**Goal**: Host can create players/events, start rounds, advance rounds, finish event, and view persisted summary.

**Independent Test**: Run one complete event per mode and verify assignments, scoring, round progression, final standings, and history persistence.

### Tests for User Story 1

- [X] T016 [P] [US1] Add player API contract tests in `backend/tests/contract/test_players_api.py`
- [X] T017 [P] [US1] Add event lifecycle API contract tests in `backend/tests/contract/test_events_lifecycle_api.py`
- [X] T018 [P] [US1] Add round progression API contract tests in `backend/tests/contract/test_rounds_api.py`
- [X] T019 [P] [US1] Add repository integration tests for event persistence in `backend/tests/integration/test_event_repositories.py`
- [X] T020 [P] [US1] Add end-to-end backend flow integration test in `backend/tests/integration/test_us1_full_event_flow.py`

### Implementation for User Story 1

- [X] T021 [P] [US1] Implement domain enums for modes/statuses in `backend/app/domain/enums.py`
- [X] T022 [P] [US1] Implement domain models for event entities in `backend/app/domain/models.py`
- [X] T023 [P] [US1] Implement scheduling core functions in `backend/app/domain/scheduling.py`
- [X] T024 [P] [US1] Implement scoring core functions in `backend/app/domain/scoring.py`
- [X] T025 [P] [US1] Implement players repository and SQL in `backend/app/db/repositories/players_repo.py`
- [X] T026 [P] [US1] Implement events repository and SQL in `backend/app/db/repositories/events_repo.py`
- [X] T027 [P] [US1] Implement rounds repository and SQL in `backend/app/db/repositories/rounds_repo.py`
- [X] T028 [P] [US1] Implement matches repository and SQL in `backend/app/db/repositories/matches_repo.py`
- [X] T029 [P] [US1] Implement rankings repository and SQL in `backend/app/db/repositories/rankings_repo.py`
- [X] T030 [US1] Implement event orchestration service in `backend/app/services/event_service.py`
- [X] T031 [US1] Implement Americano mode service in `backend/app/services/americano_service.py`
- [X] T032 [US1] Implement Mexicano mode service in `backend/app/services/mexicano_service.py`
- [X] T033 [US1] Implement Beat the Box mode service in `backend/app/services/beat_the_box_service.py`
- [X] T034 [US1] Implement players router in `backend/app/api/routers/players.py`
- [X] T035 [US1] Implement events router (`create/get/start/next/finish`) in `backend/app/api/routers/events.py`
- [X] T036 [US1] Implement rounds router (`current-round/results`) in `backend/app/api/routers/rounds.py`
- [X] T037 [US1] Implement API schema models for players/events in `backend/app/api/schemas/players.py`
- [X] T038 [US1] Implement API schema models for rounds/results/summary in `backend/app/api/schemas/events.py`
- [X] T039 [P] [US1] Implement typed API client for player/event/round endpoints in `frontend/src/lib/api.ts`
- [X] T040 [P] [US1] Define frontend domain types and mappers in `frontend/src/lib/types.ts`
- [X] T041 [US1] Implement Lobby page with mode/date/court/player setup and create gating in `frontend/src/pages/CreateEvent.tsx`
- [X] T042 [US1] Implement Preview page start flow in `frontend/src/pages/PreviewEvent.tsx`
- [X] T043 [US1] Implement Run Event page baseline court rendering and next button in `frontend/src/pages/RunEvent.tsx`
- [X] T044 [US1] Implement Summary page standings and history rendering in `frontend/src/pages/Summary.tsx`

**Checkpoint**: US1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Enter results quickly during live play (Priority: P2)

**Goal**: Host can submit and correct results quickly with mode-specific low-friction input and strict validation.

**Independent Test**: During a running event, enter valid/invalid results across all modes, verify immediate completion state updates, correction behavior, and recomputation accuracy.

### Tests for User Story 2

- [X] T045 [P] [US2] Add scoring rule unit tests by mode in `backend/tests/unit/test_scoring_rules.py`
- [X] T046 [P] [US2] Add result correction recomputation tests in `backend/tests/unit/test_result_corrections.py`
- [X] T047 [P] [US2] Add API validation tests for result payloads in `backend/tests/contract/test_results_validation_api.py`
- [X] T048 [P] [US2] Add frontend result-entry interaction tests in `frontend/tests/result-entry.test.tsx`

### Implementation for User Story 2

- [X] T049 [US2] Implement result application and correction workflow in `backend/app/services/result_service.py`
- [X] T050 [US2] Enforce Mexicano score and event-local cumulative totals in `backend/app/services/mexicano_service.py`
- [X] T051 [US2] Enforce Beat the Box correction-safe ranking updates in `backend/app/services/beat_the_box_service.py`
- [X] T052 [US2] Add result correction endpoint behavior in `backend/app/api/routers/rounds.py`
- [X] T053 [P] [US2] Implement mode-specific quick input component in `frontend/src/components/matches/ResultEntry.tsx`
- [X] T054 [P] [US2] Implement Run Event input state and optimistic UX in `frontend/src/features/run-event/resultEntry.ts`
- [X] T055 [US2] Implement next-match gating and recompute refresh logic in `frontend/src/features/run-event/nextRound.ts`

**Checkpoint**: US2 is fully functional and testable independently.

---

## Phase 5: User Story 3 - Share clear court assignments with players (Priority: P3)

**Goal**: Players can reliably follow a shared display that shows court numbers, partners, and active round assignments.

**Independent Test**: Start and advance an event while displaying the shared screen; verify all selected courts and team assignments stay visible and synchronized each round.

### Tests for User Story 3

- [X] T056 [P] [US3] Add API tests for round view projection shape in `backend/tests/contract/test_round_view_projection_api.py`
- [X] T057 [P] [US3] Add frontend court-grid rendering tests in `frontend/tests/court-grid.test.tsx`

### Implementation for User Story 3

- [X] T058 [US3] Implement round view projection mapper in `backend/app/services/round_view_service.py`
- [X] T059 [US3] Ensure current-round endpoint returns full court view model in `backend/app/api/routers/rounds.py`
- [X] T060 [P] [US3] Implement reusable court grid component in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T061 [P] [US3] Implement shared display layout shell in `frontend/src/app/AppShell.tsx`
- [X] T062 [US3] Integrate court grid and shared-view-friendly layout into Run page in `frontend/src/pages/RunEvent.tsx`

**Checkpoint**: US3 is fully functional and testable independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improve quality, consistency, performance, and docs across stories.

- [X] T063 [P] Add architecture boundary tests (no SQL outside repositories) in `backend/tests/unit/test_architecture_boundaries.py`
- [X] T064 [P] Add UI background/menu integration polish in `frontend/src/components/backgrounds/LightRaysBackground.tsx`
- [X] T065 [P] Add MagicBento home navigation polish in `frontend/src/components/bento/MagicBentoMenu.tsx`
- [X] T066 Update execution guide and verification steps in `specs/002-padel-host-app-mvp/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies
- Phase 2 (Foundational): depends on Phase 1 and blocks user stories
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US2): depends on Phase 2 and integrates with US1 running flow
- Phase 5 (US3): depends on Phase 2 and consumes US1/US2 round view behavior
- Phase 6 (Polish): depends on completion of desired user stories

### User Story Dependencies

- **US1 (P1)**: MVP slice after foundational phase
- **US2 (P2)**: Depends on US1 round and result lifecycle endpoints
- **US3 (P3)**: Depends on US1 current-round data and benefits from US2 update responsiveness

### Within Each User Story

- Tests first, verify fail state before implementation
- Domain and repositories before services
- Services before routers
- Backend contract stability before frontend integration

## Parallel Opportunities

- Setup: T002-T005 can run in parallel
- Foundational: T008, T009, T011, T012, T014 can run in parallel after T007/T010
- US1: T016-T020 parallel; T021-T029 parallel; T039-T040 parallel
- US2: T045-T048 parallel; T053-T054 parallel
- US3: T056-T057 parallel; T060-T061 parallel
- Polish: T063-T065 parallel

## Parallel Example: User Story 1

```bash
Task: "T016 [US1] backend/tests/contract/test_players_api.py"
Task: "T017 [US1] backend/tests/contract/test_events_lifecycle_api.py"
Task: "T018 [US1] backend/tests/contract/test_rounds_api.py"

Task: "T025 [US1] backend/app/db/repositories/players_repo.py"
Task: "T026 [US1] backend/app/db/repositories/events_repo.py"
Task: "T027 [US1] backend/app/db/repositories/rounds_repo.py"
Task: "T028 [US1] backend/app/db/repositories/matches_repo.py"
```

## Parallel Example: User Story 2

```bash
Task: "T045 [US2] backend/tests/unit/test_scoring_rules.py"
Task: "T046 [US2] backend/tests/unit/test_result_corrections.py"
Task: "T047 [US2] backend/tests/contract/test_results_validation_api.py"

Task: "T053 [US2] frontend/src/components/matches/ResultEntry.tsx"
Task: "T054 [US2] frontend/src/features/run-event/resultEntry.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T056 [US3] backend/tests/contract/test_round_view_projection_api.py"
Task: "T057 [US3] frontend/tests/court-grid.test.tsx"

Task: "T060 [US3] frontend/src/components/courts/CourtGrid.tsx"
Task: "T061 [US3] frontend/src/app/AppShell.tsx"
```

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate US1 independent test end-to-end
4. Demo MVP before expanding scope

### Incremental Delivery

1. Deliver US1 (core event lifecycle)
2. Deliver US2 (fast and correction-safe result entry)
3. Deliver US3 (shared player-facing round visibility)
4. Finish with Phase 6 polish and hardening

### Parallel Team Strategy

1. Team aligns on Setup + Foundational phases
2. After Phase 2, split by stories where possible
3. Merge story slices independently with contract checks before integration
