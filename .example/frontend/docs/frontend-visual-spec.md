# Frontend Visual Spec

## Chosen Model
Use **CUBE CSS + Z-Layer Scale**.

### Why this model
- Keep styles readable and predictable for a small product team.
- Keep layout composition separate from component styling.
- Keep exceptional one-off overrides explicit.
- Prevent visual bugs from random `z-index` values.

## CUBE Rules

### Composition
- Build page layout using composition classes (grids, flow, wrappers).
- Keep composition classes free of colors and cosmetic details.

### Utility
- Use small utilities for single-purpose behavior (spacing, alignment, visibility).
- Keep utilities low-specificity and reusable.

### Block
- Build each UI component as a block (`topbar`, `court-card`, `score-modal`, etc.).
- Keep block internals scoped with clear class naming.

### Exception
- Handle one-off case styling explicitly (example: mode-specific badge, disabled court chip).
- Avoid hidden hacks or deep selector overrides.

## Z-Layer Contract

Use only these stack levels:

- `--z-bg: 0` -> animated backgrounds (Aurora)
- `--z-content: 10` -> default app content
- `--z-sticky: 20` -> sticky bars/status
- `--z-overlay: 40` -> modals/popovers

Rules:
- Do not use negative `z-index` for core visuals.
- Background layers must use `pointer-events: none`.
- Modals and overlays must always use `--z-overlay`.

## Surface/Background Guidance

- Keep body background neutral and simple.
- Let Aurora provide atmosphere.
- Use translucent panels (`rgba`) so background motion remains visible.
- Avoid heavy opaque blocks that fully hide global background effects.

## Logo + Effects Guidance

- Apply glare effects to the true logo shape container, not to padded rectangular wrappers.
- Use circular mask containers for circular marks.
- Keep hover effects subtle and non-blocking.

## Court Board Guidance

- Court visuals are shared across all game modes.
- Display first names on chips for readability.
- Keep full names available in `title`/tooltip for disambiguation.
- Keep chip positions and size defined by a single source of truth in CSS.
