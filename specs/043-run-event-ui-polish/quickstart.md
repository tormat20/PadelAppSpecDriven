# Quickstart: Implementing Run Event UI Polish (043)

**Branch**: `043-run-event-ui-polish`  
**Date**: 2026-03-31

---

## Prerequisites check

```bash
# Verify you are on the correct branch
git branch --show-current
# Expected: 043-run-event-ui-polish

# Verify dev server runs
cd frontend && npm run dev
```

---

## Files to change

| File | Change |
|------|--------|
| `frontend/src/pages/RunEvent.tsx` | Remove `<header>` panel; add `run-grid__round-header` wrapper inside `.run-grid` |
| `frontend/src/styles/components.css` | Add `.run-grid__round-header` CSS rule after `.run-grid` block |
| `frontend/src/components/calendar/EventBlock.tsx` | Replace `scheduleMoment` with `statusLabel`; add `getEventStatusLabel` helper |
| `frontend/src/pages/PlayerStats.tsx` | Increase `COURT_W`/`COURT_H`; floor `maxCourtInt` at 7 |

---

## Implementation steps

### Step 1 — Remove the header panel from RunEvent.tsx

In `frontend/src/pages/RunEvent.tsx`, delete lines 351–363 (the entire `<header>` element):

**Remove this block entirely**:

```tsx
      <header className="page-header panel">
        <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
        <p className="page-subtitle">Submit each result to unlock the next round.</p>
        {roundStepperProps && (
          <Stepper
            steps={roundStepperProps.steps}
            currentStep={roundStepperProps.currentStep}
            direction={1}
          >
            <></>
          </Stepper>
        )}
      </header>
```

---

### Step 2 — Add run-grid__round-header wrapper inside .run-grid

Still in `RunEvent.tsx`, find the `<section className="panel run-grid">` (line 365 after the deletion above shifts lines). Add the round-header wrapper as the **first child** of that section, before `<CourtGrid .../>`:

**Replace**:

```tsx
      <section className="panel run-grid">
        <CourtGrid
```

**With**:

```tsx
      <section className="panel run-grid">
        <div className="run-grid__round-header">
          <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
          {roundStepperProps && (
            <Stepper
              steps={roundStepperProps.steps}
              currentStep={roundStepperProps.currentStep}
              direction={1}
            >
              <></>
            </Stepper>
          )}
        </div>
        <CourtGrid
```

---

### Step 3 — Add CSS rule for run-grid__round-header

In `frontend/src/styles/components.css`, find the `.run-grid` block:

```css
.run-grid {
  display: grid;
  gap: var(--space-3);
}
```

Add the new rule immediately after it:

```css
.run-grid__round-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

> **Note for branch 045**: This rule will later be extended to `flex-direction: row` with `justify-content: space-between` when the fullscreen button is added. Leave it as column for now — that is correct for the 043 state.

---

### Step 4 — Replace moment label with status label in EventBlock.tsx

In `frontend/src/components/calendar/EventBlock.tsx`:

**Step 4a** — Replace the variable declaration at line 70:

**Remove**:
```tsx
  const scheduleMoment = formatEventMomentLabel(event.eventDate, event.eventTime24h)
```

**Add**:
```tsx
  const statusLabel = getEventStatusLabel(event.status)
```

**Step 4b** — Update the render at line 134:

**Remove**:
```tsx
      <span className="calendar-event-block__moment">{scheduleMoment}</span>
```

**Add**:
```tsx
      <span className="calendar-event-block__moment">{statusLabel}</span>
```

**Step 4c** — Add the `getEventStatusLabel` helper function at the bottom of the file, **after** the existing `formatEventMomentLabel` export (preserving it):

```ts
function getEventStatusLabel(status: string): string {
  if (status === "Running") return "Ongoing"
  if (status === "Finished") return "Finished"
  return "Planned"
}
```

> **Important**: Do **not** modify or remove `formatEventMomentLabel`. It must remain exported for backward compatibility with existing tests (FR-008).

---

### Step 5 — Fix PlayerStats court chart constants and Y-axis floor

In `frontend/src/pages/PlayerStats.tsx`:

**Step 5a** — Increase chart dimensions (lines 264–265):

**Remove**:
```ts
const COURT_W = 340
const COURT_H = 180
```

**Add**:
```ts
const COURT_W = 420
const COURT_H = 240
```

**Step 5b** — Floor `maxCourtInt` at 7 (line 279, inside `CourtLineChart`):

**Remove**:
```ts
  const maxCourtInt = Math.ceil(maxCourt)
```

**Add**:
```ts
  const maxCourtInt = Math.max(Math.ceil(maxCourt), 7)
```

---

## Verification

```bash
# 1. Lint
cd frontend && npm run lint

# 2. Full test suite
cd frontend && npm test

# 3. Targeted test for EventBlock (moment/status label)
cd frontend && npm test -- --run tests/calendar-event-block.test.ts
```

### Manual verification checklist

**Change A-1 (RunEvent header collapse)**:
1. Open a running event → confirm ONE panel above the action buttons (no separate header panel above the court grid)
2. The text "Submit each result to unlock the next round." must NOT appear anywhere on the page
3. The round title "Run Event - Round N" appears inside the court grid panel
4. For a non-Mexicano event: the round stepper is visible inside the court grid panel below the title
5. For a Mexicano event: only the title appears at the top of the court grid panel — no empty space

**Change A-2 (EventBlock status label)**:
1. Open the calendar with events in all three states
2. A Lobby event block shows "Planned" in the small muted label position (where "Wednesday Afternoon" used to appear)
3. A Running event block shows "Ongoing"
4. A Finished event block shows "Finished"
5. The time-range line (e.g. "10:00 - 12:00") still appears unchanged on the line below the status label

**Change A-3 (CourtLineChart fix)**:
1. Open the Player Stats page for any player with court data
2. The court line chart is visibly larger than before (wider and taller)
3. The Y-axis shows ticks for all 7 courts (1 through 7) even if the player's highest court was below 7
4. For a player with no court data: the chart section does not appear (no regression)
