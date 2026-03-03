# Tasks: 3-Step Create Event Stepper

**Input**: Design documents from `/specs/017-create-event-stepper/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in the spec — test tasks are included selectively for
the core navigation logic and regression protection of the refactored `CreateEvent.tsx`.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the new dependency and scaffold the new file locations before any feature code is written.

- [X] T001 Install `motion` package — run `npm install motion` in `frontend/` and verify it appears under `dependencies` in `frontend/package.json`
- [X] T002 [P] Create empty file `frontend/src/components/stepper/Stepper.tsx` (placeholder for the Stepper component — ensures the directory exists for parallel work)
- [X] T003 [P] Create empty file `frontend/src/components/stepper/stepper.css` (placeholder for Stepper styles)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Deliver the standalone `Stepper` component and its styles — this is a hard dependency for all three user story phases because every step of the feature renders inside it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Implement the `Stepper` component shell in `frontend/src/components/stepper/Stepper.tsx` — accept props `steps: StepDefinition[]`, `currentStep: number`, `direction: number`, `onStepClick?: (i: number) => void`, `children: React.ReactNode`; render step indicator bar (circles + labels in three states: inactive/active/complete) and a `div.stepper-content` wrapper for `children`; use `motion.div` + `AnimatePresence mode="wait"` with directional slide variants (enter from right on direction>0, from left on direction<0); export `StepperProps` and `StepDefinition` types
- [X] T005 Write CSS for the Stepper component in `frontend/src/components/stepper/stepper.css` — classes: `.stepper`, `.stepper-header`, `.stepper-steps`, `.stepper-step`, `.stepper-connector`, `.stepper-circle` (+ `[data-state]` variants using `var(--color-accent)` / `var(--color-accent-strong)` / `var(--color-ink-muted)`), `.stepper-label` (+ `[data-state]` variants), `.stepper-content`, `.stepper-panel`; active gradient must match `.button` gradient from `components.css` (`linear-gradient(120deg, var(--color-accent), #2d5fba)`)
- [X] T006 Add accessibility attributes to the Stepper component in `frontend/src/components/stepper/Stepper.tsx` — indicator bar has `role="list"`; each step item has `role="listitem"`; completed step buttons have `aria-label="Step N: Label – complete"`; inactive/active steps are non-interactive `<span>`; animated content region has `aria-live="polite"`
- [X] T007 Write unit tests for the standalone Stepper component in `frontend/tests/stepper-component.test.tsx` — verify: three step labels render, `data-state` attributes are correct for each step index relative to `currentStep`, completed step indicator button is clickable and calls `onStepClick`, future step indicator is not a button, `children` renders inside `.stepper-content`
- [X] T008 Run `npm test -- stepper-component` in `frontend/` and confirm all Stepper unit tests pass

**Checkpoint**: Standalone Stepper component is complete, styled, accessible, and tested. All user story phases can now begin.

---

## Phase 3: User Story 1 — First-time user creates a new event end-to-end (Priority: P1) 🎯 MVP

**Goal**: Replace the single-page `CreateEvent.tsx` layout with the 3-step stepper. A user starting fresh can complete Setup → Roster → Confirm and start an event without leaving the page.

**Independent Test**: Open `/events/create` as a new event. Fill in mode/date/name, press Next — confirm the API creates a slot and the stepper advances to Step 2. Add courts + players, press Next — confirm roster is saved. On Step 3, press "Start Event" — confirm navigation to the run-event page.

### Implementation for User Story 1

- [X] T009 [US1] Add stepper navigation state to `frontend/src/pages/CreateEvent.tsx` — add `currentStep: 0|1|2`, `direction: 1|-1`, `savedEventId: string`, `step1Error: string`, `step2Error: string` as `useState` values; add helper `getStartStep(lifecycleStatus)` returning `0|1|2`; keep all existing form field state (`eventName`, `eventDate`, `eventTime24h`, `eventType`, `courts`, `assignedPlayers`, `expectedVersion`, `events`)
- [X] T010 [US1] Implement `handleNext()` in `frontend/src/pages/CreateEvent.tsx` — Step 0: call `createEvent` with `createAction: "create_event_slot"` (new) or `updateEvent` (edit), set `savedEventId`/`expectedVersion` on success, set `step1Error` on failure; Step 1: call `updateEvent(savedEventId, { courts, playerIds })`, set `expectedVersion` on success, set `step2Error` on failure; increment `currentStep` and set `direction = 1` on success
- [X] T011 [US1] Implement `handlePrevious()` and `handleStepClick(index)` in `frontend/src/pages/CreateEvent.tsx` — Previous sets `direction = -1` and decrements `currentStep`; `handleStepClick` sets `direction = -1` and jumps to the clicked step index
- [X] T012 [US1] Render Step 0 (Setup) content inside `CreateEvent.tsx` — `ModeAccordion`, date/time inputs, event name input, "Today's date" button, past-schedule warning, duplicate warning, auto-name logic (unchanged from current page); Next button disabled via `isCreateEventDisabled`; inline `step1Error` display; all existing validation helpers reused
- [X] T013 [US1] Render Step 1 (Roster) content inside `CreateEvent.tsx` — `CourtSelector`, `PlayerSelector`, player count progress display (`assignedPlayers.length / getRequiredPlayerCount(courts)`), required count hint; Next button always enabled; Previous button; inline `step2Error` display; `saveDraftPlayers` side-effect on `assignedPlayers` change (unchanged)
- [X] T014 [US1] Render Step 2 (Confirm) content inside `CreateEvent.tsx` — read-only summary rows for event name/mode/date/time/courts/players using `.summary-row` CSS pattern; "Start Event" button disabled via `isStrictCreateEventDisabled`; disabled hint text showing missing requirements; Previous button; on "Start Event" success: `clearDraftPlayers()` + navigate to `/events/:savedEventId/run`
- [X] T015 [US1] Replace the current JSX return in `CreateEvent.tsx` with the new stepper layout — `<section className="page-shell">` header with page title and "Main Menu" button; `<Stepper steps={...} currentStep={currentStep} direction={direction} onStepClick={handleStepClick}>` wrapping the active step panel; remove the two-column grid (`grid-columns-2 create-event-grid`) and the old dual-button row
- [X] T016 [US1] Update the six affected test files for the refactored `CreateEvent.tsx` — update `frontend/tests/create-event-page.test.tsx`, `frontend/tests/create-event-dual-actions.test.tsx`, `frontend/tests/create-event-planned-slots.test.tsx`, `frontend/tests/create-event-datetime.test.tsx`, `frontend/tests/create-event-draft-persistence.test.tsx`, `frontend/tests/planned-event-setup-flow.test.tsx` to reflect the stepper UI (Next button instead of "Create Event", step-by-step flow, no dual-button row)
- [X] T017 [US1] Write new test `frontend/tests/create-event-stepper-step1.test.tsx` — verify: Step 0 renders with three step labels; Next is disabled when name/date empty; Next enables after valid input; pressing Next calls `createEvent` with `create_event_slot`; API error shows `step1Error`; stepper advances to Step 1 on success
- [X] T018 [US1] Write new test `frontend/tests/create-event-stepper-step2.test.tsx` — verify: Step 1 renders courts and player selector; player count display updates as courts change; pressing Next calls `updateEvent` with courts + playerIds; API error shows `step2Error`; Previous navigates back to Step 0 with form values preserved; stepper advances to Step 2 on Next success
- [X] T019 [US1] Write new test `frontend/tests/create-event-stepper-step3.test.tsx` — verify: Step 2 renders all summary fields; "Start Event" disabled when playerIds length does not meet requirement; "Start Event" enabled when requirements met; pressing "Start Event" calls `startEvent` and navigates to `/events/:id/run`; Previous navigates back to Step 1
- [X] T020 [US1] Run full frontend test suite — `npm test` in `frontend/` — confirm all tests pass (target: existing 103 + new tests)
- [X] T021 [US1] Run TypeScript check — `npm run lint` in `frontend/` — confirm zero errors

**Checkpoint**: User Story 1 is fully functional. A new user can create an event end-to-end via the stepper. All tests pass.

---

## Phase 4: User Story 2 — User resumes an existing planned event slot through the stepper (Priority: P2)

**Goal**: When a user opens an existing planned slot (mode/date/name set, no courts/players) via "Edit Event", the stepper opens at Step 2 with Step 1 shown as complete.

**Independent Test**: Create an event slot (Step 1 only), navigate to PreviewEvent, press "Edit Event". Verify the stepper URL is `/events/create?editEventId=<id>`, stepper shows Step 2 as active, Step 1 as complete, and the slot's name/mode/date are preserved in Step 0's form fields (accessible via Previous).

### Implementation for User Story 2

- [X] T022 [US2] Add edit-mount logic to `frontend/src/pages/CreateEvent.tsx` — in the `useEffect` that loads `editEventId`: after fetching the event, if `lifecycleStatus` is `"ongoing"` or `"finished"` redirect to `/events/:editEventId/preview`; otherwise set `savedEventId = editEventId`, `expectedVersion = event.version`, and `currentStep = getStartStep(event.lifecycleStatus)` — this replaces the current edit-load effect
- [X] T023 [US2] Write new test `frontend/tests/create-event-stepper-resume.test.tsx` — verify: loading with `?editEventId=` and a `"planned"` event opens at `currentStep=1` (Step 2 active, Step 1 complete indicator); loading with a `"ready"` event opens at `currentStep=2` (Steps 1 and 2 complete); loading with `"ongoing"` or `"finished"` triggers redirect to preview; Previous from Step 1 restores Step 0 with pre-filled name/date/mode
- [X] T024 [US2] Update `frontend/tests/preview-edit-event-flow.test.tsx` — verify "Edit Event" navigation still produces `?editEventId=` URL; verify pre-fill behaviour in the edit flow is preserved after refactor
- [X] T025 [US2] Run full frontend test suite — `npm test` in `frontend/` — confirm all tests pass

**Checkpoint**: Resume flow works. A user returning to a planned slot starts at Step 2; a ready event starts at Step 3. Previous navigation restores pre-filled values.

---

## Phase 5: User Story 3 — User navigates back to Step 1 and changes event mode (Priority: P3)

**Goal**: Back-navigation from Step 2 to Step 1 preserves all form values; changing mode on Step 1 and pressing Next updates the roster step's required-player-count display correctly.

**Independent Test**: Reach Step 2 (Roster) with WinnersCourt selected. Press Previous — confirm Step 1 shows the previously-entered values (mode, date, name intact). Change mode to Mexicano. Press Next again — confirm Step 2 still shows the required count as `courts.length × 4` and the mode label updated.

### Implementation for User Story 3

- [X] T026 [US3] Verify that back-navigation preserves form state in `frontend/src/pages/CreateEvent.tsx` — `handlePrevious()` must not reset any `useState` values; the Step 0 panel reads directly from component state, so no additional work is needed if T011 is correct; add a code comment documenting this guarantee
- [X] T027 [US3] Verify mode-change → Step 1 re-render in `frontend/src/pages/CreateEvent.tsx` — Step 1 (Roster) panel derives `getRequiredPlayerCount(courts)` and the mode label from current state on every render; because both are derived values (not memoized incorrectly), no additional work is needed if T013 is correct; add a code comment documenting this guarantee
- [X] T028 [US3] Write new test `frontend/tests/create-event-stepper-back-nav.test.tsx` — verify: from Step 1, pressing Previous returns to Step 0 with `eventName`, `eventDate`, `eventType` state values unchanged; after changing `eventType` on Step 0 and pressing Next, Step 1 displays the updated mode label in the player-count hint; required player count still reads `courts.length × 4` (mode does not affect formula)
- [X] T029 [US3] Run full frontend test suite — `npm test` in `frontend/` — confirm all tests pass

**Checkpoint**: All three user stories are independently functional and tested. Bidirectional navigation works correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, reduced-motion verification, TypeScript final check, and cleanup of any obsolete code paths.

- [X] T030 Remove the now-dead `submitCreateEvent`, `submitCreateEventSlot`, `submitEditSave`, `getPrimarySaveLabel` exports and the `slotDisabled`/`strictCreateDisabled` local variables from `frontend/src/pages/CreateEvent.tsx` — replace with the equivalent inline logic in `handleNext()` and the step panels (these were only used by the old single-page layout)
- [X] T031 [P] Verify `prefers-reduced-motion` suppresses slide animation — manually in browser (DevTools → Rendering → emulate `prefers-reduced-motion: reduce`) and confirm step transition is instant; no code change required if `motion.css` already handles it, but document in a code comment in `stepper.css`
- [X] T032 [P] Accessibility review of the full stepper flow — ensure `aria-label` on completed step buttons follows the contract (`"Step N: Label – complete"`); ensure the `aria-live="polite"` region on step content fires on step change; ensure "Main Menu" button is reachable via keyboard from every step; fix any gaps found
- [X] T033 Run final TypeScript check — `npm run lint` in `frontend/` — confirm zero type errors across all new and modified files
- [X] T034 Run full frontend test suite one final time — `npm test` in `frontend/` — confirm all tests pass; record final test count

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must complete before T004 so `motion` is installed) — BLOCKS all user story phases
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion — can start once Stepper component is ready
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion — the edit-mount logic builds on the stepper scaffolded in US1
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion — back-nav builds on the stepper flow from US1; can start in parallel with US2 if staffed
- **Polish (Phase 6)**: Depends on all story phases completing

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P2)**: After US1 — resume logic requires the stepper to exist and the edit-mount `useEffect` from US1
- **US3 (P3)**: After US1 — back-nav and mode-change verification builds on US1's `handlePrevious()` and Step 1 Roster panel

### Within Each User Story

- Stepper component (Phase 2) must be wired before step content is added
- Navigation state (`handleNext`, `handlePrevious`) must be implemented before step panels are rendered
- Step panels must be implemented before the test files for that story can be written
- Tests updated/written before final `npm test` checkpoint

### Parallel Opportunities

- T002 and T003 (Phase 1) can run in parallel — different files
- T004–T006 (Phase 2 implementation) must run sequentially — same file
- T007–T008 (Phase 2 tests) can start after T004–T006
- Within Phase 3: T009–T011 (state + handlers) must complete before T012–T015 (JSX panels); T017–T019 (new tests) can be written in parallel with T016 (updating existing tests) since they target different files
- T023 and T024 (Phase 4 tests) can run in parallel — different files
- T030 and T031 (Phase 6) can run in parallel — different files

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# After T009–T011 complete (state + handlers):
# These step panel tasks can run in parallel (different render branches, same file with clear ownership):
Task T012: "Render Step 0 (Setup) content inside CreateEvent.tsx"
Task T013: "Render Step 1 (Roster) content inside CreateEvent.tsx"
Task T014: "Render Step 2 (Confirm) content inside CreateEvent.tsx"

# After T015 (JSX wired), test files can run in parallel:
Task T016: "Update six affected test files for refactored CreateEvent.tsx"
Task T017: "Write new test create-event-stepper-step1.test.tsx"
Task T018: "Write new test create-event-stepper-step2.test.tsx"
Task T019: "Write new test create-event-stepper-step3.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Install `motion`, scaffold files
2. Complete **Phase 2**: Standalone Stepper component — tested and accessible
3. Complete **Phase 3**: Full `CreateEvent.tsx` refactor — all three steps wired
4. **STOP and VALIDATE**: All frontend tests pass; manual walkthrough of new-event flow succeeds
5. Demo / merge if ready — the core feature is delivered

### Incremental Delivery

1. Phase 1 + 2 → Stepper component ready (reusable by other flows in future)
2. Phase 3 (US1) → Full new-event stepper works → Demo MVP
3. Phase 4 (US2) → Resume/edit flow works → Demo with return-to-slot scenario
4. Phase 5 (US3) → Back-navigation + mode-change verified → Full spec covered
5. Phase 6 → Polish, accessibility, final checks → Ready to merge

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

- **Developer A**: Phase 3 (US1) — main `CreateEvent.tsx` refactor
- **Developer B**: Can work on Phase 3 test files (T017–T019) once the step panel JSX skeleton exists
- Phases 4 and 5 are sequential after US1 but are small enough to be done solo

---

## Notes

- **No backend changes**: All tasks are purely frontend. The existing `createEvent` and `updateEvent` API calls are reused without modification.
- **`motion` is a new runtime dependency**: T001 must be the very first task executed.
- **Test file count**: 6 existing test files updated + 4 new test files = 10 test files touched in total.
- **Removed exports**: `getPrimarySaveLabel` is currently exported from `CreateEvent.tsx` and used in existing tests — verify no test imports it before removing in T030.
- **CSS**: The two-column `.create-event-grid` layout class in `layout.css` is not removed (it may be used elsewhere or reused in future) — only the usage in `CreateEvent.tsx` is removed.
- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- Each user story has a clearly defined checkpoint for independent validation
