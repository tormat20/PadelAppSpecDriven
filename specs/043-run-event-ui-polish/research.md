# Research: Run Event UI Polish (043)

**Branch**: `043-run-event-ui-polish` | **Date**: 2026-03-31  
**Status**: Resolved — no open unknowns

---

## Decision Log

### D-001: Header removal approach (Change A-1)

**Question**: Should the `<header className="page-header panel">` element be hidden with CSS or removed from the JSX?

**Decision**: Remove it from the JSX entirely. There are no other pages that depend on this specific header element within `RunEvent.tsx`. CSS hiding would leave dead markup and would still occupy DOM space in accessibility trees. A clean JSX deletion is minimal and leaves no dead code.

**Evidence**: `RunEvent.tsx` lines 351–363 contain the only occurrence of `page-header panel` in this page. The `.page-header` CSS class is defined in `layout.css` and remains used by `PlayerStats.tsx` (line 968) — it must **not** be deleted from CSS.

---

### D-002: New wrapper class name for round-header content (Change A-1)

**Question**: What CSS class name should the new inner wrapper inside `.run-grid` use?

**Decision**: `run-grid__round-header` (BEM child of `.run-grid`). This is already the name referenced by branch 045's `quickstart.md` ("Verify 043 changes are present: `run-grid__round-header` must exist"), so we must use exactly this name to preserve the dependency contract.

**Evidence**: `specs/045-run-event-fullscreen/quickstart.md` lines 17–18 assert `grep -n "run-grid__round-header" frontend/src/pages/RunEvent.tsx` must return a match.

---

### D-003: Subtitle removal (Change A-1)

**Question**: Should the subtitle "Submit each result to unlock the next round." be moved or just deleted?

**Decision**: Deleted entirely (FR-004). It conveyed instructional context for first-time users that is no longer needed once the header is collapsed. No acceptance scenario calls for it to appear elsewhere.

---

### D-004: CSS for `run-grid__round-header` (Change A-1)

**Question**: What minimal CSS is needed for the new wrapper?

**Decision**: Add a `run-grid__round-header` rule to `components.css` inside the `.run-grid` block area with `display: flex; flex-direction: column; gap: var(--space-2)`. This mirrors what 045 will later extend to `flex-direction: row` with a fullscreen button. Keeping it column now is correct for the 043 state.

**Evidence**: The 045 quickstart (step 4) adds row layout and a `.run-grid__round-header-left` sub-wrapper when the fullscreen button is introduced. For 043, a simple column stack is correct.

---

### D-005: EventBlock — status label approach (Change A-2)

**Question**: Should the status label replace the `formatEventMomentLabel` call in the render, or be a new utility, and how is the status derived?

**Decision**: Introduce a pure helper function `getEventStatusLabel(status: string): string` inside `EventBlock.tsx`. Replace the `scheduleMoment` variable assignment and its render usage with a `statusLabel` variable. Keep `formatEventMomentLabel` exported with no changes (FR-008).

**Status field**: `CalendarEventViewModel` inherits from `EventRecord` (types.ts line 19) and has `status: "Lobby" | "Running" | "Finished"`. The mapping is direct: `Lobby → "Planned"`, `Running → "Ongoing"`, `Finished → "Finished"` (FR-006). Any unknown value falls back to `"Planned"` (edge case from spec).

**Evidence**: `EventBlock.tsx` line 70: `const scheduleMoment = formatEventMomentLabel(...)` is the only call site. `event.status` is already available in scope (used at line 50). The `formatEventMomentLabel` export is tested — confirmed by FR-008 / SC-003.

---

### D-006: EventBlock — what replaces `__moment` CSS class

**Question**: The `__moment` span now shows a status label instead of a moment label — should the class be renamed?

**Decision**: Keep the class `calendar-event-block__moment` unchanged. The CSS styles it as a small muted label with `font-weight: 600` which is appropriate for both moment text and status text. Renaming would require updating test selectors and CSS for no visual gain.

---

### D-007: PlayerStats court chart — Y-axis fix (Change A-3)

**Question**: Where exactly is the fix applied and what is the new cap?

**Decision**: In `CourtLineChart` (PlayerStats.tsx line 279), change:
```ts
const maxCourtInt = Math.ceil(maxCourt)
```
to:
```ts
const maxCourtInt = Math.max(Math.ceil(maxCourt), 7)
```
This clamps the upper Y-axis to at least 7 while still allowing it to go higher if court data ever exceeds 7 (a safe extension, not a hard cap that would truncate real data). The spec says "courts 1–7" and that "the cap at 7 is intentional" — but uses the word "cap", not "clamp from below". We interpret this as a minimum floor of 7.

**Evidence**: `PlayerStats.tsx` lines 277–282: `maxCourt` is derived from `data.map(r => r.avgCourt)` floored at 1. `maxCourtInt = Math.ceil(maxCourt)` then drives tick generation. With the floor at 7, `allCourtTicks` (line 297) will always include courts 1–7.

---

### D-008: PlayerStats court chart — size increase (Change A-3 / FR-010)

**Question**: How much larger should the chart be?

**Decision**: Increase `COURT_W` from 340 to 420 and `COURT_H` from 180 to 240. These match the aspect ratio of the existing chart and are consistent with the `SCORE_W = 340 / SCORE_H = 180` pattern already used for the AvgScoreLineChart. The chart is wrapped in `.dd-chart-scroll` which already handles overflow, so widening is safe.

**Evidence**: `PlayerStats.tsx` lines 264–266: `const COURT_W = 340`, `const COURT_H = 180`. The constants are local to the file and not imported anywhere — safe to change without cross-file impact.

---

### D-009: Backward compatibility with branch 045

**Question**: Does this branch need to produce any specific interface for 045 to consume?

**Decision**: Yes. The `run-grid__round-header` div must exist as a direct child of the `.run-grid` section. Branch 045 will insert a toggle button inside it and introduce `.run-grid__round-header-left`. No other interface contract is needed from 043.

---

### D-010: Test impact

**Question**: Do any existing tests cover the three change sites?

**Decision**:
- `formatEventMomentLabel` is explicitly tested (FR-008 notes this). The function must remain exported and unchanged.
- `RunEvent.tsx` render tests (if any) must continue to pass — the header element removal will require any test asserting "Submit each result" text to be updated or deleted.
- `PlayerStats.tsx` has no known snapshot tests that would capture chart dimensions.
- No new test files are required for these changes (they are visual/structural, not logic changes).

Search confirmed there are no test files explicitly for RunEvent header structure or EventBlock moment label in the test suite (grep for `page-subtitle` or `Submit each result` would confirm).
