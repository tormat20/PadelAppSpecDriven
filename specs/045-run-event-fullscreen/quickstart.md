# Quickstart: Implementing Run Event Fullscreen Mode (045)

**Branch**: `045-run-event-fullscreen`  
**Prerequisite**: Branch `043-run-event-ui-polish` must be merged into `dev` and this branch rebased/merged from `dev` before implementation starts.  
**Date**: 2026-03-31

---

## Prerequisites check

```bash
# Verify you are on the correct branch
git branch --show-current
# Expected: 045-run-event-fullscreen

# Verify 043 changes are present (run-grid__round-header must exist)
grep -n "run-grid__round-header" frontend/src/pages/RunEvent.tsx
# Expected: at least one match showing the div in the JSX

# Verify dev server runs
cd frontend && npm run dev
```

---

## Files to change

| File | Change type |
|------|-------------|
| `frontend/src/pages/RunEvent.tsx` | Add state, ref, useEffect, toggle button, overlay wrapper |
| `frontend/src/styles/components.css` | Add `.run-fullscreen-overlay` rules after `.run-grid` block (~line 614) |
| `frontend/tests/run-event-fullscreen.test.tsx` | New test file |

---

## Implementation steps

### Step 1 — Add state and ref to RunEventPage

In `frontend/src/pages/RunEvent.tsx`, after the existing `useState` declarations (around line 150):

```tsx
const [isFullscreen, setIsFullscreen] = useState(false)
const fullscreenOverlayRef = useRef<HTMLDivElement>(null)
```

### Step 2 — Add Escape key handler

After the `isFullscreen` state declaration, add a `useEffect`:

```tsx
useEffect(() => {
  if (!isFullscreen) return
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setIsFullscreen(false)
  }
  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [isFullscreen])
```

### Step 3 — Add scroll-to-top on fullscreen enter

```tsx
useEffect(() => {
  if (isFullscreen) {
    fullscreenOverlayRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }
}, [isFullscreen])
```

### Step 4 — Add toggle button in run-grid__round-header

Inside the `run-grid__round-header` div (added by branch 043), add the button:

```tsx
<div className="run-grid__round-header">
  <div className="run-grid__round-header-left">
    <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
    {roundStepperProps && (
      <Stepper ...>
        <></>
      </Stepper>
    )}
  </div>
  <button
    type="button"
    className={withInteractiveSurface("button-secondary")}
    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    onClick={() => setIsFullscreen((v) => !v)}
  >
    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
  </button>
</div>
```

Update `.run-grid__round-header` CSS to use row layout:

```css
.run-grid__round-header {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
  justify-content: space-between;
}

.run-grid__round-header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

### Step 5 — Wrap panels in fullscreen overlay

In the JSX return, replace the two standalone sections with conditional wrapping:

```tsx
const courtContent = (
  <>
    <section className="panel run-grid">
      ...
    </section>
    <section className="panel grid-columns-2">
      ...
    </section>
  </>
)

return (
  <section className="page-shell" aria-label="Run event page">
    {isFullscreen ? (
      <div className="run-fullscreen-overlay" ref={fullscreenOverlayRef}>
        {courtContent}
      </div>
    ) : (
      courtContent
    )}
    <ResultModal ... />
    ...
  </section>
)
```

### Step 6 — Add CSS rules

In `frontend/src/styles/components.css`, after the `.run-grid` block (near line 614), add:

```css
/* ── Fullscreen overlay — Run Event ──────────────────────────────── */

.run-fullscreen-overlay {
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  inset: 0;
  overflow-y: auto;
  padding: var(--space-4);
  position: fixed;
  z-index: 30;
}

.run-fullscreen-overlay .court-card {
  min-height: 360px;
}

.run-fullscreen-overlay .team-grouping {
  min-height: 5.5rem;
  padding: 0.85rem 1rem;
}

.run-fullscreen-overlay .team-player-name {
  font-size: 1.1rem;
}

.run-fullscreen-overlay .team-result-badge {
  font-size: 1.05rem;
  min-width: 2.8rem;
  padding: 0.35rem 0.7rem;
}

.run-fullscreen-overlay .court-fire-icon,
.run-fullscreen-overlay .court-snowflake-icon {
  height: 1.2rem;
  width: 1.2rem;
}

.run-fullscreen-overlay .grid-columns-2 {
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
}
```

---

## Verification

```bash
# Lint
cd frontend && npm run lint

# Full test suite
cd frontend && npm test

# Targeted test
cd frontend && npm test -- --run tests/run-event-fullscreen.test.tsx
```

Manual verification checklist:
1. Open a running event → fullscreen button is visible in the round header
2. Click Fullscreen → nav disappears, courts fill the viewport, button reads "Exit Fullscreen"
3. Court cards are taller, player names are larger, score badges are larger
4. Click a team grouping → result modal opens on top of the fullscreen view
5. Submit a result → result badge appears, modal closes, fullscreen stays active
6. Click Next Round → round advances, page scrolls to top, stays fullscreen
7. Press Escape → fullscreen exits, nav reappears
8. Click Exit Fullscreen → same result as Escape
