# Research: Run Event Fullscreen Mode (045)

**Branch**: `045-run-event-fullscreen`  
**Phase**: 0 — Outline & Research  
**Date**: 2026-03-31

## Summary

All unknowns resolved from direct codebase inspection. No external research required. All decisions documented below.

---

## Decision 1: Fullscreen overlay strategy

**Decision**: CSS `position: fixed; inset: 0; z-index: 30` overlay div wrapping the court grid section + action panel section.

**Rationale**:
- The spec explicitly requires CSS-only approach (no browser Fullscreen API, no permissions needed).
- The sticky nav (`.card-nav-container`) is `position: sticky; z-index: 20`. A `position: fixed; z-index: 30` overlay naturally covers it.
- The `ResultModal` backdrop is `position: fixed; z-index: 40` — it sits above the overlay (z-index 30) without any changes.
- The `SubstituteModal` and other modals also use fixed positioning and will layer above the overlay correctly.

**Alternatives considered**:
- Browser Fullscreen API (`document.documentElement.requestFullscreen`): rejected per FR-013 — requires user permission prompt and behaves inconsistently across browsers.
- `position: absolute` with a large top offset: does not cover a sticky nav; rejected.

---

## Decision 2: Toggle button placement and icon

**Decision**: Place a text-based toggle button ("Fullscreen" / "Exit Fullscreen") in the `run-grid__round-header` div introduced by branch 043. Use plain text labels — no SVG icon needed.

**Rationale**:
- Only two SVG icons exist in `frontend/public/images/icons/`: `fire.svg` and `snowflake.svg`. No expand/compress icon is available.
- Adding a new SVG icon is out of scope for this feature.
- Plain text "Fullscreen" / "Exit Fullscreen" with a secondary-button style is legible and consistent with other RunEvent action buttons.
- The `run-grid__round-header` element is added by branch 043 (prerequisite). The button goes on the right side of the header using `justify-content: space-between` on the header flex container.

**Alternatives considered**:
- Unicode expand character (⛶ or ⤢): inconsistent rendering across OSes; rejected.
- Adding a new SVG: out of scope; rejected.

---

## Decision 3: What goes inside the fullscreen overlay

**Decision**: Wrap exactly two sections inside the overlay when `isFullscreen` is true:
1. `<section className="panel run-grid">` — the court grid (contains CourtGrid + round header)
2. `<section className="panel grid-columns-2">` — the action panel (Prev/Next, View Summary, Finish Event)

**What stays OUTSIDE the overlay (hidden behind it)**:
- `<header className="page-header panel">` — removed entirely by branch 043 prerequisite
- `<section className="panel">` (Substitute Player button) — deliberately excluded; out of scope for fullscreen
- `InlineSummaryPanel` — excluded; not relevant to the court display use case
- Warning banners — excluded; they are transient and low priority

**Rationale**: Keeping the overlay minimal ensures it is fast to enter/exit and avoids DOM restructuring. The `ResultModal` is rendered at the bottom of the `RunEventPage` return, outside any panel section — it stays outside the overlay and layers above it via its own `z-index: 40`.

**Alternatives considered**:
- Wrapping the entire `page-shell` and hiding nav: would require CSS on the nav component itself, violating the "no other page affected" constraint; rejected.
- Including InlineSummaryPanel in fullscreen: adds complexity without clear value; deferred.

---

## Decision 4: Fullscreen state — in-component useState

**Decision**: `const [isFullscreen, setIsFullscreen] = useState(false)` in `RunEventPage`. Not persisted, not in a context, not in URL params.

**Rationale**:
- The spec states fullscreen resets on navigation — local state is correct.
- No other component needs to read the fullscreen state.
- Consistent with how `showInlineSummary` is managed in the same file.

---

## Decision 5: Escape key handling

**Decision**: A single `useEffect` adds a `keydown` listener to `window` that calls `setIsFullscreen(false)` when `key === "Escape"` and `isFullscreen` is true. The effect depends on `[isFullscreen]` and removes the listener on cleanup.

**Escape key priority**: The `ResultModal` calls `onClose` on its own Escape keydown via an internal handler. Since the modal is rendered in the DOM when open, its handler fires first (event bubbles up). The window-level fullscreen handler will also fire, but setting `isFullscreen(false)` when a modal is open is harmless — the overlay is behind the modal anyway and the modal dismisses first. On the next Escape press (modal now closed, overlay visible), fullscreen exits.

**Alternatives considered**:
- Checking `modalContext !== null` before exiting fullscreen: prevents double-escape behaviour but adds coupling; accepted as a simple guard if needed during implementation.

---

## Decision 6: Scroll-to-top on enter

**Decision**: Use a `ref` on the fullscreen overlay `div` and call `overlayRef.current?.scrollTo({ top: 0, behavior: "instant" })` inside a `useEffect` that fires when `isFullscreen` becomes `true`.

**Rationale**: The spec requires scroll-to-top on enter (FR-014). Using a ref is the standard React pattern; `behavior: "instant"` avoids an animated scroll that could feel odd during a layout transition.

---

## Decision 7: CSS scaling values — confirmed against source

All scaling values were verified by reading `frontend/src/styles/components.css` directly:

| Property | Normal mode | Fullscreen mode | Source line |
|----------|-------------|-----------------|-------------|
| `.court-card` min-height | `260px` | `360px` (+38%) | CSS line 626 |
| `.team-player-name` font-size | `0.875rem` | `1.1rem` (+26%) | CSS line 738 |
| `.team-result-badge` font-size | `0.82rem` | `1.05rem` (+28%) | CSS line 748 |
| `.team-result-badge` min-width | `2.2rem` | `2.8rem` | CSS line 752 |
| `.team-result-badge` padding | `0.2rem 0.5rem` | `0.35rem 0.7rem` | CSS line 753 |
| `.team-grouping` min-height | `4.1rem` | `5.5rem` (+34%) | CSS line 720 |
| `.team-grouping` padding | `0.6rem 0.75rem` | `0.85rem 1rem` | CSS line 722 |
| `.court-fire-icon` / `.court-snowflake-icon` size | `0.95rem` | `1.2rem` (+26%) | CSS line 1791 |
| `.grid-columns-2` min col width | `280px` | `360px` (+29%) | layout.css line 76 |

All SC-002 target (≥25% larger font) is met by `team-player-name`: 0.875 → 1.1rem = +25.7%.

---

## Decision 8: run-grid__round-header layout for toggle button

**Decision**: Change the round header CSS from `flex-direction: column` to `flex-direction: row; justify-content: space-between; align-items: center` when the fullscreen button is present.

**Rationale**: The round title and stepper stack vertically (column) in normal flow. Adding a button on the right requires switching to a row layout so the button can be pushed to the far right. The stepper can be placed in a sub-div if needed to preserve its vertical stack relative to the title.

**Alternative**: Keep column layout and position the button absolutely. Rejected — absolute positioning is fragile and the spec says to avoid inline styles except dynamic positioning.

---

## Open Questions — None

All NEEDS CLARIFICATION items resolved. No blockers.
