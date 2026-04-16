---

description: "Task list for 045-run-event-fullscreen"
---

# Tasks: Run Event Fullscreen Mode

**Input**: `specs/045-run-event-fullscreen/`  
**Prerequisites**: Branch `043-run-event-ui-polish` merged — `run-grid__round-header` must exist in `RunEvent.tsx`

**Tests**: Not required per spec (no test tasks included).

**Organization**: Phases follow the implementation dependency order — CSS first (no React deps), then state + hooks in `RunEvent.tsx`, then JSX wiring.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Prerequisite Verification

**Purpose**: Confirm branch 043 changes are present before any implementation begins.

**⚠️ CRITICAL**: The toggle button placement depends on `run-grid__round-header` introduced by branch 043. Do not proceed if the element is absent.

- [x] T001 Verify `run-grid__round-header` div exists in `frontend/src/pages/RunEvent.tsx` (grep check per quickstart.md)
- [x] T001b Confirm dev server starts cleanly: `cd frontend && npm run dev`

**Checkpoint**: Branch 043 changes confirmed present — implementation can begin.

---

## Phase 2: CSS — Fullscreen Overlay and Scoped Overrides

**Purpose**: All CSS rules needed for the overlay and scaled-up court card elements. No React changes; can be applied first and verified independently in the browser with a temporary class toggle.

**Goal**: `.run-fullscreen-overlay` renders as a fixed full-viewport overlay with correct background, scroll, and z-index. Scoped overrides enlarge court cards, player names, score badges, streak icons, and column widths when the overlay is active.

**Independent Test**: Temporarily add `run-fullscreen-overlay` class to the run-grid section in devtools and confirm visual scaling.

### Implementation for Phase 2

- [x] T002 [US1] Add `.run-fullscreen-overlay` base rule to `frontend/src/styles/components.css` after the `.run-grid` block (~line 614):
  - `position: fixed; inset: 0; z-index: 30`
  - `overflow-y: auto; background: var(--color-bg)`
  - `display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4)`

- [x] T003 [P] [US2] Add `.run-fullscreen-overlay .court-card` override in `frontend/src/styles/components.css`:
  - `min-height: 360px` (up from 260px, +38%)

- [x] T004 [P] [US2] Add `.run-fullscreen-overlay .team-grouping` override in `frontend/src/styles/components.css`:
  - `min-height: 5.5rem; padding: 0.85rem 1rem`

- [x] T005 [P] [US2] Add `.run-fullscreen-overlay .team-player-name` override in `frontend/src/styles/components.css`:
  - `font-size: 1.1rem` (up from 0.875rem, +25.7% — meets SC-002)

- [x] T006 [P] [US2] Add `.run-fullscreen-overlay .team-result-badge` override in `frontend/src/styles/components.css`:
  - `font-size: 1.05rem; min-width: 2.8rem; padding: 0.35rem 0.7rem`

- [x] T007 [P] [US2] Add `.run-fullscreen-overlay .court-fire-icon, .run-fullscreen-overlay .court-snowflake-icon` override in `frontend/src/styles/components.css`:
  - `height: 1.2rem; width: 1.2rem` (up from 0.95rem, +26%)

- [x] T008 [P] [US2] Add `.run-fullscreen-overlay .grid-columns-2` override in `frontend/src/styles/components.css`:
  - `grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))` (min-col up from 280px, +29%)

- [x] T009 [US1] Update `.run-grid__round-header` rule in `frontend/src/styles/components.css` to row layout:
  - `display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: var(--space-3)`

- [x] T010 [P] [US1] Add `.run-grid__round-header-left` rule in `frontend/src/styles/components.css`:
  - `display: flex; flex-direction: column; gap: var(--space-2)`

- [x] T019 [US1] Add `body:has(.run-fullscreen-overlay) .card-nav-container { display: none; }` rule to `frontend/src/styles/components.css` (after the `.run-fullscreen-overlay .grid-columns-2` override) — hides sticky nav via CSS `:has()` with no JS changes

**Checkpoint**: All CSS rules in place. Visual scaling verifiable via devtools before any React changes.

---

## Phase 3: State and Hooks — RunEvent.tsx

**Purpose**: Add the `isFullscreen` boolean state, the `fullscreenOverlayRef`, the Escape key handler, and the scroll-to-top effect. No JSX structure changes yet; the state is wired up and testable in isolation.

**Goal**: `isFullscreen` toggles correctly; Escape exits fullscreen; overlay scrolls to top on enter.

**Independent Test**: Add a temporary `console.log(isFullscreen)` and confirm state transitions in browser devtools console.

### Implementation for Phase 3

- [x] T011 [US1] Add `isFullscreen` state and `fullscreenOverlayRef` in `frontend/src/pages/RunEvent.tsx` after existing `useState` declarations (~line 150):
  ```tsx
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenOverlayRef = useRef<HTMLDivElement>(null)
  ```

- [x] T012 [US1] Add Escape key `useEffect` in `frontend/src/pages/RunEvent.tsx` (depends on T011):
  - Registers `keydown` on `window` when `isFullscreen` is true
  - Calls `setIsFullscreen(false)` on `key === "Escape"`
  - Removes listener on cleanup; effect deps: `[isFullscreen]`

- [x] T013 [US1] Add scroll-to-top `useEffect` in `frontend/src/pages/RunEvent.tsx` (depends on T011):
  - Calls `fullscreenOverlayRef.current?.scrollTo({ top: 0, behavior: "instant" })` when `isFullscreen` becomes `true`
  - Effect deps: `[isFullscreen]`

**Checkpoint**: State, ref, and effects are wired. Lint passes: `cd frontend && npm run lint`.

---

## Phase 4: JSX Wiring — Toggle Button and Overlay Wrapper

**Purpose**: Connect the state to the UI — add the toggle button in the round header and conditionally render the fullscreen overlay wrapper around the court and action panels.

**Goal**: Clicking "Fullscreen" wraps the two panels in `.run-fullscreen-overlay`; clicking "Exit Fullscreen" unwraps them. The `ResultModal` stays outside the overlay at all times.

**Independent Test (US1)**: Click the toggle button — nav bar disappears, overlay fills viewport, button label switches to "Exit Fullscreen". Click again — returns to normal layout.

**Independent Test (US3)**: In fullscreen, click a team grouping, enter a score, submit — modal appears above overlay, result badge updates.

**Independent Test (US4)**: In fullscreen, scroll down — Prev/Next buttons are visible and clickable; clicking Next advances the round and scrolls to top.

### Implementation for Phase 4

- [x] T014 [US1] Restructure `run-grid__round-header` div content in `frontend/src/pages/RunEvent.tsx` (depends on T011):
  - Wrap existing title and optional Stepper in a `<div className="run-grid__round-header-left">` sub-div
  - Add fullscreen toggle `<button>` to the right of that sub-div:
    - `type="button"`
    - `className={withInteractiveSurface("button-secondary")}`
    - `aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}`
    - `onClick={() => setIsFullscreen((v) => !v)}`
    - Label: `{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}`

- [x] T015 [US1] Wrap the two panel sections in `frontend/src/pages/RunEvent.tsx` with conditional overlay (depends on T011, T014):
  - Extract `<section className="panel run-grid">` and `<section className="panel grid-columns-2">` into a shared `courtContent` fragment
  - When `isFullscreen` is true, render `<div className="run-fullscreen-overlay" ref={fullscreenOverlayRef}>{courtContent}</div>`
  - When `isFullscreen` is false, render `{courtContent}` directly
  - Confirm `<ResultModal />` remains outside the overlay wrapper (sibling, not nested inside it)

**Checkpoint**: US1, US2, US3, and US4 are all functional. Full manual checklist from quickstart.md can be run.

---

## Phase 5: Verification and Polish

**Purpose**: Confirm no regressions, lint is clean, and the quickstart manual checklist passes end-to-end.

- [x] T016 [P] Run frontend lint: `cd frontend && npm run lint` — must pass with zero errors
- [x] T017 [P] Run full frontend test suite: `cd frontend && npm test` — all existing tests must pass (SC-006)
- [ ] T018 Manual verification against quickstart.md checklist (8 steps):
  1. Fullscreen button visible in round header
  2. Entering fullscreen hides nav, fills viewport, label → "Exit Fullscreen"
  3. Court cards taller, names larger, score badges larger (SC-002: ≥25% font increase)
  4. Result modal opens on top of fullscreen overlay
  5. Submitting result updates court card; fullscreen stays active
  6. Next Round advances, page scrolls to top, stays fullscreen (FR-014)
  7. Escape exits fullscreen, nav reappears (FR-010, SC-004)
  8. "Exit Fullscreen" button exits cleanly

- [ ] T020 Browser verify three remaining issues after T019:
  1. Nav bar is fully hidden (not merely covered) when fullscreen is active — `:has()` rule working
  2. Player name font size is visually larger in fullscreen (hard-refresh dev server to clear HMR cache if needed)
  3. Score badge font size is visually larger in fullscreen

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Prereq check)**: No code dependencies — verify 043 presence before touching files
- **Phase 2 (CSS)**: Depends on Phase 1 confirmation — can be applied independently of React changes
- **Phase 3 (State + hooks)**: Depends on Phase 1 only — parallel with Phase 2 (different file)
- **Phase 4 (JSX)**: Depends on Phase 2 (CSS class names must exist) AND Phase 3 (state/ref must exist)
- **Phase 5 (Verify)**: Depends on Phase 4 being complete

### Parallel Opportunities

- T003–T010: All CSS override rules target different selectors — can be written in one pass or in parallel
- T009 and T010: Different CSS rules, no ordering dependency between them
- T011, T012, T013: Sequential within Phase 3 (each depends on T011's state declaration)
- T016 and T017: Lint and tests can run in parallel
- Phase 2 (CSS) and Phase 3 (State/hooks): Different files — can proceed in parallel after Phase 1

### User Story Coverage

| Task(s) | User Story | FR / SC |
|---------|------------|---------|
| T002, T009, T010, T014, T015 | US1 — Toggle + overlay | FR-001, FR-002, FR-003, FR-010, FR-013, FR-014 |
| T003–T008 | US2 — Larger court cards | FR-005, FR-006, FR-007, FR-008, FR-009, SC-002 |
| T015 (ResultModal stays outside) | US3 — Result submission in fullscreen | FR-011 |
| T015 (action panel inside overlay) | US4 — Prev/Next accessible | FR-004 |

---

## Notes

- No backend changes. No new test files required per the key facts.
- No SVG icons — text labels only ("Fullscreen" / "Exit Fullscreen").
- No browser Fullscreen API (FR-013).
- The overlay's `z-index: 30` covers the sticky nav (`z-index: 20`); the result modal's `z-index: 40` naturally sits above — no modal changes needed.
- All scoped CSS overrides use `.run-fullscreen-overlay .target-class` two-class specificity (0,2,0) — no `!important` required.
- Fullscreen state is in-memory only; resets on navigation (FR-012 — no other page affected).
