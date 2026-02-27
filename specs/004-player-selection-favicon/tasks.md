# Tasks: Player Selection and Favicon Improvements

**Input**: Design documents from `/specs/001-player-selection-favicon/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/player-selection-contract.md`, `quickstart.md`

**Tests**: Include targeted automated tests because the specification explicitly requires validation for add-and-assign behavior, prefix suggestions, remove behavior, event-setup regression, and favicon wiring.

**Organization**: Tasks are grouped by user story so each story can be delivered and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Story label used only in user-story phases (`[US1]`, `[US2]`, `[US3]`)
- Every task includes a concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project scaffolding and verification artifacts for this feature.

- [X] T001 Create feature QA checklist scaffold in `specs/001-player-selection-favicon/checklists/player-selection-qa.md`
- [X] T002 Create create-event feature utility folder and placeholder modules in `frontend/src/features/create-event/`
- [X] T003 [P] Add draft player state utility scaffold in `frontend/src/features/create-event/draftPlayers.ts`
- [X] T004 [P] Add player-search helper scaffold in `frontend/src/features/create-event/playerSearch.ts`
- [X] T005 [P] Create favicon asset folder in `frontend/public/icons/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared behavior required by all stories.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T006 Add player name normalization helper in `frontend/src/lib/playerNames.ts`
- [X] T007 Extend player API helpers for prefix search and add/reuse flow in `frontend/src/lib/api.ts`
- [X] T008 Implement active-draft player assignment persistence read/write in `frontend/src/features/create-event/draftPlayers.ts`
- [X] T009 Wire create-event page state hydration from active draft assignment persistence in `frontend/src/pages/CreateEvent.tsx`
- [X] T010 Add shared UI state text constants for player add/search outcomes in `frontend/src/features/create-event/playerMessages.ts`

**Checkpoint**: Foundational state, API helper, and persistence support are ready.

---

## Phase 3: User Story 1 - Add and assign players during event setup (Priority: P1) 🎯 MVP

**Goal**: Ensure Add New creates or reuses a player and immediately assigns that player to the active event draft with clear feedback.

**Independent Test**: Start from empty catalog, add a player, verify immediate assignment visibility, refresh/return to draft, and verify assignment restoration.

### Tests for User Story 1

- [X] T011 [P] [US1] Add add-and-assign behavior test in `frontend/tests/player-selector-add.test.tsx`
- [X] T012 [P] [US1] Add duplicate-name reuse test in `frontend/tests/player-selector-duplicate.test.tsx`
- [X] T013 [P] [US1] Add draft restore test for assigned players in `frontend/tests/create-event-draft-persistence.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Update add-new flow to create-or-reuse and auto-assign player in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T015 [US1] Render assigned-player list and empty-assigned state in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T016 [US1] Show clear created-vs-reused feedback messages in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T017 [US1] Persist assignment updates from create-event flow in `frontend/src/pages/CreateEvent.tsx`
- [X] T018 [US1] Add assigned-player list styling hooks in `frontend/src/styles/components.css`

**Checkpoint**: US1 is functional and independently testable.

---

## Phase 4: User Story 2 - Find and manage assigned players quickly (Priority: P2)

**Goal**: Provide first-character prefix suggestions and left-side minus removal from event draft without global catalog deletion.

**Independent Test**: Search with one-character prefix and verify suggestions include expected names; remove an assigned player with left-side minus and verify only draft assignment is removed.

### Tests for User Story 2

- [X] T019 [P] [US2] Add one-character prefix suggestion test in `frontend/tests/player-selector-search.test.tsx`
- [X] T020 [P] [US2] Add minus-action unassign-only test in `frontend/tests/player-selector-remove.test.tsx`
- [X] T021 [P] [US2] Add empty-search-result state test in `frontend/tests/player-selector-empty-search.test.tsx`

### Implementation for User Story 2

- [X] T022 [US2] Implement first-character live prefix suggestion behavior in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T023 [US2] Implement case-insensitive prefix match helper usage in `frontend/src/features/create-event/playerSearch.ts`
- [X] T024 [US2] Add left-aligned minus control per assigned-player row in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T025 [US2] Ensure minus action removes only draft assignment in `frontend/src/pages/CreateEvent.tsx`
- [X] T026 [US2] Add no-match search result messaging in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T027 [US2] Add assigned-row minus-control styling in `frontend/src/styles/components.css`

**Checkpoint**: US2 search and assignment management are independently testable.

---

## Phase 5: User Story 3 - Show correct browser tab branding (Priority: P3)

**Goal**: Configure Molndal logo favicon with SVG primary and PNG fallback.

**Independent Test**: Load app and verify tab icon uses Molndal logo; confirm fallback path availability.

### Tests for User Story 3

- [X] T028 [P] [US3] Add favicon link smoke test in `frontend/tests/favicon-links.test.ts`

### Implementation for User Story 3

- [X] T029 [US3] Copy Molndal logo SVG favicon asset to `frontend/public/icons/molndal-padel-favicon.svg`
- [X] T030 [US3] Add PNG fallback favicon asset in `frontend/public/icons/molndal-padel-favicon.png`
- [X] T031 [US3] Configure favicon link tags (SVG primary + PNG fallback) in `frontend/index.html`
- [X] T032 [US3] Add favicon verification note for cache-refresh scenarios in `specs/001-player-selection-favicon/quickstart.md`

**Checkpoint**: US3 branding behavior is independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and contract alignment across all stories.

- [X] T033 [P] Update contract verification notes with implemented behavior in `specs/001-player-selection-favicon/contracts/player-selection-contract.md`
- [X] T034 Run automated checks (`npm run lint` and `npm run test`) and capture outputs in `specs/001-player-selection-favicon/checklists/player-selection-qa.md`
- [ ] T035 Execute quickstart manual scenarios and capture pass/fail evidence in `specs/001-player-selection-favicon/checklists/player-selection-qa.md`
- [X] T036 [P] Refine player-selector wording and state labels for consistency in `frontend/src/components/players/PlayerSelector.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story phases.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP value.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed parallel with US1 if staffing allows.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed parallel with US1/US2.
- **Phase 6 (Polish)**: Depends on selected story completion.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational completion.
- **US2 (P2)**: Independent after foundational completion, but integrates with US1 player-assignment UI.
- **US3 (P3)**: Independent after foundational completion.

### Within Each User Story

- Test tasks precede implementation tasks.
- Shared-file updates in `frontend/src/components/players/PlayerSelector.tsx` and `frontend/src/pages/CreateEvent.tsx` should be sequenced to avoid conflicts.
- Each story must pass its independent test before moving forward.

### Parallel Opportunities

- Setup: T003, T004, and T005 can run in parallel.
- US1 tests: T011, T012, and T013 can run in parallel.
- US2 tests: T019, T020, and T021 can run in parallel.
- US3: T028 and T029 can run in parallel before T031.
- Polish: T033 and T036 can run in parallel before T034/T035 signoff.

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel:
Task: "T011 [US1] Add add-and-assign behavior test in frontend/tests/player-selector-add.test.tsx"
Task: "T012 [US1] Add duplicate-name reuse test in frontend/tests/player-selector-duplicate.test.tsx"
Task: "T013 [US1] Add draft restore test in frontend/tests/create-event-draft-persistence.test.tsx"
```

## Parallel Example: User Story 2

```bash
# Run US2 tests in parallel:
Task: "T019 [US2] Add one-character prefix suggestion test in frontend/tests/player-selector-search.test.tsx"
Task: "T020 [US2] Add minus-action unassign-only test in frontend/tests/player-selector-remove.test.tsx"
Task: "T021 [US2] Add empty-search-result state test in frontend/tests/player-selector-empty-search.test.tsx"
```

## Parallel Example: User Story 3

```bash
# Parallelize favicon prep:
Task: "T028 [US3] Add favicon link smoke test in frontend/tests/favicon-links.test.ts"
Task: "T029 [US3] Copy SVG favicon asset to frontend/public/icons/molndal-padel-favicon.svg"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3) and pass US1 independent test.
3. Demo add-and-assign plus draft-restore flow before expanding scope.

### Incremental Delivery

1. Deliver foundational behavior (Phases 1-2).
2. Deliver US1 for immediate event-setup unblock.
3. Deliver US2 for search/remove management improvements.
4. Deliver US3 for favicon branding.
5. Complete Phase 6 validation and evidence capture.

### Parallel Team Strategy

1. Team aligns on Phases 1-2.
2. Then split work:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Rejoin for polish and full validation signoff.

---

## Notes

- `[P]` markers indicate tasks on separate files or independent streams.
- Keep assignment-removal behavior strictly draft-scoped to protect catalog integrity.
- Use `specs/001-player-selection-favicon/checklists/player-selection-qa.md` as the single source of truth for final validation evidence.
