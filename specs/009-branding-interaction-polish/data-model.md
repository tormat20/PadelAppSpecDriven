# Data Model: Branding and Interaction Polish

## Entities

### 1) LogoButtonPresentation
- **Purpose**: Represents the branded header logo button state and visual composition.
- **Fields**:
  - `assetPath`: source path for logo mark image
  - `isTextEnabled`: whether optional supporting text is configured
  - `isSmallViewport`: viewport condition used for responsive text hiding
  - `markCentering`: horizontal/vertical centering invariant for mark
  - `interactionState`: resting, hover, active, focus-visible, disabled
- **Validation rules**:
  - `assetPath` must resolve to designated logo asset.
  - Mark remains centered regardless of text visibility.
  - On small viewports, text may be hidden without changing mark centering.

### 2) InteractiveSurfacePattern
- **Purpose**: Shared interaction behavior model for clickable elements.
- **Fields**:
  - `edgeVisible`: baseline edge/border affordance
  - `hoverGlowEnabled`: hover glow behavior on hover-capable devices
  - `proximityHighlightEnabled`: pointer-proximity highlight behavior
  - `focusVisibleEnabled`: keyboard-visible focus affordance
  - `disabledInteractionPolicy`: static disabled style with no hover/proximity
  - `reducedMotionPolicy`: proximity animation disabled when reduced-motion active
- **Validation rules**:
  - Enabled clickable controls expose edge + hover/proximity behavior.
  - Disabled controls cannot trigger hover/proximity effects.
  - Reduced-motion preference disables animated proximity effects.

### 3) ControlEligibilitySet
- **Purpose**: Enumerates app-wide clickable elements that must adopt shared pattern.
- **Fields**:
  - `controlId`
  - `controlType` (button, card, list item, logo button, etc.)
  - `isClickable`
  - `isDisabled`
  - `supportsPointer`
- **Validation rules**:
  - Every clickable element is covered by the shared interaction pattern.
  - Disabled and reduced-motion behavior policies are enforced per control state.

## Relationships

- `ControlEligibilitySet` entries map to `InteractiveSurfacePattern` behavior rules.
- `LogoButtonPresentation` is a specialized clickable element that also inherits `InteractiveSurfacePattern` rules.

## State Transitions

### Interactive control state flow
1. `resting`
2. `hover` (if pointer available and enabled)
3. `active`
4. `focus-visible` (keyboard navigation)
5. `disabled` (static, no hover/proximity)

### Motion preference override
1. `motion-default`
2. `reduced-motion-active`
3. `proximity-animation-disabled`
4. `static-affordance-retained`
