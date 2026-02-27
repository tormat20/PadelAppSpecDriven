# Contract: Logo Button Presentation

## Purpose

Define externally visible expectations for branded header logo button rendering and behavior.

## Visual Contract

1. Header logo button uses `images/logos/Molndal-padel-bg-removed.png` as the primary mark asset.
2. Logo button remains a single circular container.
3. Logo mark stays centered on horizontal and vertical axes within the circular container.
4. Optional logo text may be shown inside the same circular container on larger viewports.
5. Optional logo text may be hidden on small/mobile viewports while preserving centered mark and stable button shape.

## Interaction Contract

1. Logo button follows shared clickable interaction language for edge visibility, hover glow, and pointer-proximity response (when enabled).
2. Keyboard focus state remains visible independent of hover/pointer behavior.
3. Reduced-motion preference disables animated pointer-proximity behavior while retaining static affordance cues.

## Failure/Fallback Contract

1. If logo mark asset cannot be loaded, header remains layout-stable and presents an accessible fallback presentation.

## Verification Targets

- Component/UI tests for centered mark behavior and responsive text visibility.
- Manual visual checks for desktop, mobile, keyboard focus, and reduced-motion scenarios.

## Verification Log

- [X] Molndal logo asset path wired to logo button (`frontend/src/components/branding/LogoButton.tsx`).
- [X] Responsive text behavior validated by tests in `frontend/tests/logo-button-responsive-text.test.tsx`.
- [X] Logo branding checks validated by tests in `frontend/tests/logo-button-branding.test.tsx`.
