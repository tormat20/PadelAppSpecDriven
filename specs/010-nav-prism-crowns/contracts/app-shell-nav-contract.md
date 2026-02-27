# Contract: App Shell Top Navigation

## Purpose

Define externally visible expectations for the new full-width top navigation shell and image-only logo home button behavior.

## Layout Contract

1. App shell renders a top navigation container that spans full viewport width on every route.
2. Existing page content layout remains below top navigation without loss of readability or access.
3. Top navigation includes placeholder region(s) reserved for future controls.

## Logo Button Contract

1. Logo home button remains interactive and continues home navigation behavior.
2. Logo button displays only `images/logos/Molndal-padel-bg-removed.png` with no text label.
3. Logo image centerpoint aligns with circular button centerpoint on both axes.
4. Keyboard focus indicators remain visible and usable.

## Failure/Fallback Contract

1. If logo asset fails to load, button remains visible, focusable, and operable.

## Verification Targets

- UI/component tests for top-nav presence and logo button rendering behavior.
- Accessibility checks for keyboard focus and activation.
