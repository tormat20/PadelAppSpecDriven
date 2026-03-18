# Tasks: Player Management & Reset Controls (033)

**Input**: Design documents from `/specs/033-player-management-reset/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire backend infrastructure that all stories depend on before any endpoint can work.

- [x] T001 Add `delete` and `delete_all` methods to `backend/app/repositories/players_repo.py`
- [x] T002 Add `reset_all_stats` method to `backend/app/repositories/player_stats_repo.py`
- [x] T003 Add `player_stats_repo` parameter and `delete_player`, `delete_all_players`, `reset_all_player_stats` methods to `backend/app/services/player_service.py`
- [x] T004 Update `services_scope()` in `backend/app/api/deps.py` to pass `player_stats_repo` when constructing `PlayerService`
- [x] T005 Create `backend/app/api/routers/admin.py` with the two admin endpoints (reset-stats + delete-all, no logic yet — just stubs that call service methods)
- [x] T006 Register admin router in `backend/app/main.py`

**Checkpoint**: Backend wired — all three endpoints exist and are callable. Run `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q` — all existing tests must still pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Frontend scaffolding that all user story UI depends on.

**⚠️ CRITICAL**: No frontend user story work can begin until this phase is complete.

- [x] T007 Add `deletePlayer`, `resetAllPlayerStats`, `deleteAllPlayers` functions to `frontend/src/lib/api.ts`
- [x] T008 Create `frontend/src/components/ConfirmDialog.tsx` (reusable modal, `variant` prop for danger/default, `isLoading` prop)
- [x] T009 Add `.button--danger` and `.confirm-dialog*` CSS classes to `frontend/src/styles/components.css`

**Checkpoint**: Foundation ready — `ConfirmDialog` renders, API functions compile. Run `cd frontend && npm test -- --run` — all existing tests pass.

---

## Phase 3: User Story 1 — Reset All Player Stats (Priority: P1) 🎯 MVP

**Goal**: Admin can click "Reset Player Stats" in Account Settings, confirm, and all accumulated stats are zeroed while players remain.

**Independent Test**: Log in as admin → Account Settings → click "Reset Player Stats" → confirm dialog appears → click "Yes, reset" → success message shown → navigate to Player Search and verify all players still appear.

### Tests for User Story 1

- [x] T010 [US1] Write unit test file `frontend/tests/player-search-filter.test.ts` with 6 test cases for the `filterPlayers` export (write now; will fail until T020 exports the function — that is expected)

### Implementation for User Story 1

- [x] T011 [US1] Add the "Player Management" admin section JSX (Reset Stats button + ConfirmDialog + success message) to `frontend/src/pages/AccountSettings.tsx`
- [x] T012 [US1] Add `confirmDialog`, `isSubmitting`, `statusMessage` state and `handleResetStats` handler to `frontend/src/pages/AccountSettings.tsx`
- [x] T013 [US1] Add `.settings-section-description`, `.settings-danger-actions`, `.settings-status-message` CSS classes to `frontend/src/styles/components.css`
- [x] T014 [P] [US1] Write backend test cases 4–5 (reset-stats endpoint: 200 response + 403 for non-admin) in `backend/tests/test_player_delete.py`

**Checkpoint**: US1 fully functional. Run `cd backend && PYTHONPATH=. uv run python -m pytest tests/test_player_delete.py -v` for backend. Manual test: admin resets stats successfully; non-admin cannot.

---

## Phase 4: User Story 2 — Remove All Players (Priority: P2)

**Goal**: Admin can click "Remove All Players" in Account Settings, confirm a strong warning dialog, and every player plus all associated data is deleted.

**Independent Test**: Log in as admin → Account Settings → click "Remove All Players" → confirm dialog with strong warning appears → click "Yes, delete all" → success message shown → navigate to Player Search → empty state shown.

### Implementation for User Story 2

- [x] T015 [US2] Add "Remove All Players" button to the existing "Player Management" section in `frontend/src/pages/AccountSettings.tsx` (extends T011's section)
- [x] T016 [US2] Add `handleDeleteAll` handler and `delete-all` dialog mode to the state already added in T012 in `frontend/src/pages/AccountSettings.tsx`
- [x] T017 [P] [US2] Write backend test cases 6–8 (delete-all endpoint: 200, 403 non-admin, 200 when already empty) in `backend/tests/test_player_delete.py`

**Checkpoint**: US1 and US2 both functional. Account Settings shows two destructive action buttons; both require confirmation and show success messages.

---

## Phase 5: User Story 3 — Richer Player Search Rows (Priority: P3)

**Goal**: Every player row in search results shows `displayName` prominently and `email` below it; search filter matches on both fields.

**Independent Test**: Navigate to Player Search → each row shows name and email → type an email address fragment in the search box → only the matching player is returned.

### Implementation for User Story 3

- [x] T018 [US3] Export `filterPlayers` from `frontend/src/pages/SearchPlayer.tsx` (add `export` keyword) and extend it to also match on `email` field
- [x] T019 [US3] Ensure email is always conditionally rendered in the non-edit player row in `frontend/src/pages/SearchPlayer.tsx` (existing `{player.email && ...}` is already correct — verify and leave as-is or tighten layout with CSS if needed)

**Checkpoint**: US3 functional. The `player-search-filter.test.ts` test from T010 now passes. Run `cd frontend && npm test -- --run` — all tests pass including the 6 filter tests.

---

## Phase 6: User Story 4 — Per-Player Delete in Search (Priority: P4)

**Goal**: Admin can enter edit mode in Player Search, click "−" on a specific player, confirm the dialog, and only that player is deleted without a page reload.

**Independent Test**: Navigate to Player Search → click "Edit" → "−" buttons appear, "Edit" changes to "Done" → click "Done" → back to normal → click "Edit" again → click "−" next to one player → confirmation dialog names that player → click "Yes, remove" → player disappears from list; other players remain.

### Implementation for User Story 4

- [x] T020 [US4] Add `isEditing`, `deletingId`, `deleteError`, `isDeleting` state to `frontend/src/pages/SearchPlayer.tsx`
- [x] T021 [US4] Add "Edit"/"Done" toggle button to the player list panel header in `frontend/src/pages/SearchPlayer.tsx`
- [x] T022 [US4] Replace existing `<ul>` player list with edit-mode-aware version (normal rows navigate; edit rows show "−" button) in `frontend/src/pages/SearchPlayer.tsx`
- [x] T023 [US4] Add per-player `ConfirmDialog` and `handleDeleteConfirmed` handler to `frontend/src/pages/SearchPlayer.tsx`
- [x] T024 [US4] Add `.player-search-panel-header`, `.player-search-count`, `.player-search-edit-btn`, `.player-search-row--edit`, `.player-search-remove-btn` CSS classes to `frontend/src/styles/components.css`
- [x] T025 [P] [US4] Write backend test cases 1–3 (per-player delete: 200, 404, 403) in `backend/tests/test_player_delete.py`

**Checkpoint**: US4 functional. Edit mode works; per-player delete removes only the targeted player. All backend test cases 1–8 pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation pass across all user stories.

- [x] T026 Run full frontend type-check: `cd frontend && npx tsc --noEmit` — zero errors
- [x] T027 [P] Run full frontend test suite: `cd frontend && npm test -- --run` — all tests pass (including `player-search-filter.test.ts`)
- [x] T028 [P] Run full backend test suite: `cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q` — all tests pass
- [x] T029 Verify no hardcoded hex colours in the new CSS and components — all colours via `var(--color-*)` tokens
- [x] T030 Verify all new interactive buttons use `withInteractiveSurface()` (AccountSettings two buttons + SearchPlayer Edit/Done + "−" remove buttons)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all frontend user story work**
- **US1 (Phase 3)**: Depends on Phase 1 + Phase 2
- **US2 (Phase 4)**: Depends on Phase 1 + Phase 2; extends Phase 3 AccountSettings work (T011–T012 must exist)
- **US3 (Phase 5)**: Depends on Phase 2 only; independent of US1/US2
- **US4 (Phase 6)**: Depends on Phase 2; extends Phase 5 SearchPlayer work (T018–T019 must exist for `filterPlayers` export)
- **Polish (Phase 7)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 + 2. No dependency on other stories.
- **US2 (P2)**: Depends on Phase 1 + 2. Shares `AccountSettings.tsx` with US1 — implement US1 first (extends same section).
- **US3 (P3)**: Depends on Phase 2 only (no backend changes). Independent of US1/US2.
- **US4 (P4)**: Depends on Phase 2 and US3 (needs `filterPlayers` export from T018). Backend work (T025) is independent.

### Within Each User Story

- Backend repo/service methods (Phase 1) before endpoints and tests
- ConfirmDialog component (Phase 2) before any page that uses it
- US1 AccountSettings section before US2 extension (same file)
- US3 `filterPlayers` export before US4 edit-mode work (same file; avoid conflicts)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files: players_repo vs player_stats_repo)
- T007, T008, T009 (Phase 2) can all run in parallel (different files)
- T010 (write test) can run in parallel with T011–T013 (different files)
- T014 and T015/T016 can run in parallel (backend tests vs frontend page)
- T017 and T025 can run in parallel with their respective frontend tasks
- T026, T027, T028 in Polish can all run in parallel (independent check commands)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These three tasks can run simultaneously:
Task A: "Add API functions to frontend/src/lib/api.ts"           # T007
Task B: "Create frontend/src/components/ConfirmDialog.tsx"        # T008
Task C: "Add button--danger + confirm-dialog CSS to components.css" # T009
```

## Parallel Example: User Story 1

```bash
# Write test while implementing UI:
Task A: "Write player-search-filter.test.ts"                      # T010
Task B: "Add Player Management section JSX to AccountSettings.tsx" # T011
Task C: "Backend test cases 4-5 in test_player_delete.py"         # T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T009)
3. Complete Phase 3: User Story 1 (T010–T014)
4. **STOP and VALIDATE**: Admin resets stats; all tests pass
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → backend wired, `ConfirmDialog` ready
2. Phase 3 → US1: Reset Stats in Account Settings ✓
3. Phase 4 → US2: Remove All Players in Account Settings ✓
4. Phase 5 → US3: Richer search rows + email filter ✓
5. Phase 6 → US4: Edit mode + per-player delete ✓
6. Phase 7 → Polish + final validation ✓

Each phase adds value without breaking previous phases. US3 and US4 (search improvements) can be deferred if Account Settings work (US1 + US2) is the priority.

---

## Notes

- `[P]` tasks = different files, no shared state dependencies — safe to parallelize
- `[Story]` label maps each task to its user story for traceability
- T010 is written before its implementation (T018) by design — the test file exists but the export is added in a later phase; the test is expected to fail until T018 is complete
- Backend test file `test_player_delete.py` is built incrementally: T014 (US1), T017 (US2), T025 (US4) — all add test cases to the same file in sequence
- No new npm packages, no schema migrations, no new DB tables
- Commit after each checkpoint (end of each phase) for clean history
