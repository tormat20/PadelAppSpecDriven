# Tasks: Navigation & UI Polish (018-nav-ui-polish)

**Input**: Design documents from `/specs/018-nav-ui-polish/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Tests**: Test tasks are included for US2 and US4 (pure helper functions that require unit tests). US1 and US3 have no new pure functions requiring tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline is green before any changes. All 158 existing tests must pass throughout.

- [X] T001 Run `cd frontend && npm test` — confirm all 158 existing tests pass before any changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Route registration and bento-card labels underpin US3 and US4 navigation. Complete these before creating new pages.

- [X] T002 Update `frontend/src/components/bento/MagicBentoMenu.tsx` — rename "Resume Event" → "View Events" (`to: "/events"`, subtitle: "Browse and manage all events") and "Player Setup" → "Register Player" (`to: "/players/register"`, subtitle: "Add a new player to the roster")
- [X] T003 Update `frontend/src/app/routes.tsx` — add `{ path: "events", element: <EventSlotsPage /> }` and `{ path: "players/register", element: <RegisterPlayerPage /> }` as children of AppShell (import stubs for now — replace with real pages in US3/US4)

**Checkpoint**: Bento card labels and routes are registered. Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Create Event: Main Menu button placement (Priority: P1) 🎯 MVP

**Goal**: Remove the "Main Menu" button from the `CreateEvent` page header and add it to the action row of each step panel (steps 0, 1, 2).

**Independent Test**: Open `/events/create`. Confirm no "Main Menu" in the page header. Confirm a "Main Menu" secondary button is present alongside the action buttons in each step panel.

### Implementation for User Story 1

- [X] T004 [US1] Edit `frontend/src/pages/CreateEvent.tsx` — remove `<button aria-label="Main menu">` from the `<header className="page-header panel">` block
- [X] T005 [US1] Edit `frontend/src/pages/CreateEvent.tsx` — add `<button aria-label="Main menu" className={withInteractiveSurface("button-secondary")} onClick={() => navigate("/")}>Main Menu</button>` as first item in the Step 0 (Setup) action row
- [X] T006 [US1] Edit `frontend/src/pages/CreateEvent.tsx` — add same Main Menu button as first item in the Step 1 (Roster) action row
- [X] T007 [US1] Edit `frontend/src/pages/CreateEvent.tsx` — add same Main Menu button as first item in the Step 2 (Confirm) action row
- [X] T008 [US1] Run `cd frontend && npm test` — confirm all existing tests still pass

**Checkpoint**: User Story 1 fully functional. All tests green.

---

## Phase 4: User Story 2 — Run Event: Round-progress stepper (Priority: P2)

**Goal**: Add a read-only round-progress `Stepper` directly below the Run Event heading, derived from `eventData.totalRounds` and `roundData.roundNumber`.

**Independent Test**: Navigate to a running event's `/events/:id/run` page. Confirm a stepper appears below the heading with the correct number of round indicators and the correct active step.

### Tests for User Story 2

- [X] T009 [P] [US2] Create `frontend/tests/run-event-round-stepper.test.tsx` — unit tests for `getRoundStepperProps` covering: `(4,1)→currentStep=0`, `(4,3)→currentStep=2`, `(1,1)→{steps:[{label:"1"}],currentStep:0}`, `(0,1)→null`, `(-1,1)→null`, `(4,0)→currentStep=0` (clamp)

### Implementation for User Story 2

- [X] T010 [US2] Edit `frontend/src/pages/RunEvent.tsx` — add exported pure function `getRoundStepperProps(totalRounds, roundNumber)` returning `{ steps, currentStep } | null` per data-model.md spec
- [X] T011 [US2] Edit `frontend/src/pages/RunEvent.tsx` — import `Stepper` from `"../components/stepper/Stepper"` and add `const roundStepperProps = eventData && roundData ? getRoundStepperProps(eventData.totalRounds, roundData.roundNumber) : null` inside `RunEventPage`
- [X] T012 [US2] Edit `frontend/src/pages/RunEvent.tsx` — add `{roundStepperProps && <Stepper steps={roundStepperProps.steps} currentStep={roundStepperProps.currentStep} direction={1}><></></Stepper>}` immediately after the `<h1>` heading in JSX (no `onStepClick` — read-only)
- [X] T013 [US2] Run `cd frontend && npm test` — confirm new tests pass and all existing tests still pass

**Checkpoint**: User Stories 1 AND 2 fully functional. All tests green.

---

## Phase 5: User Story 3 — Home page cleanup + View Events page (Priority: P3)

**Goal**: Remove the event-slots panel from Home.tsx. Create a new `EventSlots.tsx` page at `/events` containing all the moved state/effects/JSX. All helper function exports remain in `Home.tsx` unchanged (test constraint).

**Independent Test**: Open home page — only bento menu visible, no event list. Click "View Events" — navigate to `/events` showing all event slots with filter tabs and sort controls working correctly.

### Implementation for User Story 3

- [X] T014 [US3] Create `frontend/src/pages/EventSlots.tsx` — default export `EventSlotsPage` with `<section className="page-shell">`, page header (title "Events", Main Menu button), and the complete event-slots panel (state, effects, filter tabs, sort controls, mode blobs, event list) moved from `Home.tsx`; import helper functions from `"./Home"`
- [X] T015 [US3] Edit `frontend/src/pages/Home.tsx` — remove all event-slot `useState` hooks (`events`, `filter`, `sortOption`, `modeFilters`, `collapsedModes`), all `useEffect` hooks that call `listEvents()` or read/write event-slot `localStorage` keys, and the entire event-slots JSX panel; keep all exported helper functions (`matchesEventFilter`, `applyEventSlotView`, `getEventFilterEmptyState`, `getEventSlotDisplay`, `getEventSlotStatusColumnClass`, `getLifecycleStatusLabel`, type aliases); `HomePage` default export renders only `<MagicBentoMenu />`
- [X] T016 [US3] Edit `frontend/src/app/routes.tsx` — replace the `EventSlotsPage` import stub (from T003) with the real import from `"../pages/EventSlots"`
- [X] T017 [US3] Run `cd frontend && npm test` — confirm `home-event-slots-status-layout.test.tsx` still passes (imports helpers from `Home.tsx`), all other existing tests pass, and TypeScript compiles with zero errors

**Checkpoint**: User Stories 1, 2 AND 3 fully functional. All tests green.

---

## Phase 6: User Story 4 — Register Player page (Priority: P4)

**Goal**: Create a `/players/register` page allowing a host to enter a player display name, validate it (non-empty, non-duplicate), save it via `createPlayer()`, and see success/error feedback.

**Independent Test**: Open `/players/register`. Enter a valid new name and submit — confirm "Player '[name]' registered." message appears. Submit empty name — confirm "Player name cannot be empty." error. Submit a duplicate name — confirm duplicate error.

### Tests for User Story 4

- [X] T018 [P] [US4] Create `frontend/tests/register-player-page.test.tsx` — unit tests for `getRegisterPlayerError` covering: empty string → error, whitespace-only → error, duplicate name (case-insensitive) → duplicate error, unique name → `""`, unique name with empty catalog → `""`

### Implementation for User Story 4

- [X] T019 [US4] Create `frontend/src/pages/RegisterPlayer.tsx` — default export `RegisterPlayerPage` with: exported helper `getRegisterPlayerError(name, catalog)` (using `findDuplicateByName`); local state `name`, `catalog`, `submitError`, `successName`, `isSubmitting`; mount effect calling `searchPlayers("")` to populate `catalog`; submit handler calling `getRegisterPlayerError` → `createPlayer`; page layout with header (title "Register Player", subtitle "Add a new player to the roster"), `form-grid` panel with `input`, error/success messages, action row containing Main Menu + Register Player buttons; all interactive buttons use `withInteractiveSurface()`
- [X] T020 [US4] Edit `frontend/src/app/routes.tsx` — replace the `RegisterPlayerPage` import stub (from T003) with the real import from `"../pages/RegisterPlayer"`
- [X] T021 [US4] Run `cd frontend && npm test` — confirm new tests pass and all 158+ existing tests still pass; confirm TypeScript compiles with zero errors (`cd frontend && npx tsc --noEmit`)

**Checkpoint**: All four user stories fully functional. All tests green.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification pass across all changes.

- [X] T022 [P] Verify CSS compliance — confirm no hardcoded hex colour values were introduced; all new CSS uses `var(--color-*)` tokens and existing class names (`.panel`, `.button`, `.button-secondary`, `.input`, `.warning-text`, `.action-row`, `.page-shell`, `.page-header`, `.page-title`, `.page-subtitle`)
- [X] T023 [P] Verify all new interactive buttons use `withInteractiveSurface()` — audit `CreateEvent.tsx`, `RunEvent.tsx`, `EventSlots.tsx`, `RegisterPlayer.tsx`
- [X] T024 Run full test suite and TypeScript check: `cd frontend && npm test && npx tsc --noEmit`
- [ ] T025 Manual smoke test — open browser, verify: (a) Create Event has no header Main Menu, each step has Main Menu in action row; (b) Run Event shows round stepper below heading; (c) Home shows only bento menu; (d) "View Events" card navigates to `/events` with full filter/sort UI; (e) "Register Player" card navigates to `/players/register` with working form

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — updates shared bento + routes
- **Phase 3 (US1)**: Depends on Phase 2 — can start immediately after
- **Phase 4 (US2)**: Depends on Phase 2 — independent of US1; can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 (route stub added); references `Home.tsx` helpers — can run in parallel with US1/US2
- **Phase 6 (US4)**: Depends on Phase 2 (route stub added) — can run in parallel with US1/US2/US3
- **Phase 7 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Only touches `CreateEvent.tsx` — fully independent
- **US2 (P2)**: Only touches `RunEvent.tsx` — fully independent
- **US3 (P3)**: Touches `Home.tsx`, creates `EventSlots.tsx`, updates route — independent; exports from `Home.tsx` must be preserved
- **US4 (P4)**: Creates `RegisterPlayer.tsx`, updates route — fully independent

### Parallel Opportunities

All four user stories touch different files and can be implemented in parallel after Phase 2:
- US1: `CreateEvent.tsx` only
- US2: `RunEvent.tsx` only + new test file
- US3: `Home.tsx` + new `EventSlots.tsx` + route update
- US4: new `RegisterPlayer.tsx` + new test file + route update

---

## Parallel Example: User Story 2 + User Story 4 (simultaneously)

```
# After Phase 2 completes, launch both in parallel:

Task A (US2): Write run-event-round-stepper.test.tsx (T009)
Task B (US4): Write register-player-page.test.tsx (T018)

# Then implement in parallel:
Task A (US2): Add getRoundStepperProps to RunEvent.tsx (T010)
Task B (US4): Create RegisterPlayer.tsx with getRegisterPlayerError (T019)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline check
2. Complete Phase 2: Bento + route stubs
3. Complete Phase 3: US1 (Main Menu relocation)
4. **STOP and VALIDATE**: Main Menu is in the action rows on all 3 steps, absent from header
5. Continue with remaining stories

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (bento labels updated, routes registered)
2. Phase 3 (US1) → Create Event Main Menu relocated ✅
3. Phase 4 (US2) → Run Event round stepper added ✅
4. Phase 5 (US3) → Home cleaned up, View Events page live ✅
5. Phase 6 (US4) → Register Player page live ✅
6. Phase 7 → Polish + final verification ✅

---

## Notes

- `home-event-slots-status-layout.test.tsx` imports 5 helpers directly from `"../src/pages/Home"` — those exports MUST remain in `Home.tsx` even after the event-slots JSX is moved to `EventSlots.tsx`
- `magic-bento-menu-interactions.test.tsx` tests `getMenuCardClassName()` only — card title/route changes do not affect it
- No new npm packages: `Stepper`, `createPlayer`, `searchPlayers`, `findDuplicateByName`, `withInteractiveSurface` all already installed
- TypeScript strict: no `any` for new code
