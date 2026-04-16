# Data Model: Run Event UI Polish (043)

**Branch**: `043-run-event-ui-polish` | **Date**: 2026-03-31

---

## Change A-1: RunEvent header collapse into run-grid panel

### JSX Structure — Before

```tsx
<section className="page-shell" aria-label="Run event page">
  {/* ── PANEL 1: standalone header panel ── */}
  <header className="page-header panel">
    <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
    <p className="page-subtitle">Submit each result to unlock the next round.</p>
    {roundStepperProps && (
      <Stepper steps={...} currentStep={...} direction={1}>
        <></>
      </Stepper>
    )}
  </header>

  {/* ── PANEL 2: court grid panel ── */}
  <section className="panel run-grid">
    <CourtGrid ... />
  </section>

  {/* ── PANEL 3: action buttons ── */}
  <section className="panel grid-columns-2"> ... </section>
  ...
</section>
```

### JSX Structure — After

```tsx
<section className="page-shell" aria-label="Run event page">
  {/* ── PANEL 1: court grid panel (now contains round header) ── */}
  <section className="panel run-grid">
    <div className="run-grid__round-header">
      <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
      {roundStepperProps && (
        <Stepper steps={...} currentStep={...} direction={1}>
          <></>
        </Stepper>
      )}
    </div>
    <CourtGrid ... />
  </section>

  {/* ── PANEL 2: action buttons ── */}
  <section className="panel grid-columns-2"> ... </section>
  ...
</section>
```

**Key removals**:
- `<header className="page-header panel">` element and all its children are deleted
- `<p className="page-subtitle">Submit each result to unlock the next round.</p>` is gone entirely (FR-004)

**Key additions**:
- `<div className="run-grid__round-header">` wrapper inside `.run-grid` section, before `<CourtGrid />`
- Contains: `<h2 className="page-title">` + conditional `<Stepper>` (unchanged props)

### CSS — New Rule

Added to `components.css` immediately after the `.run-grid` block (~line 614):

```css
.run-grid__round-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

**Why column direction**: In the 043 state, only the title and optional stepper stack vertically. Branch 045 will change this to `row` and add a `.run-grid__round-header-left` sub-wrapper when the fullscreen toggle button is added.

**State changes**: None. No new React state is introduced for this change.

---

## Change A-2: EventBlock lifecycle status label

### State/Props — No Change

`EventBlock` receives the same `EventBlockProps`. No new props. No new state. The change is purely in derived variable computation and render output.

### Derived Variable — Before

```ts
// EventBlock.tsx line 70
const scheduleMoment = formatEventMomentLabel(event.eventDate, event.eventTime24h)
```

### Derived Variable — After

```ts
// Replace scheduleMoment with statusLabel
const statusLabel = getEventStatusLabel(event.status)
```

### New Helper Function (inlined in EventBlock.tsx, after the formatEventMomentLabel export)

```ts
function getEventStatusLabel(status: string): string {
  if (status === "Running") return "Ongoing"
  if (status === "Finished") return "Finished"
  return "Planned"  // Lobby + fallback for unknown values
}
```

**Why inline**: The function is only used in `EventBlock.tsx`. It is not exported (no cross-file consumer). Placing it at the bottom of the file alongside the other helpers (`formatEventTimeRange`, `formatEventMomentLabel`) maintains the existing module structure.

### JSX Render — Before

```tsx
<span className="calendar-event-block__moment">{scheduleMoment}</span>
```

### JSX Render — After

```tsx
<span className="calendar-event-block__moment">{statusLabel}</span>
```

### CSS — No Change

`.calendar-event-block__moment` styling is unchanged — it already applies `font-weight: 600` and `color: var(--color-ink-muted)` which renders status labels correctly.

### Backward Compatibility

`formatEventMomentLabel` remains exported at the bottom of `EventBlock.tsx` with no changes. All existing tests that import and call it continue to pass.

---

## Change A-3: PlayerStats court chart Y-axis and size fix

### Constants — Before

```ts
// PlayerStats.tsx lines 264–265
const COURT_W = 340
const COURT_H = 180
```

### Constants — After

```ts
const COURT_W = 420
const COURT_H = 240
```

### Y-axis Derivation — Before

```ts
// PlayerStats.tsx lines 278–279
const maxCourt = Math.max(...data.map((r) => r.avgCourt), 1)
const maxCourtInt = Math.ceil(maxCourt)
```

### Y-axis Derivation — After

```ts
const maxCourt = Math.max(...data.map((r) => r.avgCourt), 1)
const maxCourtInt = Math.max(Math.ceil(maxCourt), 7)
```

**Effect**: `allCourtTicks` (line 297) is `Array.from({ length: maxCourtInt - minCourt + 1 }, ...)` where `minCourt = 1`. With `maxCourtInt` floored at 7, this always generates ticks `[1, 2, 3, 4, 5, 6, 7]` at minimum.

### SVG viewBox — Automatic Update

The `viewBox` at line 311 is `\`0 0 ${COURT_W} ${COURT_H}\`` and the `width`/`height` attributes use the same constants — they update automatically when the constants change.

### `range` Variable — No Change Needed

`range = maxCourtInt - minCourt || 1` at line 282: with `maxCourtInt` floored at 7, `range` becomes `6` for most players (instead of a smaller value). This spreads data points across the full chart height — the intended visual improvement.

### State changes: None. CSS changes: None (SVG is sized by constants, not CSS classes).
