# Research: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Feature**: `021-confetti-podium-ux`  
**Date**: 2026-03-04

## Codebase Findings

### 1. canvas-confetti

- **Not installed** in `frontend/`. Must be added: `npm install canvas-confetti && npm install --save-dev @types/canvas-confetti`
- The library's default export is a function: `confetti({ origin: { x, y }, ... })`. It returns a `Promise<undefined>`.
- Used as a fire-and-forget side effect inside a `useEffect`.

### 2. eventType on the summary API

- `GET /events/{id}/summary` → `FinalSummaryResponse` (in `backend/app/api/schemas/summary.py`) — does **not** include `eventType`.
- `GET /events/{id}` → `EventResponse` (in `backend/app/api/schemas/events.py`) — **does** include `eventType`.
- `EventType` enum is in `backend/app/domain/enums.py`: values are `"Mexicano"`, `"WinnersCourt"`, `"BeatTheBox"`.
- Decision: add `event_type: str` to `FinalSummaryResponse` and pass `event.event_type.value` in the router. Frontend receives it as `eventType: EventType` on `FinalEventSummary`.

### 3. Frontend types

- `frontend/src/lib/types.ts` defines `FinalEventSummary` — needs `eventType: EventType` added.
- `EventType` type already defined in the same file: `"WinnersCourt" | "Mexicano" | "BeatTheBox"`.
- `frontend/src/lib/api.ts` has `normalizeFinalSummaryResponse()` — needs to pass through `eventType`.

### 4. Summary page

- `frontend/src/pages/Summary.tsx` — renders both in-progress and final views.
- Final mode detected via `summary.isFinal` (boolean on `FinalEventSummary`).
- Player rows in `summary.playerRows` are already sorted by rank ascending (via `sortRowsByRank` in `rankOrdering.ts`).
- Confetti `useEffect` runs when `summary.isFinal === true`; cleans up timeouts on unmount.
- `<Podium>` rendered between the page header and the results table, conditional on `summary.isFinal && summary.eventType !== "BeatTheBox"`.

### 5. Podium layout

- Visual order: 2nd place (left) · 1st place (center, taller) · 3rd place (right) — classic Olympic podium.
- Mexicano: 1 player per slot → ranks 1, 2, 3.
- WinnersCourt: 2 players per slot → ranks 1–2, 3–4, 5–6.
- Empty slots (insufficient ranked players) are hidden via CSS `display: none` / conditional render.

### 6. Warning colour

- `var(--color-warning-text)` defined in `frontend/src/styles/tokens.css`:
  - Light: `#8b4f08`
  - Dark: `#e8a040`
- Used on `.warning-text` class already in `components.css`.
- Both inline hints and the "Today's date" button recolour change must use this token.

### 7. Today's date button

- In `CreateEvent.tsx`, current colour set by `.today-date-link` in `components.css` → `var(--color-accent-strong)` (`#0a6970`).
- Button appears **below** the date `<input>` in JSX order — needs to move **above** it.
- Change colour to `color: var(--color-warning-text)` (no new token).

### 8. CreateEvent.tsx — Roster step validation

- `step1NextDisabled` is currently always `false` — no conditional validation on Roster step.
- Courts stored in `courts` (array of strings from `CourtSelector`).
- Assigned players in `assignedPlayers` (array); required count = `courts.length * 4`.
- Hints are conditional renders with `className="warning-text"` (existing orange class).
- "Choose courts" hint: `courts.length === 0` → show near `<CourtSelector>`.
- "Assign players" hint: `assignedPlayers.length !== courts.length * 4` (and `courts.length > 0`) → show near `<PlayerSelector>`.

### 9. Setup step labels

- Mode selector and date/time inputs are inside the Setup step (`step === 0`) in `CreateEvent.tsx`.
- New label element: `<p className="section-label">Choose mode</p>` and `<p className="section-label">Choose date and time</p>`.
- `.section-label` CSS: small muted label, similar to existing `.section-title` in `CourtSelector.tsx`.

### 10. Test patterns

- Vitest 2, pure function unit tests only.
- No `@testing-library/react` — no JSX rendering in tests.
- All tests in `frontend/tests/` directory.
- Tests import the pure helper functions directly and assert on return values.
