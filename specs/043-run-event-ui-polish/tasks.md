# Tasks: Run Event UI Polish (043)

**Input**: `specs/043-run-event-ui-polish/`
**Branch**: `043-run-event-ui-polish`
**No new test files required** — changes are structural/visual; existing tests pass unchanged.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All three sub-changes touch different files and are fully independent

---

## Phase 1: Change A-1 — RunEvent header collapse into run-grid panel (US1, Priority: P1)

**Goal**: Remove the standalone `<header className="page-header panel">` and move its content (round title + stepper) into a new `run-grid__round-header` wrapper inside `.run-grid`. Removes wasted vertical space.

**Independent Test**: Open the Run Event page — confirm one panel above the action buttons, with the round title inside the court grid panel and no "Submit each result to unlock the next round." text anywhere.

**Prerequisite for branch 045**: `div.run-grid__round-header` must exist as a direct child of `section.panel.run-grid`.

- [ ] T001 [US1] Remove `<header className="page-header panel">` block (lines 351–363) from `frontend/src/pages/RunEvent.tsx` — includes the title, subtitle (`p.page-subtitle`), and conditional `<Stepper>`
- [ ] T002 [US1] Add `<div className="run-grid__round-header">` wrapper as first child of `<section className="panel run-grid">` in `frontend/src/pages/RunEvent.tsx`, containing `<h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>` and the conditional `<Stepper>` block (unchanged props)
- [ ] T003 [P] [US1] Add `.run-grid__round-header { display: flex; flex-direction: column; gap: var(--space-2); }` rule to `frontend/src/styles/components.css` immediately after the `.run-grid` block (~line 614)

**Checkpoint**: One panel above the action buttons; round title and stepper inside `.run-grid`; subtitle absent.

---

## Phase 2: Change A-2 — EventBlock lifecycle status label (US2, Priority: P2)

**Goal**: Replace the time-of-day moment label on calendar event blocks with a lifecycle status label ("Planned" / "Ongoing" / "Finished"). `formatEventMomentLabel` remains exported and all existing tests continue to pass.

**Independent Test**: Open the calendar with events in all three states — each block shows the correct status label where the moment used to appear; the time-range line is unchanged.

- [ ] T004 [P] [US2] Add `getEventStatusLabel(status: string): string` helper function at the bottom of `frontend/src/components/calendar/EventBlock.tsx` (after the existing `formatEventMomentLabel` export): `Lobby → "Planned"`, `Running → "Ongoing"`, `Finished → "Finished"`, unknown → `"Planned"`
- [ ] T005 [US2] In `frontend/src/components/calendar/EventBlock.tsx`, replace `const scheduleMoment = formatEventMomentLabel(event.eventDate, event.eventTime24h)` with `const statusLabel = getEventStatusLabel(event.status)` (depends on T004)
- [ ] T006 [US2] In `frontend/src/components/calendar/EventBlock.tsx`, update the JSX render: replace `{scheduleMoment}` with `{statusLabel}` inside `<span className="calendar-event-block__moment">` (depends on T005)

**Checkpoint**: Status labels render correctly on all event blocks; `formatEventMomentLabel` remains exported; `npm test -- --run tests/calendar-event-block.test.ts` passes.

---

## Phase 3: Change A-3 — PlayerStats court chart Y-axis and size fix (US3, Priority: P3)

**Goal**: Increase `COURT_W`/`COURT_H` constants and floor `maxCourtInt` at 7 so the Y-axis always spans courts 1–7 regardless of the player's actual data.

**Independent Test**: View Player Stats for a player whose highest court is 5 — Y-axis shows ticks 1 through 7; chart is visibly larger.

- [ ] T007 [P] [US3] In `frontend/src/pages/PlayerStats.tsx`, change `COURT_W` from `340` to `420` and `COURT_H` from `180` to `240` (lines 264–265)
- [ ] T008 [US3] In `frontend/src/pages/PlayerStats.tsx`, change `const maxCourtInt = Math.ceil(maxCourt)` to `const maxCourtInt = Math.max(Math.ceil(maxCourt), 7)` inside `CourtLineChart` (line 279, depends on T007)

**Checkpoint**: Court chart is larger (420×240); Y-axis always shows courts 1–7; players with no court data still see no chart (null guard unchanged).

---

## Phase 4: Verification

- [ ] T009 Run `cd frontend && npm run lint` — zero errors
- [ ] T010 Run `cd frontend && npm test` — full suite passes with zero new failures
- [ ] T011 Run `cd frontend && npm test -- --run tests/calendar-event-block.test.ts` — targeted EventBlock tests pass (confirms `formatEventMomentLabel` export intact)

---

## Dependencies & Execution Order

### Parallel opportunities

- **T001, T002** must run sequentially (same file, same JSX block — delete header first, then add wrapper)
- **T003** [P] — `components.css` is independent, can run alongside T001/T002
- **T004, T005, T006** must run sequentially (T005 calls the function added in T004; T006 uses the variable from T005)
- **T007, T008** must run sequentially (T008 uses the constants set in T007)
- **A-1 group (T001–T003)**, **A-2 group (T004–T006)**, and **A-3 group (T007–T008)** are fully independent of each other — all three sub-changes can be worked on in parallel by different developers
- **T009–T011** run after all implementation tasks complete

### Task-to-file mapping

| Task | File |
|------|------|
| T001, T002 | `frontend/src/pages/RunEvent.tsx` |
| T003 | `frontend/src/styles/components.css` |
| T004, T005, T006 | `frontend/src/components/calendar/EventBlock.tsx` |
| T007, T008 | `frontend/src/pages/PlayerStats.tsx` |
