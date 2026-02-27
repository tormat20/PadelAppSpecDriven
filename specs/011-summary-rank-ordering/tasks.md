# Tasks: Summary Rank Column and Mode-Specific Ordering Rules

**Input**: Design documents from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/011-summary-rank-ordering/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include backend and frontend test tasks because the specification explicitly requires automated coverage of rank column, ordering rules, and regressions.

**Organization**: Tasks are grouped by user story to preserve independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared scaffolding for deterministic ranking logic and test data.

- [X] T001 Create summary ranking helper module scaffold in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T002 [P] Create frontend rank utility module scaffold in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/summary/rankOrdering.ts`
- [X] T003 [P] Add shared summary ranking fixture builders for backend tests in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_summary_ranking_fixtures.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared summary contract and type updates needed by all stories.

**⚠️ CRITICAL**: No user story work starts until these are complete.

- [X] T004 Extend summary API schemas with explicit row rank and ordering metadata fields in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/api/schemas/summary.py`
- [X] T005 Implement backend ordering metadata model and mode dispatch entry points in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T006 Wire summary router responses to include rank/order metadata fields in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/api/routers/events.py`
- [X] T007 Extend frontend summary response types for rank/order metadata in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/lib/types.ts`
- [X] T008 Update frontend API normalization to parse rank/order metadata in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/lib/api.ts`

**Checkpoint**: Shared schema, metadata, and parsing are ready for story-specific behavior.

---

## Phase 3: User Story 1 - Final Results Show Deterministic Rank Order (Priority: P1) 🎯 MVP

**Goal**: Deliver deterministic final-summary rank ordering rules for Mexicano, Americano, and BeatTheBox.

**Independent Test**: Complete each mode and verify final summary rank values and row order exactly match mode-specific rules.

### Tests for User Story 1

- [X] T009 [P] [US1] Add backend contract tests for final-summary rank/order metadata in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/contract/test_summary_final_ranking_api.py`
- [X] T010 [P] [US1] Add backend integration tests for Americano court-priority + alphabetical intra-pair ordering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_summary_americano_final_ordering.py`
- [X] T011 [P] [US1] Add backend integration tests for Mexicano competition tie ranking in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_summary_mexicano_competition_ranking.py`
- [X] T012 [P] [US1] Add backend integration tests for BeatTheBox final points and group ordering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_summary_btb_final_ordering.py`
- [X] T013 [P] [US1] Add frontend tests for final-summary deterministic rank order rendering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/summary-final-ranking-order.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Implement Mexicano final rank/order computation with competition tie ranking in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T015 [US1] Implement Americano final court-priority winner/loser sequencing with alphabetical intra-pair ordering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T016 [US1] Implement BeatTheBox final numeric round points, totals, and court-group ordering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T017 [US1] Apply ordered ranked rows when building final summary payloads in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_service.py`
- [X] T018 [US1] Render final summary rows from ranked order metadata in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`

**Checkpoint**: Final summaries in all modes are independently deterministic and correctly ranked.

---

## Phase 4: User Story 2 - Summary Matrix Structure Is Consistent and Readable (Priority: P2)

**Goal**: Add and maintain the Rank column as the leftmost summary column in progress and final views.

**Independent Test**: Open progress and final summaries and verify column order is Rank, Player, rounds, Total with stable rank values.

### Tests for User Story 2

- [X] T019 [P] [US2] Add frontend test coverage for progress and final rank-column layout in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/summary-rank-column-layout.test.tsx`
- [X] T020 [P] [US2] Add backend contract test for progress-summary rank ordering output in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/contract/test_summary_progress_ranking_api.py`

### Implementation for User Story 2

- [X] T021 [US2] Implement progress-summary ranking by current accumulated score descending for all modes in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_ordering.py`
- [X] T022 [US2] Include rank values in progress-summary row payload construction in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_service.py`
- [X] T023 [US2] Render Rank as leftmost column in progress and final summary tables in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`
- [X] T024 [US2] Add summary rank-column styles for desktop/mobile readability in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`
- [X] T025 [US2] Ensure summary accessibility semantics remain valid with new Rank header in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/accessibility.css`

**Checkpoint**: Rank-first matrix structure is independently correct across progress and final views.

---

## Phase 5: User Story 3 - Existing Winner Highlighting and Event Flow Stay Intact (Priority: P3)

**Goal**: Preserve crown behavior and lifecycle flow correctness while new rank/order logic is active.

**Independent Test**: Run start/run/next/finish/summary for all modes and verify crown behavior unchanged with new ranking.

### Tests for User Story 3

- [X] T026 [P] [US3] Add frontend regression test for crown rendering with ranked rows in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/summary-crown-ranking-regression.test.tsx`
- [X] T027 [P] [US3] Add backend integration regression test for event lifecycle with ranking metadata enabled in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_summary_ranking_event_flow_regression.py`

### Implementation for User Story 3

- [X] T028 [US3] Keep crown assignment mapping compatible with ranked row payload output in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_service.py`
- [X] T029 [US3] Ensure frontend crown display uses stable player identity with ranked row ordering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`
- [X] T030 [US3] Update summary helper utilities for rank/crown coexistence in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/summary/rankOrdering.ts`

**Checkpoint**: Ranking changes are active without crown or lifecycle regressions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, docs, and verification gates across all stories.

- [X] T031 [P] Update feature validation steps and examples in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/011-summary-rank-ordering/quickstart.md`
- [X] T032 Run frontend validation suite (`npm run lint && npm run test`) from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/package.json`
- [X] T033 Run backend validation suite (`PYTHONPATH=. uv run pytest tests/contract tests/integration`) from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/pyproject.toml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP deterministic final ranking.
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with US1 if staffed.
- **Phase 5 (US3)**: Depends on Phase 2 and should run after US1/US2 core behavior is in place for regression safety.
- **Phase 6 (Polish)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational contract/type setup.
- **US2 (P2)**: Independent after foundational setup; uses shared metadata from Phase 2.
- **US3 (P3)**: Depends on US1/US2 behavior to validate regressions against final integrated ranking output.

### Recommended Story Order

1. US1 (deterministic final rank/order rules)
2. US2 (rank column and matrix consistency)
3. US3 (crown + lifecycle regression protection)

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel tests for mode-specific final ranking
T009 backend/tests/contract/test_summary_final_ranking_api.py
T010 backend/tests/integration/test_summary_americano_final_ordering.py
T011 backend/tests/integration/test_summary_mexicano_competition_ranking.py
T012 backend/tests/integration/test_summary_btb_final_ordering.py
T013 frontend/tests/summary-final-ranking-order.test.tsx
```

### User Story 2

```bash
# Parallel layout and progress ranking tests
T019 frontend/tests/summary-rank-column-layout.test.tsx
T020 backend/tests/contract/test_summary_progress_ranking_api.py
```

### User Story 3

```bash
# Parallel regression test authoring
T026 frontend/tests/summary-crown-ranking-regression.test.tsx
T027 backend/tests/integration/test_summary_ranking_event_flow_regression.py
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) for deterministic final rankings.
3. Validate final summary ordering in all three modes.
4. Demo MVP.

### Incremental Delivery

1. Complete Setup + Foundational phases.
2. Deliver US1 (final ranking correctness).
3. Deliver US2 (rank column consistency across progress/final).
4. Deliver US3 (regression safety for crowns and lifecycle).
5. Complete polish and full validation.

### Parallel Team Strategy

1. One developer handles backend ranking service/schema/router tasks while another handles frontend types/rendering after Phase 2.
2. Split story-specific tests and implementation by US phases.
3. Rejoin for integrated regression checks and final suites in Phase 6.
