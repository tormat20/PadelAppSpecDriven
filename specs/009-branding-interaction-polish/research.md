# Phase 0 Research: Branding and Interaction Polish

## Decision: Use the existing Molndal logo asset path as the primary mark source
- **Decision**: Use `images/logos/Molndal-padel-bg-removed.png` as the default brand mark for the header logo button.
- **Rationale**: The feature request explicitly names this asset and aligning with that path removes ambiguity in branding acceptance.
- **Alternatives considered**:
  - Continue using the existing logo-mark asset already wired in UI.
  - Use an SVG-only source and ignore PNG.

## Decision: Keep a single circular logo button that can host mark + optional text
- **Decision**: Define logo button layout as one circular container that includes centered mark and optional text region.
- **Rationale**: Satisfies the desired “encapsulate both mark and text” behavior while preserving a recognizable button silhouette.
- **Alternatives considered**:
  - Split text outside the circular button.
  - Keep mark-only button with no optional text support.

## Decision: Responsive logo text policy
- **Decision**: Show optional logo text on larger viewports and hide on small/mobile while preserving centered mark.
- **Rationale**: Balances branding presence with readability and space constraints on compact layouts.
- **Alternatives considered**:
  - Always show text on all viewports.
  - Never show text (mark-only experience).

## Decision: Interaction language applies to all clickable UI elements
- **Decision**: Scope edge definition, hover glow, and pointer-proximity styling to all clickable elements in the app.
- **Rationale**: User clarification explicitly expanded scope to all clickable controls for consistency.
- **Alternatives considered**:
  - Restrict to core host-flow controls only.
  - Restrict to primary CTA controls only.

## Decision: Disabled-state interaction behavior
- **Decision**: Disabled clickable elements keep static disabled styling and do not receive hover/proximity effects.
- **Rationale**: Prevents false affordance and improves clarity of non-interactive states.
- **Alternatives considered**:
  - Apply full effects to disabled elements.
  - Remove all styling from disabled controls.

## Decision: Reduced-motion behavior
- **Decision**: Disable animated pointer-proximity effects when reduced-motion preference is active; preserve static edge/glow/focus cues.
- **Rationale**: Supports accessibility needs without losing interaction discoverability.
- **Alternatives considered**:
  - Keep full motion effects for all users.
  - Disable all interaction polish when reduced motion is requested.

## Decision: Reuse existing interaction references from in-repo examples
- **Decision**: Use `.example` MagicBento/GlareHover behavior as interaction reference and adapt into current app style architecture.
- **Rationale**: Keeps behavior aligned with requested visual direction while fitting current codebase patterns.
- **Alternatives considered**:
  - Build new unrelated interaction model from scratch.
  - Copy reference components verbatim without adaptation.

## Decision: Validation strategy is frontend-first and behavior-driven
- **Decision**: Validate with frontend tests plus manual hover/focus/touch/reduced-motion walkthrough checks.
- **Rationale**: Feature has UI/UX focus and no backend contract changes.
- **Alternatives considered**:
  - Rely on manual QA only.
  - Backend-centric testing despite no backend scope.
