# Data Model: Run Event Fullscreen Mode (045)

**Branch**: `045-run-event-fullscreen`  
**Date**: 2026-03-31

## Overview

This feature introduces no new backend entities, API fields, or database tables. The only new state is a single boolean in the frontend UI layer.

---

## UI State

### `isFullscreen: boolean`

| Property | Value |
|----------|-------|
| Owner | `RunEventPage` component |
| Initial value | `false` |
| Persistence | In-memory only — resets on unmount / navigation |
| Transitions | `false → true`: user clicks toggle button; `true → false`: user clicks toggle again or presses Escape |

**State transitions**:

```
NORMAL ──[click toggle]──► FULLSCREEN
FULLSCREEN ──[click toggle]──► NORMAL
FULLSCREEN ──[press Escape]──► NORMAL
```

Fullscreen state does not interact with any other page state (`roundData`, `modalContext`, `submittedPayloads`, etc.). All other state remains unchanged when entering or exiting fullscreen.

---

## CSS Layer Model

No new data entities, but the overlay introduces a new z-index layer:

| Layer | Class / Element | z-index | Notes |
|-------|----------------|---------|-------|
| Page content | `.shell-content` | 10 | Unchanged |
| Sticky nav | `.card-nav-container` | 20 | Covered by overlay when fullscreen |
| **Fullscreen overlay** | `.run-fullscreen-overlay` | **30** | New — covers nav |
| Result modal | `.result-modal-backdrop` | 40 | Sits above overlay, unchanged |
| Event popup | `.event-popup-backdrop` | 80 | Not present on RunEvent page |
| User menu | `.user-menu__dropdown` | 9999 | Unchanged |

---

## Scoped CSS Overrides (inside `.run-fullscreen-overlay`)

These are not new data but define the fullscreen visual contract — documented here for implementation reference.

| Selector | Property | Normal value | Fullscreen value |
|----------|----------|--------------|-----------------|
| `.court-card` | `min-height` | `260px` | `360px` |
| `.team-player-name` | `font-size` | `0.875rem` | `1.1rem` |
| `.team-result-badge` | `font-size` | `0.82rem` | `1.05rem` |
| `.team-result-badge` | `min-width` | `2.2rem` | `2.8rem` |
| `.team-result-badge` | `padding` | `0.2rem 0.5rem` | `0.35rem 0.7rem` |
| `.team-grouping` | `min-height` | `4.1rem` | `5.5rem` |
| `.team-grouping` | `padding` | `0.6rem 0.75rem` | `0.85rem 1rem` |
| `.court-fire-icon`, `.court-snowflake-icon` | `height` / `width` | `0.95rem` | `1.2rem` |
| `.grid-columns-2` | `grid-template-columns` min | `280px` | `360px` |
| `.run-fullscreen-overlay` itself | `position` | — | `fixed` |
| `.run-fullscreen-overlay` itself | `inset` | — | `0` |
| `.run-fullscreen-overlay` itself | `z-index` | — | `30` |
| `.run-fullscreen-overlay` itself | `overflow-y` | — | `auto` |
| `.run-fullscreen-overlay` itself | `background` | — | `var(--color-bg)` |
| `.run-fullscreen-overlay` itself | `display` | — | `flex` |
| `.run-fullscreen-overlay` itself | `flex-direction` | — | `column` |
| `.run-fullscreen-overlay` itself | `gap` | — | `var(--space-4)` |
| `.run-fullscreen-overlay` itself | `padding` | — | `var(--space-4)` |
