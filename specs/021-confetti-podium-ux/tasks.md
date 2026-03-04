# Tasks: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Feature**: `021-confetti-podium-ux`  
**Branch**: `021-confetti-podium-ux`  
**Date**: 2026-03-04  
**Total tasks**: 28

---

## Phase 1 — Setup

### T001 — Install canvas-confetti
- **File**: `frontend/package.json` (via npm)
- **Action**: Run `npm install canvas-confetti && npm install --save-dev @types/canvas-confetti` in `frontend/`
- **Verify**: `canvas-confetti` appears in `dependencies`; `@types/canvas-confetti` in `devDependencies`

### T002 — Scaffold confetti.ts
- **File**: `frontend/src/features/summary/confetti.ts` (NEW)
- **Action**: Create empty file with placeholder export `export {}`
- **Verify**: File exists, TypeScript compiles

### T003 — Scaffold podium.ts
- **File**: `frontend/src/features/summary/podium.ts` (NEW)
- **Action**: Create empty file with placeholder export `export {}`
- **Verify**: File exists, TypeScript compiles

### T004 — Scaffold rosterHints.ts
- **File**: `frontend/src/features/create-event/rosterHints.ts` (NEW)
- **Action**: Create empty file with placeholder export `export {}`
- **Verify**: File exists, TypeScript compiles

### T005 — Scaffold Podium.tsx
- **File**: `frontend/src/components/summary/Podium.tsx` (NEW)
- **Action**: Create minimal stub component returning `null`
- **Verify**: File exists, TypeScript compiles

---

## Phase 2 — Backend: Add eventType to summary API

### T006 — Add event_type to FinalSummaryResponse schema
- **File**: `backend/app/api/schemas/summary.py`
- **Action**: Add `event_type: str` field to `FinalSummaryResponse`
- **Verify**: Python import succeeds; field visible in OpenAPI docs

### T007 — Pass event_type in summary router
- **File**: `backend/app/api/routers/events.py`
- **Action**: In the summary endpoint, pass `event_type=event.event_type.value` into `FinalSummaryResponse(...)`
- **Verify**: `GET /events/{id}/summary` response JSON includes `"event_type"` key

---

## Phase 2 — Frontend: Wire eventType through types and API

### T008 — Add eventType to FinalEventSummary type
- **File**: `frontend/src/lib/types.ts`
- **Action**: Add `eventType: EventType` to the `FinalEventSummary` interface
- **Verify**: TypeScript compiles; no new errors

### T009 — Pass eventType in normalizeFinalSummaryResponse
- **File**: `frontend/src/lib/api.ts`
- **Action**: Map `data.event_type` → `eventType` (cast to `EventType`) in the normalization function
- **Verify**: TypeScript compiles; no new errors

---

## Phase 3 — US1: Confetti

### T010 — Implement scheduleConfettiBursts() in confetti.ts
- **File**: `frontend/src/features/summary/confetti.ts`
- **Action**: Export `scheduleConfettiBursts(): () => void` — schedules 10 `confetti()` calls at 0.1s intervals from random `origin` coordinates; returns a cleanup function that clears all timeouts
- **Verify**: Function exported; TypeScript compiles

### T011 — Wire confetti useEffect in Summary.tsx
- **File**: `frontend/src/pages/Summary.tsx`
- **Action**: Add `useEffect(() => { if (!summary.isFinal) return; return scheduleConfettiBursts(); }, [summary.isFinal])` — wrapped in try/catch for progressive enhancement
- **Verify**: TypeScript compiles; no new errors

### T012 — Unit test for scheduleConfettiBursts
- **File**: `frontend/tests/summary-confetti.test.ts` (NEW)
- **Action**: Test that the function returns a callable cleanup; test that calling cleanup before bursts complete does not throw; mock `canvas-confetti` with `vi.mock`
- **Verify**: `npm test` passes

---

## Phase 4 — US2: Winner Podium

### T013 — Implement buildPodiumSlots() in podium.ts
- **File**: `frontend/src/features/summary/podium.ts`
- **Action**: Export `buildPodiumSlots(eventType: EventType, playerRows: PlayerRow[]): PodiumSlot[]` — returns 0–3 slots; Mexicano picks ranks 1/2/3 (1 player each); WinnersCourt picks ranks 1–2/3–4/5–6 (2 players each); BeatTheBox returns []; empty slots omitted
- **Verify**: TypeScript compiles

### T014 — Unit test for buildPodiumSlots
- **File**: `frontend/tests/summary-podium.test.ts` (NEW)
- **Action**: Test Mexicano 3-player case, WinnersCourt 6-player case, BeatTheBox case, sparse player cases (fewer than required)
- **Verify**: `npm test` passes

### T015 — Build Podium.tsx component
- **File**: `frontend/src/components/summary/Podium.tsx`
- **Action**: Replace stub — render 3-column podium using `buildPodiumSlots()` output; 2nd on left, 1st in center, 3rd on right; each slot shows place label + player name(s); apply `.podium-slot--first/second/third` height classes
- **Verify**: TypeScript compiles

### T016 — Add podium CSS
- **File**: `frontend/src/styles/components.css`
- **Action**: Add `.podium-container`, `.podium-slot`, `.podium-slot--first` (tallest), `.podium-slot--second`, `.podium-slot--third` classes; responsive flex layout; use existing colour tokens
- **Verify**: No CSS parse errors; visual check in browser

### T017 — Integrate Podium into Summary.tsx
- **File**: `frontend/src/pages/Summary.tsx`
- **Action**: Import `<Podium>` and render it above the results table when `summary.isFinal && summary.eventType !== "BeatTheBox"`
- **Verify**: TypeScript compiles; no new errors

---

## Phase 5 — US3: Roster Hints

### T018 — Implement getRosterHints() in rosterHints.ts
- **File**: `frontend/src/features/create-event/rosterHints.ts`
- **Action**: Export `getRosterHints(courts: string[], assignedPlayers: string[]): { showChooseCourts: boolean; showAssignPlayers: boolean }` — `showChooseCourts = courts.length === 0`; `showAssignPlayers = courts.length > 0 && assignedPlayers.length !== courts.length * 4`
- **Verify**: TypeScript compiles

### T019 — Unit test for getRosterHints
- **File**: `frontend/tests/roster-hints.test.ts` (NEW)
- **Action**: Test zero courts, one court + 0 players, one court + 4 players, two courts + 8 players, two courts + 7 players
- **Verify**: `npm test` passes

### T020 — Add inline hints to CreateEvent.tsx Roster step
- **File**: `frontend/src/pages/CreateEvent.tsx`
- **Action**: Import `getRosterHints`; compute hints; render `<span className="warning-text">Choose courts</span>` next to `<CourtSelector>` when `showChooseCourts`; render `<span className="warning-text">Assign players</span>` next to `<PlayerSelector>` when `showAssignPlayers`
- **Verify**: TypeScript compiles; hints appear/disappear correctly in browser

---

## Phase 6 — US4: Setup Step Labels

### T021 — Add .section-label CSS class
- **File**: `frontend/src/styles/components.css`
- **Action**: Add `.section-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.25rem; }` (matching existing `.section-title` style from CourtSelector)
- **Verify**: No CSS parse errors

### T022 — Add labels to Setup step in CreateEvent.tsx
- **File**: `frontend/src/pages/CreateEvent.tsx`
- **Action**: Add `<p className="section-label">Choose mode</p>` directly above the mode selector; add `<p className="section-label">Choose date and time</p>` directly above the date/time inputs
- **Verify**: TypeScript compiles; labels visible in browser

---

## Phase 7 — US5: Today's Date Button

### T023 — Recolour .today-date-link
- **File**: `frontend/src/styles/components.css`
- **Action**: Change `.today-date-link` colour from `var(--color-accent-strong)` to `var(--color-warning-text)`
- **Verify**: Button appears orange in both light and dark mode

### T024 — Move Today's date button above date input
- **File**: `frontend/src/pages/CreateEvent.tsx`
- **Action**: In the Setup step JSX, move the "Today's date" `<button>` element to appear before (above) the date `<input>` element
- **Verify**: TypeScript compiles; button visually above date input in browser

---

## Phase 8 — Polish and Verification

### T025 — Run lint
- **Command**: `cd frontend && npm run lint`
- **Action**: Fix any lint errors introduced by new files
- **Verify**: Zero lint errors

### T026 — Run full test suite
- **Command**: `cd frontend && npm test`
- **Action**: Confirm all existing tests still pass plus 3 new test files pass
- **Verify**: All tests green

### T027 — Dark mode visual check
- **Action**: Open app in browser, toggle dark mode, verify confetti fires, podium renders, hints are readable, "Today's date" button is orange
- **Verify**: No colour or contrast regressions in dark mode

### T028 — Smoke test end-to-end
- **Action**: Complete a Mexicano event → verify confetti + podium on final summary; complete a WinnersCourt event → verify podium; complete a BeatTheBox event → verify no podium; create a new event → verify Setup labels + Today button + Roster hints
- **Verify**: All 5 user stories work as described in spec.md
