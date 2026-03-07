# Tasks: Create Event Flow Fixes & UX Improvements (025)

**Input**: Design documents from `/specs/025-create-event-flow-fixes/`  
**Branch**: `025-create-event-flow-fixes`  
**Prerequisites**: plan.md ✅ spec.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.  
**Tests**: Included for the backend bug fix (BUG-1). All other stories are frontend-only or data-only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US7)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: DB migration and toast component scaffolding that other work depends on or benefits from up-front.

- [ ] T001 Write migration `backend/app/db/migrations/010_fix_corrupt_event_status.sql` — `UPDATE events SET status = 'Running' WHERE status = 'Lobby' AND id IN (SELECT DISTINCT event_id FROM rounds)`
- [ ] T002 [P] Create directory `frontend/src/components/toast/` and write `Toast.css` — fixed bottom-right positioning, `z-index: 9999`, slide-in animation, success=green, error=red, info=neutral/grey, vertical stacking for multiple toasts, auto-dismiss handled by CSS `opacity` transition triggered by a `.toast--exiting` class
- [ ] T003 [P] Create `frontend/src/components/toast/ToastProvider.tsx` — React context with `ToastContext`, `useToast()` hook, `ToastProvider` component; manages a `Toast[]` queue in state; exposes `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`; each toast auto-removes after 4000ms via `setTimeout`; renders a `<div className="toast-container">` with `<div className="toast toast--{type}">` elements

**Checkpoint**: Migration file exists. Toast files exist. Tests can now reference the toast context.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire `ToastProvider` into `AppShell` before any component tries to call `useToast()`.

- [ ] T004 [US7] Wrap the content of `frontend/src/app/AppShell.tsx` with `<ToastProvider>` — import `ToastProvider` from `../components/toast/ToastProvider` and wrap the existing JSX so toasts are available on every page

**Checkpoint**: `useToast()` can be called from any component in the app without "no context" runtime errors.

---

## Phase 3: User Story 1 — Starting a Ready Event Never Throws "Already Started" (Priority: P1) 🎯 MVP

**Goal**: All four corrupt events start cleanly; any future corrupt entries are handled gracefully.

**Independent Test**: Run the migration → call `POST /api/v1/events/{corrupt_id}/start` for each of the four corrupt events → expect `200 OK` with `{ event_id, round_number, matches }`.

### Test for User Story 1 ⚠️ Write test FIRST — verify it FAILS before implementing

- [ ] T005 [US1] Write `backend/tests/integration/test_start_event_corrupt_state.py` — create an event with `status='Lobby'`, manually insert a row in `rounds` for that event, call `start_event(event_id)`, assert the result contains `event_id` and `round_number` with no exception raised; also assert event status in DB is now `'Running'`

### Implementation for User Story 1

- [ ] T006 [US1] In `backend/app/services/event_service.py` `start_event()` — between the `if lifecycle_status == "planned":` block (line ~283) and the `if current_round:` guard (line ~289), insert a recovery branch: if `lifecycle_status == "ready"` and `current_round` is not None, call `self.events_repo.update_status(event_id, "Running")` and return `{ "event_id": event_id, "round_number": current_round.round_number, "matches": self.matches_repo.list_by_round(current_round.id) }` — this makes the defensive check at line 289 unreachable for corrupt-state events
- [ ] T007 [US1] In `frontend/src/pages/CreateEvent.tsx` `handleStartEvent()` — before calling `startEvent(idToStart)`, call `await getEvent(idToStart)` (or use the already-loaded `savedEventId` + a lightweight status check); if the fetched event's `lifecycleStatus === "ongoing"`, skip `startEvent()` and directly call `window.open('/events/${idToStart}/run', '_blank')` with the existing `navigate()` fallback pattern

**Checkpoint**: All four corrupt events can be started or resumed with zero errors. New integration test passes. ✅

---

## Phase 4: User Story 2 — Assign Teams Step Shows Player Display Names (Priority: P1)

**Goal**: No raw UUIDs ever appear in the Assign Teams step; stale localStorage entries are silently stripped.

**Independent Test**: Open browser DevTools → set a localStorage draft entry with `{ id: "test-uuid", displayName: "" }` → reload the stepper → confirm the stale entry is gone and no UUID appears in any player list.

- [ ] T008 [US2] In `frontend/src/pages/CreateEvent.tsx` — add a `useEffect` that runs once on mount (after `loadDraftPlayers()` initialises `assignedPlayers`): filter `assignedPlayers` to keep only entries where `p.displayName && p.displayName.trim().length > 0`; if any entries were removed, call `saveDraftPlayers(filteredPlayers)` and `setAssignedPlayers(filteredPlayers)`
- [ ] T009 [US2] In `frontend/src/pages/CreateEvent.tsx` — in the edit-mode `useEffect` that loads an existing event's player list (the block starting with `if (!isEditMode) return` at line ~93): after resolving each player from the catalog, ensure `displayName` is always taken from the catalog response (`player.displayName`) and never from the raw localStorage entry; if a catalog lookup fails for a given `id`, skip that entry (do not add a UUID-only object)

**Checkpoint**: Assign Teams step always shows human-readable names. UUID entries in stale drafts are silently removed. ✅

---

## Phase 5: User Story 3 — Team Mexicano Auto-Suffix in Event Name (Priority: P2)

**Goal**: Toggling Team Mexicano on/off auto-appends/removes ` (Teams)` from the event name — unless the user has manually edited the name.

**Independent Test**: Set name to "Saturday Mexicano - 20:00" → enable Team Mexicano toggle → name becomes "Saturday Mexicano - 20:00 (Teams)" → disable → name reverts → type anything in name field → toggle on/off → name unchanged.

- [ ] T010 [US3] In `frontend/src/pages/CreateEvent.tsx` — add `const manuallyEditedName = useRef<boolean>(false)` near the other state declarations (NOT `useState`)
- [ ] T011 [US3] In `frontend/src/pages/CreateEvent.tsx` — find the event name `<input>` element and add/update its `onChange` handler to set `manuallyEditedName.current = true` before updating the `eventName` state; this fires on every keystroke
- [ ] T012 [US3] In `frontend/src/pages/CreateEvent.tsx` — add a new `useEffect` watching `[isTeamMexicano, eventType]`: if `manuallyEditedName.current === true`, return early; if `eventType !== "Mexicano"`, return early; if `isTeamMexicano === true` and `eventName.includes("Mexicano")` and `!eventName.endsWith(" (Teams)")`, call `setEventName(prev => prev + " (Teams)")`; if `isTeamMexicano === false` and `eventName.endsWith(" (Teams)")`, call `setEventName(prev => prev.slice(0, -7))`

**Checkpoint**: Auto-suffix fires correctly when toggling Team Mexicano; manual edits permanently disable it for that session. ✅

---

## Phase 6: User Story 4 — Auto-Name Updates in Edit Mode (Priority: P2)

**Goal**: Changing date/time/mode on a planned or ready event auto-updates the event name, same as for new events.

**Independent Test**: Edit a planned event → change time from 20:00 to 21:00 → confirm name updates → manually type a name → change time → confirm name is not touched.

- [ ] T013 [US4] In `frontend/src/pages/CreateEvent.tsx` — locate the `useEffect` that watches `[eventDate, eventType, eventTime24h, isEditMode]` and contains `if (isEditMode) return` at line ~132; replace this guard with two guards: `if (manuallyEditedName.current === true) return` and `if (lifecycleStatus === "ongoing" || lifecycleStatus === "finished") return`; remove the `isEditMode` dependency from the effect's dependency array (or leave it in but it is now irrelevant since the guard is removed)

> **Note**: This task depends on T010 (`manuallyEditedName` ref). Also requires `lifecycleStatus` to be in scope — it is loaded via the edit-mode `useEffect` already; ensure it is available as a state variable or derived value.

**Checkpoint**: Event name auto-updates on time/mode changes in edit mode; manual edits and ongoing/finished events are protected. ✅

---

## Phase 7: User Story 5 — "Create Event Slot" Button on Setup Step (Priority: P2)

**Goal**: One-click save-and-exit from the Setup step without advancing to Roster.

**Independent Test**: Fill out the Setup step → click "Create Event Slot" → confirm `POST /api/v1/events` (or `PUT`) is called → land on main menu → confirm "Event slot created" toast appears → confirm the event appears in the event list.

- [ ] T014 [US5] In `frontend/src/pages/CreateEvent.tsx` — add `const [slotSaving, setSlotSaving] = useState(false)` for the in-flight state and `const [slotError, setSlotError] = useState("")` for the error message
- [ ] T015 [US5] In `frontend/src/pages/CreateEvent.tsx` — implement `handleCreateEventSlot()`: set `slotSaving(true)` and `slotError("")`; run the identical save logic as the Setup step "Next" handler (call `createEvent` or `updateEvent` based on `isEditMode || savedEventId`); on success, call `toast.success("Event slot created")` then `navigate("/")`; on error, call `setSlotError(errorMessage)` and `setSlotSaving(false)`; use `useToast()` from the toast context
- [ ] T016 [US5] In `frontend/src/pages/CreateEvent.tsx` — in the Step 1 (Setup) render section, add the "Create Event Slot" button between the primary "Next" button and the `<hr className="stepper-divider" />` separator: `<button className="btn btn--secondary" onClick={handleCreateEventSlot} disabled={slotSaving || step1Saving}>Create Event Slot</button>`; render `{slotError && <p className="error-message">{slotError}</p>}` below the button

**Checkpoint**: "Create Event Slot" saves the event and navigates to main menu with a toast. Error is shown inline on failure. ✅

---

## Phase 8: User Story 6 — Step Navigation Guardrails (Priority: P2)

**Goal**: Back navigation always works before event starts; ongoing/finished events show read-only mode in the stepper.

**Independent Test**: Fill all steps → click Previous → confirm state preserved → start an event → navigate to `/create-event?edit={id}` → confirm read-only summary shown.

- [ ] T017 [US6] In `frontend/src/pages/CreateEvent.tsx` — verify "Previous" buttons exist on Steps 2, 3, and 4 and that clicking them decrements `currentStep`; if any step is missing a "Previous" button, add one; ensure `currentStep` state drives step visibility so back-navigation just sets state (no form reset)
- [ ] T018 [US6] In `frontend/src/pages/CreateEvent.tsx` — add a read-only summary view: at the top of the component's return, before the stepper renders, check if `lifecycleStatus === "ongoing" || lifecycleStatus === "finished"` (after the edit-mode fetch completes); if true, render a `<div className="event-readonly-summary">` block showing event name, date, mode, and player count; include an "Open Running Event" button (`window.open('/events/${savedEventId}/run', '_blank')`) when ongoing, or a "View Summary" button (`navigate('/events/${savedEventId}/summary')`) when finished; return early so no editable fields are rendered

**Checkpoint**: Back navigation preserves state. Ongoing/finished events show read-only mode with correct action buttons. ✅

---

## Phase 9: User Story 7 — Global Toast Triggers (Priority: P2)

**Goal**: All four key actions fire the correct toast notifications using the already-wired `ToastProvider`.

**Independent Test**: Trigger each of the four toast events and confirm the correct message appears in the bottom-right within 1 second and disappears after 4 seconds.

> **Note**: `ToastProvider` is already wired (T003–T004). This phase only adds `useToast()` call sites.

- [ ] T019 [P] [US7] In `frontend/src/components/players/PlayerSelector.tsx` — after a successful player creation API call, call `toast.success(`Player ${newPlayer.displayName} added`)` using `useToast()`
- [ ] T020 [P] [US7] In `frontend/src/pages/CreateEvent.tsx` — after `startEvent()` succeeds in `handleStartEvent()`, call `toast.success("Event started")` using `useToast()` (already in scope from T015 wiring)
- [ ] T021 [P] [US7] In `frontend/src/pages/CreateEvent.tsx` — after the Roster step save succeeds and `lifecycleStatus === "ready"`, call `toast.success("Event is ready to start")` using `useToast()`

> **Note**: The "Event slot created" toast (T015) is already included in the Phase 7 `handleCreateEventSlot()` implementation — no separate task needed.

**Checkpoint**: All four toast triggers fire the correct messages. Auto-dismiss after 4 seconds. ✅

---

## Phase 10: Polish & Final Validation

**Purpose**: Test suite verification and any leftover wiring.

- [ ] T022 Run `PYTHONPATH=. uv run python -m pytest tests/ -v` and fix any backend failures
- [ ] T023 [P] Run `npm test && npm run lint` and fix any frontend failures
- [ ] T024 [P] Verify the DB migration is applied in the migration runner (check `backend/app/db/migrations/meta/` or the migration bootstrap code to ensure `010_fix_corrupt_event_status.sql` is picked up automatically)
- [ ] T025 [P] Smoke-test manually: start the backend + frontend → open the stepper for each of the four corrupt event IDs → confirm each either opens the running view or starts cleanly → verify no UUID appears in any Team Mexicano Assign Teams step

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (ToastProvider wiring)**: Depends on T003 (ToastProvider.tsx exists) — **BLOCKS any component calling `useToast()`**
- **Phase 3 (US1 BUG-1)**: T005 (test) can start immediately. T006 and T007 can start independently of Phase 2
- **Phase 4 (US2 BUG-2)**: T008 and T009 can start independently — no Phase 2 dependency
- **Phase 5 (US3 auto-suffix)**: T010 must precede T011 and T012 (ref must exist before use)
- **Phase 6 (US4 edit-mode auto-name)**: Depends on T010 (`manuallyEditedName` ref from Phase 5)
- **Phase 7 (US5 slot button)**: Depends on Phase 2 (calls `useToast()`)
- **Phase 8 (US6 guardrails)**: No Phase 2 dependency — no toast calls in this story
- **Phase 9 (US7 toast triggers)**: Depends on Phase 2 (calls `useToast()`); T019 and T020/T021 are parallel
- **Phase 10 (Polish)**: Depends on all preceding phases

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (BUG-1 start event) | T001 (migration) | Test written first; code fix is independent |
| US2 (BUG-2 UUIDs) | None | Pure frontend, no toast required |
| US3 (auto-suffix) | T010 (`manuallyEditedName` ref) | Ref created before useEffect |
| US4 (edit-mode auto-name) | T010 (US3 Phase 5) | Reuses same ref |
| US5 (slot button) | Phase 2 (ToastProvider wired) | Calls `toast.success()` |
| US6 (guardrails) | None | No toast, no new deps |
| US7 (toast triggers) | Phase 2 (ToastProvider wired) | All three call sites parallel |

### Within Each User Story

- Backend: migration → service fix → integration test verify
- Frontend: ref/state declarations → handlers → JSX render
- Toast call sites: ToastProvider wired → component calls `useToast()`

### Parallel Opportunities

- T001 (migration), T002 (Toast.css), T003 (ToastProvider.tsx) — fully parallel in Phase 1
- T005 (BUG-1 test), T008 (BUG-2 fix), T017 (guardrails) — parallel; different files
- T019, T020, T021 (toast call sites) — parallel; touch different locations
- T022, T023, T024, T025 (Phase 10 validation) — parallel

---

## Implementation Strategy

### MVP First (P1 Stories Only — US1 + US2)

1. Complete Phase 1 (migration + Toast files exist but not yet used)
2. Complete Phase 3 (US1 BUG-1 fix) — backend + one frontend guard
3. Complete Phase 4 (US2 BUG-2 fix) — frontend `useEffect` only
4. **STOP and VALIDATE**: Start one of the corrupt events; confirm no UUID in Assign Teams step
5. These two P1 fixes ship independently of all UX features

### Incremental Delivery Order

1. **P1 fixes** (US1 + US2): Backend migration + minimal frontend — shippable immediately
2. **ToastProvider** (Phase 1–2): Zero risk, additive — enables all subsequent toast calls
3. **US3** (auto-suffix): One `useEffect` + one `useRef` addition
4. **US4** (edit-mode auto-name): One guard removal in existing `useEffect`
5. **US5** (slot button): One new button + handler
6. **US6** (guardrails): Read-only summary branch in `CreateEvent.tsx`
7. **US7** (toast triggers): Three call-site additions; all parallel

### Risk Assessment

| Story | Risk | Notes |
|-------|------|-------|
| US1 (BUG-1) | Low | Defensive recovery path; migration is additive |
| US2 (BUG-2) | Low | Filter in `useEffect`; no API changes |
| US3 (auto-suffix) | Low | Additive `useEffect` + `useRef` |
| US4 (edit-mode auto-name) | Low | Removes one guard; uses same ref as US3 |
| US5 (slot button) | Low | Reuses existing save logic |
| US6 (guardrails) | Medium | Read-only branch must not affect create/edit flows |
| US7 (toast triggers) | Low | Additive call sites only |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- `manuallyEditedName` ref is shared by US3 (T010–T012) and US4 (T013) — implement Phase 5 (US3) before Phase 6 (US4)
- `CreateEvent.tsx` is touched by US2, US3, US4, US5, US6, US7 — sequence these phases; do not edit in parallel
- Pre-existing LSP errors in `users_repo.py` and `round_service.py` are not introduced by this feature — do not fix
- Run `npm test && npm run lint` after each phase as a checkpoint before moving on
- The "Event slot created" toast is implemented inside `handleCreateEventSlot()` in T015 — it is not a separate Phase 9 task
