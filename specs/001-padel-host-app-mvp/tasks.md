# Tasks: Padel Host App (MVP)

**Input**: Design documents from `/specs/001-padel-host-app-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Included (explicitly requested in milestones and DoD).

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Canonical Constraints (Must Follow During Implementation)

- All entity IDs are backend-generated **UUIDv4** values.
- No bigint/auto-increment identifiers are allowed in any table.
- API serializes all IDs as string UUIDs.
- Backend event status set is exactly: `Lobby`, `Running`, `Finished`.
- `Preview` is frontend-only UX state, not a persisted backend status.
- Canonical result submission endpoint is `POST /matches/{matchId}/result`.
- No SQL outside `backend/app/repositories/sql/`, except `backend/app/db/migrations/*.sql` and minimal DB config in `backend/app/db/connection.py`.

## Format: `[ID] [P?] [Story] Description`

- [P] = parallelizable (different files, no blocking dependency)
- [Story] = user story label for traceability

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create monorepo skeleton and development tooling baseline.

- [X] T001 Create backend and frontend directory skeleton per plan in `backend/app/` and `frontend/src/`
  - AC: Directory tree matches `specs/001-padel-host-app-mvp/plan.md` source structure.
  - Artifacts: `backend/app/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`
- [X] T002 [P] Initialize backend Python project and dependencies in `backend/pyproject.toml`
  - AC: `uv sync` succeeds and installs FastAPI, Pydantic v2, DuckDB, pytest, ruff, mypy.
  - Artifacts: `backend/pyproject.toml`, `backend/uv.lock`
- [X] T003 [P] Initialize frontend Vite+React+TypeScript project in `frontend/package.json`
  - AC: `npm install` and `npm run dev` succeed in `frontend/`.
  - Artifacts: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`
- [X] T004 [P] Configure Tailwind CSS and shadcn/ui baseline in `frontend/tailwind.config.ts`
  - AC: Tailwind classes render and shadcn components can be generated/used.
  - Artifacts: `frontend/tailwind.config.ts`, `frontend/src/index.css`, `frontend/components.json`
- [X] T005 [P] Add root developer guide commands in `README.md`
  - AC: README includes backend/frontend setup, run, test, and lint commands from quickstart.
  - Artifacts: `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before user story delivery.

**⚠️ CRITICAL**: No user story work starts before this phase is complete.

- [X] T006 Implement runtime settings and env parsing in `backend/app/core/config.py`
  - AC: Config exposes DuckDB file path, API prefix, and environment mode.
  - Artifacts: `backend/app/core/config.py`
- [X] T007 [P] Implement DuckDB per-request connection helper in `backend/app/db/connection.py`
  - AC: Connection opens configured DB path and closes cleanly after use.
  - Artifacts: `backend/app/db/connection.py`
- [X] T008 Implement SQL migration runner with `schema_migrations` tracking in `backend/app/db/migrate.py`
  - AC: Migrations apply in-order exactly once per DB file.
  - Artifacts: `backend/app/db/migrate.py`
- [X] T009 [P] Create initial migration SQL in `backend/app/db/migrations/001_init.sql`
  - AC: Includes players, events, event_players, event_courts, rounds, matches, event_scores, global_rankings with keys/indexes and UUIDv4 primary keys (no auto-increment).
  - Artifacts: `backend/app/db/migrations/001_init.sql`
- [X] T010 Add health router and FastAPI app bootstrap in `backend/app/api/routers/health.py` and `backend/app/main.py`
  - AC: `GET /health` returns HTTP 200 with `{ "status": "ok" }` and app starts with uvicorn.
  - Artifacts: `backend/app/main.py`, `backend/app/api/routers/health.py`
- [X] T011 [P] Add migration idempotency integration tests in `backend/tests/integration/test_migrations.py`
  - AC: Test proves first run applies migrations and second run applies none.
  - Artifacts: `backend/tests/integration/test_migrations.py`
- [X] T012 [P] Add health API test in `backend/tests/contract/test_health.py`
  - AC: Contract test validates `/health` response schema and status code.
  - Artifacts: `backend/tests/contract/test_health.py`
- [X] T013 Implement repository package scaffolding and SQL file organization in `backend/app/repositories/`
  - AC: SQL statements live under `backend/app/repositories/sql/` with no SQL in API/service modules.
  - Artifacts: `backend/app/repositories/__init__.py`, `backend/app/repositories/sql/`

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 - Create and Start Event (Priority: P1) 🎯 MVP

**Goal**: Host can create players/events, preview event details, and start round 1.

**Independent Test**: Create event with 8 players + 2 courts, call start endpoint, verify persisted round 1 assignments.

### Tests for User Story 1

- [X] T014 [P] [US1] Add players API contract tests in `backend/tests/contract/test_players_api.py`
  - AC: Covers `GET /players?query=`, `POST /players`, `GET /players/{id}` with expected status/error codes.
  - Artifacts: `backend/tests/contract/test_players_api.py`
- [X] T015 [P] [US1] Add events create/fetch/start contract tests in `backend/tests/contract/test_events_api.py`
  - AC: Covers `POST /events`, `GET /events/{id}`, `POST /events/{id}/start`, `GET /events/{id}/rounds/current`.
  - Artifacts: `backend/tests/contract/test_events_api.py`
- [X] T016 [P] [US1] Add create-start integration flow test in `backend/tests/integration/test_us1_create_start_flow.py`
  - AC: End-to-end test persists event metadata, players/courts, and round 1 matches.
  - Artifacts: `backend/tests/integration/test_us1_create_start_flow.py`

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement domain enums and core dataclasses in `backend/app/domain/enums.py` and `backend/app/domain/models.py`
  - AC: Domain has no FastAPI/DB imports, type hints cover Player/Event/Round/Match, and IDs are UUID strings.
  - Artifacts: `backend/app/domain/enums.py`, `backend/app/domain/models.py`
- [X] T018 [P] [US1] Implement players repository + SQL in `backend/app/repositories/players_repo.py` and `backend/app/repositories/sql/players.sql`
  - AC: Supports create/search/get using SQL only inside repository layer.
  - Artifacts: `backend/app/repositories/players_repo.py`, `backend/app/repositories/sql/players.sql`
- [X] T019 [P] [US1] Implement events repository + SQL in `backend/app/repositories/events_repo.py` and `backend/app/repositories/sql/events.sql`
  - AC: Supports create/get/set_status/add_players/add_courts with DB constraints enforced.
  - Artifacts: `backend/app/repositories/events_repo.py`, `backend/app/repositories/sql/events.sql`
- [X] T020 [P] [US1] Implement rounds and matches repositories + SQL in `backend/app/repositories/rounds_repo.py`, `backend/app/repositories/matches_repo.py`, and SQL files
  - AC: Supports create_round/get_current_round/create_matches_bulk/list_by_round/set_result.
  - Artifacts: `backend/app/repositories/rounds_repo.py`, `backend/app/repositories/matches_repo.py`, `backend/app/repositories/sql/rounds.sql`, `backend/app/repositories/sql/matches.sql`
- [X] T021 [US1] Implement Pydantic request/response schemas in `backend/app/api/schemas/players.py` and `backend/app/api/schemas/events.py`
  - AC: Schemas align with `contracts/api.yaml` including validation ranges/enums and UUID string IDs.
  - Artifacts: `backend/app/api/schemas/players.py`, `backend/app/api/schemas/events.py`
- [X] T022 [US1] Implement player service orchestration in `backend/app/services/player_service.py`
  - AC: Service has business logic only; no embedded SQL.
  - Artifacts: `backend/app/services/player_service.py`
- [X] T023 [US1] Implement event creation/start service in `backend/app/services/event_service.py`
  - AC: Creates `Lobby` event, attaches players/courts, validates minimum playable setup, starts event to `Running`.
  - Artifacts: `backend/app/services/event_service.py`
- [X] T024 [US1] Implement Americano round-1 scheduling in `backend/app/services/americano_service.py`
  - AC: Generates normalized round plan mapped to selected courts and persists matches.
  - Artifacts: `backend/app/services/americano_service.py`
- [X] T025 [US1] Implement players and events routers in `backend/app/api/routers/players.py` and `backend/app/api/routers/events.py`
  - AC: Endpoints return expected Pydantic schemas, UUID string IDs, and 400/404 behavior.
  - Artifacts: `backend/app/api/routers/players.py`, `backend/app/api/routers/events.py`
- [X] T026 [US1] Implement rounds current/start router actions in `backend/app/api/routers/rounds.py`
  - AC: `POST /events/{id}/start` and `GET /events/{id}/rounds/current` work with persisted data.
  - Artifacts: `backend/app/api/routers/rounds.py`
- [X] T027 [US1] Scaffold frontend routing and page placeholders in `frontend/src/app/router.tsx` and `frontend/src/pages/*.tsx`
  - AC: Routes exist for Home/CreateEvent/PreviewEvent/RunEvent/Summary.
  - Artifacts: `frontend/src/app/router.tsx`, `frontend/src/pages/Home.tsx`, `frontend/src/pages/CreateEvent.tsx`, `frontend/src/pages/PreviewEvent.tsx`, `frontend/src/pages/RunEvent.tsx`, `frontend/src/pages/Summary.tsx`
- [X] T028 [US1] Implement create-event API client and form submission in `frontend/src/lib/api.ts` and `frontend/src/pages/CreateEvent.tsx`
  - AC: Form submits event metadata, selected courts, and players to backend.
  - Artifacts: `frontend/src/lib/api.ts`, `frontend/src/pages/CreateEvent.tsx`
- [X] T029 [US1] Implement preview/start flow UI in `frontend/src/pages/PreviewEvent.tsx`
  - AC: Preview is frontend-only step; Start calls `/events/{id}/start` then routes to RunEvent page.
  - Artifacts: `frontend/src/pages/PreviewEvent.tsx`

**Checkpoint**: US1 independently functional and testable.

---

## Phase 4: User Story 2 - Run Rounds and Enter Results (Priority: P1)

**Goal**: Host enters per-court results and advances rounds only when complete.

**Independent Test**: For each mode, complete one round of results and verify next round generation rules.

### Tests for User Story 2

- [X] T030 [P] [US2] Add scoring unit tests in `backend/tests/unit/test_scoring.py`
  - AC: Covers Americano win/loss, Mexicano sum=24 validation, BeatTheBox win/loss/draw deltas.
  - Artifacts: `backend/tests/unit/test_scoring.py`
- [X] T031 [P] [US2] Add scheduling unit tests in `backend/tests/unit/test_scheduling.py`
  - AC: Covers round 1/next-round generation for Americano and Mexicano partner-repeat constraint.
  - Artifacts: `backend/tests/unit/test_scheduling.py`
- [X] T032 [P] [US2] Add results-and-advance API contract tests in `backend/tests/contract/test_round_progression_api.py`
  - AC: Validates `/matches/{matchId}/result` and `/events/{eventId}/next` schemas + errors.
  - Artifacts: `backend/tests/contract/test_round_progression_api.py`
- [X] T033 [P] [US2] Add round progression integration tests in `backend/tests/integration/test_us2_round_flow.py`
  - AC: Blocks advance on incomplete results and increments round after completion.
  - Artifacts: `backend/tests/integration/test_us2_round_flow.py`

### Implementation for User Story 2

- [X] T034 [US2] Implement pure scoring module in `backend/app/domain/scoring.py`
  - AC: Deterministic pure functions with clear exceptions for invalid inputs.
  - Artifacts: `backend/app/domain/scoring.py`
- [X] T035 [US2] Implement pure scheduling module in `backend/app/domain/scheduling.py`
  - AC: Exposes `generate_round_1(...)` and `generate_next_round(...)` returning normalized RoundPlan.
  - Artifacts: `backend/app/domain/scheduling.py`
- [X] T036 [US2] Implement rankings repository + SQL in `backend/app/repositories/rankings_repo.py` and `backend/app/repositories/sql/rankings.sql`
  - AC: Supports `get_global_rankings` and `apply_update` without SQL leakage.
  - Artifacts: `backend/app/repositories/rankings_repo.py`, `backend/app/repositories/sql/rankings.sql`
- [X] T037 [US2] Implement round result workflow service in `backend/app/services/round_service.py`
  - AC: Records result, updates round/event scores, enforces round-complete gate before advance.
  - Artifacts: `backend/app/services/round_service.py`
- [X] T038 [US2] Extend rounds router for results + next round in `backend/app/api/routers/rounds.py`
  - AC: Implements `POST /matches/{matchId}/result` and `POST /events/{id}/next`.
  - Artifacts: `backend/app/api/routers/rounds.py`
- [X] T039 [US2] Build Run Event court grid + Americano result entry UI in `frontend/src/pages/RunEvent.tsx`
  - AC: Court cards render teams and allow click-to-select winner per match.
  - Artifacts: `frontend/src/pages/RunEvent.tsx`
- [X] T040 [US2] Add result submission and next-round gating in `frontend/src/features/run-event/resultEntry.ts` and `frontend/src/features/run-event/nextRound.ts`
  - AC: Next Match button disabled until all round matches are completed.
  - Artifacts: `frontend/src/features/run-event/resultEntry.ts`, `frontend/src/features/run-event/nextRound.ts`

**Checkpoint**: US2 independently functional and testable.

---

## Phase 5: User Story 3 - Finish Event and Review Summary (Priority: P2)

**Goal**: Host finishes events with final standings + match history, including BeatTheBox ranking persistence.

**Independent Test**: Complete event to final round, finish it, verify summary payload and persistent global ranking effects.

### Tests for User Story 3

- [X] T041 [P] [US3] Add finish-event contract tests in `backend/tests/contract/test_event_finish_api.py`
  - AC: Validates `/events/{eventId}/finish` response schema and final-round precondition.
  - Artifacts: `backend/tests/contract/test_event_finish_api.py`
- [X] T042 [P] [US3] Add Mexicano and BeatTheBox integration tests in `backend/tests/integration/test_us3_modes_and_summary.py`
  - AC: Covers Mexicano regrouping + partner constraint and BeatTheBox global ranking persistence.
  - Artifacts: `backend/tests/integration/test_us3_modes_and_summary.py`

### Implementation for User Story 3

- [X] T043 [US3] Implement Mexicano service logic in `backend/app/services/mexicano_service.py`
  - AC: Next-round regrouping by score works with best-effort no-same-partner rule.
  - Artifacts: `backend/app/services/mexicano_service.py`
- [X] T044 [US3] Implement BeatTheBox service logic in `backend/app/services/beat_the_box_service.py`
  - AC: 3-round box rotations and +25/-15/+5 global updates persist across events.
  - Artifacts: `backend/app/services/beat_the_box_service.py`
- [X] T045 [US3] Implement finish-event summary service in `backend/app/services/summary_service.py`
  - AC: Computes winner, standings, per-round player breakdown, and match history.
  - Artifacts: `backend/app/services/summary_service.py`
- [X] T046 [US3] Add finish endpoint integration in `backend/app/api/routers/events.py`
  - AC: `POST /events/{id}/finish` enforces final-round completion and returns `EventSummary` schema.
  - Artifacts: `backend/app/api/routers/events.py`, `backend/app/api/schemas/summary.py`
- [X] T047 [US3] Implement score picker for Mexicano and outcome picker for BeatTheBox in `frontend/src/features/run-event/modeInputs.tsx`
  - AC: Mexicano UI enforces total 24; BeatTheBox supports win/loss/draw.
  - Artifacts: `frontend/src/features/run-event/modeInputs.tsx`
- [X] T048 [US3] Implement summary page standings/history rendering in `frontend/src/pages/Summary.tsx`
  - AC: Winner, rankings, and round-grouped match history are visible and consistent with backend summary.
  - Artifacts: `frontend/src/pages/Summary.tsx`

**Checkpoint**: US3 independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story quality, UI foundation, and hardening.

- [X] T049 [P] Add AppShell, Logo button, and LightRays background in `frontend/src/app/AppShell.tsx`, `frontend/src/components/branding/LogoButton.tsx`, and `frontend/src/components/backgrounds/LightRaysBackground.tsx`
  - AC: Logo routes to Home; background is visible and non-blocking (`pointer-events: none`).
  - Artifacts: `frontend/src/app/AppShell.tsx`, `frontend/src/components/branding/LogoButton.tsx`, `frontend/src/components/backgrounds/LightRaysBackground.tsx`
- [X] T050 [P] Add MagicBento home navigation (no stars) in `frontend/src/components/bento/MagicBentoMenu.tsx` and `frontend/src/pages/Home.tsx`
  - AC: Menu renders without stars; cards navigate to key host flows.
  - Artifacts: `frontend/src/components/bento/MagicBentoMenu.tsx`, `frontend/src/pages/Home.tsx`
- [X] T051 [P] Add mode accordion and court/player selection components in `frontend/src/components/mode/ModeAccordion.tsx` and `frontend/src/components/courts/CourtSelector.tsx`
  - AC: Single-open mode accordion and clear selected courts/players UX.
  - Artifacts: `frontend/src/components/mode/ModeAccordion.tsx`, `frontend/src/components/courts/CourtSelector.tsx`, `frontend/src/components/players/PlayerSelector.tsx`
- [X] T052 Enforce no-SQL-outside-repositories check in `backend/tests/unit/test_architecture_boundaries.py`
  - AC: Test fails if SQL statements appear outside `backend/app/repositories/**`.
  - Artifacts: `backend/tests/unit/test_architecture_boundaries.py`
- [X] T053 Run and document final verification commands in `specs/001-padel-host-app-mvp/quickstart.md`
  - AC: quickstart includes up-to-date commands for backend/frontend run, tests, and lint checks.
  - Artifacts: `specs/001-padel-host-app-mvp/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> no dependencies.
- Phase 2 -> depends on Phase 1 and blocks all user story phases.
- Phase 3 (US1) -> depends on Phase 2.
- Phase 4 (US2) -> depends on Phase 2 and can start after US1 API foundations are merged.
- Phase 5 (US3) -> depends on Phase 2 and US2 round lifecycle APIs.
- Phase 6 -> depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent MVP slice after foundational work.
- **US2 (P1)**: Builds on started event flow from US1.
- **US3 (P2)**: Builds on US2 completion and multi-round persistence.

### Within Each User Story

- Tests first (contract/integration/unit as listed).
- Domain/repositories before services.
- Services before routers.
- Backend endpoints before frontend integrations.

## Parallel Opportunities

- Setup: T002-T005 can run in parallel.
- Foundational: T007, T009, T011, T012 run in parallel after T006/T008 setup.
- US1: T014-T016 parallel; T018-T020 parallel; frontend T027-T029 parallel after API contracts settle.
- US2: T030-T033 parallel; T034/T035 parallel; frontend T039/T040 parallel.
- US3: T041/T042 parallel; T043/T044 parallel; frontend T047/T048 parallel.
- Polish: T049-T051-T052 can run in parallel.

## Parallel Example: User Story 1

```bash
# Parallel tests
Task: "T014 [US1] backend/tests/contract/test_players_api.py"
Task: "T015 [US1] backend/tests/contract/test_events_api.py"
Task: "T016 [US1] backend/tests/integration/test_us1_create_start_flow.py"

# Parallel repository implementation
Task: "T018 [US1] backend/app/repositories/players_repo.py"
Task: "T019 [US1] backend/app/repositories/events_repo.py"
Task: "T020 [US1] backend/app/repositories/rounds_repo.py + matches_repo.py"
```

## Parallel Example: User Story 2

```bash
# Parallel pure-domain work
Task: "T034 [US2] backend/app/domain/scoring.py"
Task: "T035 [US2] backend/app/domain/scheduling.py"

# Parallel test work
Task: "T030 [US2] backend/tests/unit/test_scoring.py"
Task: "T031 [US2] backend/tests/unit/test_scheduling.py"
```

## Parallel Example: User Story 3

```bash
# Parallel mode services
Task: "T043 [US3] backend/app/services/mexicano_service.py"
Task: "T044 [US3] backend/app/services/beat_the_box_service.py"

# Parallel UI tasks
Task: "T047 [US3] frontend/src/features/run-event/modeInputs.tsx"
Task: "T048 [US3] frontend/src/pages/Summary.tsx"
```

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) only.
3. Validate US1 independent test and demo create/start flow.

### Incremental Delivery

1. Deliver US1 (create/start) as first release.
2. Add US2 (results + next round) as second release.
3. Add US3 (finish + full mode support + rankings) as third release.

### Definition of Done Enforcement

- Each task must compile/run.
- Tests added/updated and passing via `pytest` (and frontend tests where applicable).
- API schemas validated with Pydantic models.
- SQL remains only in `backend/app/repositories/**`.
- Lint/format checks pass (ruff, frontend lint).
