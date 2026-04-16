# UI Behaviour Contract: Run Event Fullscreen Mode

**Feature**: 045-run-event-fullscreen  
**Date**: 2026-03-31  
**Type**: Frontend UI contract

---

## Toggle Button

| Property | Value |
|----------|-------|
| Location | Inside `.run-grid__round-header` (rightmost, pushed by `justify-content: space-between`) |
| Label (normal mode) | "Fullscreen" |
| Label (fullscreen mode) | "Exit Fullscreen" |
| CSS class | `button-secondary` with `withInteractiveSurface` wrapper (matches other RunEvent secondary buttons) |
| `aria-label` (normal) | `"Enter fullscreen"` |
| `aria-label` (fullscreen) | `"Exit fullscreen"` |
| Keyboard | Activatable via Enter / Space (default button behaviour) |

---

## Fullscreen Overlay

| Property | Value |
|----------|-------|
| Element | `<div className="run-fullscreen-overlay">` |
| Rendered | Only when `isFullscreen === true` |
| Contents | `<section className="panel run-grid">` + `<section className="panel grid-columns-2">` |
| What is excluded | Navigation bar, Substitute Player panel, InlineSummaryPanel, warning banners |
| Scroll behaviour | `overflow-y: auto` — the overlay is independently scrollable |
| Scroll on enter | Scrolls to `scrollTop: 0` immediately on entering fullscreen |

---

## Keyboard Shortcuts

| Key | Condition | Effect |
|-----|-----------|--------|
| `Escape` | `isFullscreen === true` AND result modal is closed | Exit fullscreen |
| `Escape` | Result modal is open | Close result modal (modal's own handler — fullscreen state unchanged) |

---

## Result Modal Interaction

The result entry modal (`ResultModal`) renders outside the fullscreen overlay div (it is a sibling at the bottom of the `RunEventPage` return). Its backdrop uses `position: fixed; z-index: 40`, which is above the overlay's `z-index: 30`. No changes to the modal are required. The modal opens, accepts input, and submits results identically in both normal and fullscreen modes.

---

## Rendering in Normal Mode (isFullscreen === false)

```
<section className="page-shell">
  [page-header panel — removed by branch 043]
  <section className="panel run-grid">          ← normal flow
    <div className="run-grid__round-header">
      <h2>Run Event - Round N</h2>
      [optional Stepper]
      <button aria-label="Enter fullscreen">Fullscreen</button>
    </div>
    <CourtGrid />
  </section>
  <ResultModal />                               ← fixed, z-index 40
  <section className="panel grid-columns-2">   ← normal flow
    [Prev/Next/Summary/Finish buttons]
  </section>
  [InlineSummaryPanel, SubstituteModal, etc.]
</section>
```

---

## Rendering in Fullscreen Mode (isFullscreen === true)

```
<section className="page-shell">
  <div className="run-fullscreen-overlay">      ← position: fixed; inset: 0; z-index: 30
    <section className="panel run-grid">
      <div className="run-grid__round-header">
        <h2>Run Event - Round N</h2>
        [optional Stepper]
        <button aria-label="Exit fullscreen">Exit Fullscreen</button>
      </div>
      <CourtGrid />                             ← enlarged via CSS overrides
    </section>
    <section className="panel grid-columns-2"> ← action buttons
      [Prev/Next/Summary/Finish buttons]
    </section>
  </div>
  <ResultModal />                               ← position: fixed; z-index: 40 (above overlay)
  [InlineSummaryPanel, SubstituteModal — not inside overlay, visually behind it]
</section>
```

---

## CSS Specificity

All fullscreen overrides use the `.run-fullscreen-overlay .target-class` two-class pattern. This gives specificity (0,2,0) which outranks the single-class rules (0,1,0) used in normal mode. No `!important` is needed.
