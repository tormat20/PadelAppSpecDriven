# Tasks: Ongoing Summary and Streak Badges

**Input**: Design documents from `/specs/034-streak-summary-edit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No new test-authoring tasks are required by the spec; validation is handled in final polish via existing test suites and quickstart flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Include exact file paths in every task description

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared assets and API/type scaffolding used by multiple stories.

- [X] T001 Add momentum badge asset `snowflake.svg` in `frontend/public/images/icons/snowflake.svg`
- [X] T002 Extend summary-related frontend types for inline ongoing summary and momentum fields in `frontend/src/lib/types.ts`
- [X] T003 Add frontend API client methods for inline summary fetch and score correction actions in `frontend/src/lib/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build backend and shared projection foundations required by all user stories.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T004 Add score-correction request/response schemas for rounds/summary interactions in `backend/app/api/schemas/rounds.py`
- [X] T005 [P] Add repository support for editable result reads and correction metadata writes in `backend/app/repositories/matches_repo.py`
- [X] T006 [P] Add SQL statements for correction-safe result updates and correction history in `backend/app/repositories/sql/matches/set_result.sql`
- [X] T007 Implement round service correction pathway with validation, recalculation trigger, and audit payload generation in `backend/app/services/round_service.py`
- [X] T008 Add/extend API route for score correction endpoint behavior and conflict response handling in `backend/app/api/routers/rounds.py`
- [X] T009 Add summary projection service helpers for streak-state computation from ordered event-local outcomes in `backend/app/services/summary_service.py`

**Checkpoint**: Backend correction + streak projection foundation is ready.

---

## Phase 3: User Story 1 - Keep Event Context While Reviewing and Correcting Scores (Priority: P1) 🎯 MVP

**Goal**: Hosts can expand summary inline during an ongoing event and edit scores without leaving run-event context.

**Independent Test**: Start an ongoing event, open inline summary, edit one saved score, verify standings update and run-event context is preserved.

### Implementation for User Story 1

- [X] T010 [US1] Replace run-page secondary action label and behavior from navigation to inline toggle in `frontend/src/pages/RunEvent.tsx`
- [X] T011 [P] [US1] Create inline summary panel component with expand/collapse rendering in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T012 [P] [US1] Add inline summary panel styles and expanded layout rules for `grid-columns-2` continuation in `frontend/src/styles/components.css`
- [X] T013 [US1] Integrate inline summary data loading and refresh hooks into ongoing run flow in `frontend/src/pages/RunEvent.tsx`
- [X] T014 [US1] Add editable score rows and edit-mode form state handling in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T015 [US1] Wire inline score-save action to correction endpoint and conflict/validation messaging in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T016 [US1] Ensure post-save refresh updates standings, scores, and panel content without route change in `frontend/src/pages/RunEvent.tsx`
- [X] T017 [US1] Expose correction metadata in summary payload mapping for inline rendering in `backend/app/api/routers/events.py`

**Checkpoint**: US1 is fully functional and independently verifiable.

---

## Phase 4: User Story 2 - Highlight Hot and Cold Streaks During Ongoing Play (Priority: P2)

**Goal**: Ongoing event views show winner emphasis and hot/cold streak indicators based on 3-result momentum.

**Independent Test**: During an ongoing event, produce 3 consecutive wins and 3 consecutive losses in separate players and confirm fire/snowflake indicators appear and clear correctly when streaks break.

### Implementation for User Story 2

- [X] T018 [US2] Add momentum fields to in-progress summary response mapping in `backend/app/api/routers/events.py`
- [X] T019 [US2] Extend summary ordering/projection output with streak-state and winner-emphasis metadata in `backend/app/services/summary_service.py`
- [X] T020 [US2] Add helper utilities for consecutive win/loss evaluation from ordered match outcomes in `backend/app/services/summary_ordering.py`
- [X] T021 [US2] Surface momentum and winner-emphasis fields in frontend summary decoding and types in `frontend/src/lib/api.ts`
- [X] T022 [US2] Render fire/snowflake streak indicators and winner-score emphasis in inline ongoing summary rows in `frontend/src/components/run-event/InlineSummaryPanel.tsx`
- [X] T023 [US2] Replace legacy on-fire-name dependency in active run grid with momentum-driven display data in `frontend/src/pages/RunEvent.tsx`
- [X] T024 [US2] Add/adjust visual rules for streak icons and underlined winning scores in `frontend/src/styles/components.css`

**Checkpoint**: US2 works independently on top of foundational + US1 inline summary flows.

---

## Phase 5: User Story 3 - Replace Weekly Winner Fire Badge with Crown (Priority: P3)

**Goal**: Existing recent-winner badge uses crown icon while preserving current qualification logic.

**Independent Test**: Open views that show the recent-winner badge and confirm fire is replaced by crown with no change to who qualifies.

### Implementation for User Story 3

- [X] T025 [US3] Replace recent-winner fire icon rendering with crown in leaderboard/home sections in `frontend/src/pages/Home.tsx`
- [X] T026 [US3] Update court/player badge rendering for recent-winner state from fire to crown in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T027 [US3] Adjust badge alt text and semantics for recent-winner crown in `frontend/src/features/summary/crownWinners.ts`
- [X] T028 [US3] Remove stale fire-specific styling hooks used only for recent-winner badge displays in `frontend/src/styles/components.css`

**Checkpoint**: US3 is independently complete and visually consistent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, cleanup, and release readiness across all stories.

- [X] T029 Run full frontend typecheck and test suite for regression safety using `frontend/package.json` scripts
- [X] T030 Run full backend test suite with event/summary focus using `backend/tests/`
- [ ] T031 Execute manual validation steps from `specs/034-streak-summary-edit/quickstart.md` and record outcomes in `specs/034-streak-summary-edit/quickstart.md`
- [X] T032 Final UX/accessibility polish for inline summary editing states and badge legibility in `frontend/src/styles/components.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and integrates with US1 inline summary surfaces.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed in parallel with late US2 work if file conflicts are managed.
- **Phase 6 (Polish)**: Depends on all targeted user stories.

### User Story Dependencies

- **US1 (P1)**: Requires foundational correction and summary infrastructure; no dependency on US2/US3.
- **US2 (P2)**: Requires foundational streak projection and benefits from US1 inline summary UI for display/edit validation.
- **US3 (P3)**: Requires no US1 logic; independent visual replacement of recent-winner icon.

### Within Each User Story

- Backend projection/API changes before frontend consumption.
- Data wiring before UI rendering.
- UI render before final polish and quickstart validation.

---

## Parallel Opportunities

- **Phase 2**: T005 and T006 can run in parallel.
- **US1**: T011 and T012 can run in parallel once T010 is clear.
- **US2**: T021 can run in parallel with T020 after T019 shape is agreed.
- **US3**: T025 and T026 can run in parallel (different files).

## Parallel Example: User Story 1

```bash
# Parallel UI scaffolding for US1
Task: "T011 [US1] Create inline summary panel component in frontend/src/components/run-event/InlineSummaryPanel.tsx"
Task: "T012 [US1] Add inline summary panel styles in frontend/src/styles/components.css"
```

## Parallel Example: User Story 2

```bash
# Parallel momentum computation and frontend type wiring
Task: "T020 [US2] Add streak evaluation helpers in backend/app/services/summary_ordering.py"
Task: "T021 [US2] Surface momentum fields in frontend/src/lib/api.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel crown replacement across views
Task: "T025 [US3] Replace recent-winner fire icon in frontend/src/pages/Home.tsx"
Task: "T026 [US3] Replace recent-winner fire icon in frontend/src/components/courts/CourtGrid.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1 inline summary + score correction).
3. Validate US1 independently via its test criteria.

### Incremental Delivery

1. Foundation complete -> ship US1.
2. Add US2 momentum and winner emphasis.
3. Add US3 icon consistency replacement.
4. Run Phase 6 full polish and regression.

### Format Validation

All tasks follow required checklist format:
- Checkbox prefix `- [ ]`
- Sequential task IDs `T001`–`T032`
- `[P]` marker only on parallelizable tasks
- `[US#]` labels only on user-story-phase tasks
- Exact file paths included in each task description
