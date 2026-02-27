# Contract: Interactive Surface Language

## Purpose

Define behavior consistency for clickable controls across the host UI.

## Scope Contract

1. All clickable UI elements are in scope for shared interaction styling.
2. Shared behavior includes visible edge definition, hover border glow (hover-capable devices), and pointer-proximity highlight (when enabled).

## State Contract

1. Enabled controls present resting edge affordance and transition to hover/proximity states when pointer interaction is available.
2. Disabled controls keep static disabled visuals and MUST NOT trigger hover/proximity effects.
3. Keyboard navigation must show clear focus-visible indication on interactive controls.

## Motion Contract

1. When reduced-motion preference is active, animated pointer-proximity effects are disabled.
2. Disabling motion must not remove static affordance and focus visibility.

## Readability Contract

1. Glow/proximity treatment must not reduce readability of labels and state text.
2. Touch-only environments must remain fully usable without hover dependencies.

## Verification Targets

- Frontend tests for interaction helper behavior and focus/readability regressions.
- Manual QA for hover-capable, touch-only, and reduced-motion environments.

## Verification Log

- [X] Shared interactive surface helper coverage in `frontend/tests/interactive-surface-pattern.test.tsx`.
- [X] Reduced-motion and disabled-state behavior coverage in `frontend/tests/reduced-motion-interaction.test.tsx` and `frontend/tests/interaction-disabled-state.test.tsx`.
- [X] Cross-page interaction class regression coverage in `frontend/tests/clickable-controls-interaction-regression.test.tsx`.
