# Contract: Global Prism Background

## Purpose

Specify global background behavior expectations for prism rendering across routes.

## Rendering Contract

1. Existing static light-rays background is replaced by the provided prism implementation behavior.
2. Prism background is present on all app routes via app shell.
3. Background layer is rendered behind interactive content and does not intercept user input.

## Motion Accessibility Contract

1. Reduced-motion preference reduces or disables prism animation.
2. Reduced-motion mode retains a coherent non-disruptive visual background.

## Performance Contract

1. Background must not introduce obvious interaction lag in typical desktop/mobile usage.
2. If runtime constraints prevent full animation fidelity, rendering falls back to a stable non-blocking visual.

## Verification Targets

- Route-level rendering checks for global background presence.
- Reduced-motion behavior tests.
- Manual interaction smoke checks to confirm content remains interactive.
