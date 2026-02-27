# Feature Specification: Branding and Interaction Polish

**Feature Branch**: `001-branding-interaction-polish`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Spec B: Branding and interaction polish. Replace current logo-mark with Molndal logo image from images/logos/Molndal-padel-bg-removed.png. Redesign logo-button so it encloses both circular logo-mark and optional logo-text under the mark inside the same circular button, with mark centered in x/y. Apply MagicBento-style interaction language to clickable controls: visible edge definition, hover border glow, and cursor-proximity highlight while hovering. Preserve keyboard focus accessibility and mobile behavior."

## Clarifications

### Session 2026-02-27

- Q: Which controls are in scope for the shared interaction pattern? → A: All clickable elements in the app.
- Q: How should optional logo text behave across viewport sizes? → A: Show on larger viewports, hide on small/mobile while keeping centered mark.
- Q: Should disabled clickable elements show hover/proximity effects? → A: No, only enabled elements get full effects; disabled elements keep static edge style.
- Q: How should reduced-motion preference affect pointer-proximity effects? → A: Disable pointer-proximity animation while keeping static edge/glow/focus cues.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Branded Logo Button (Priority: P1)

As a host, I want the top logo button to use the Molndal brand mark and show a cohesive circular logo unit so the product instantly feels tied to the venue identity.

**Why this priority**: Branding is the first visual anchor in every screen and has the highest impact on perceived polish.

**Independent Test**: Open the app shell and verify the logo button shows the designated Molndal mark, keeps the mark centered, and can optionally show supporting logo text inside the same button shape.

**Acceptance Scenarios**:

1. **Given** the app header is visible, **When** the logo button is rendered, **Then** it uses the designated Molndal logo mark asset instead of the prior mark.
2. **Given** the logo button is rendered with supporting logo text enabled, **When** the host views the header, **Then** both mark and text are contained inside one circular logo button with the mark centered on both axes.
3. **Given** a small or mobile viewport, **When** the header renders, **Then** optional logo text can be hidden while the logo mark remains centered in the circular button.

---

### User Story 2 - Interactive Surface Language (Priority: P2)

As a host, I want clickable controls to share a clear visual interaction style (edge, glow, cursor-proximity response) so actions feel intentional and easier to discover.

**Why this priority**: A consistent interaction system improves clarity and confidence across menus, courts, and action buttons.

**Independent Test**: Hover key interactive controls and verify each eligible control shows visible edge definition, hover border glow, and localized pointer-proximity highlight behavior.

**Acceptance Scenarios**:

1. **Given** a hover-capable device, **When** a host hovers interactive controls, **Then** controls show the shared glow-edge interaction style inspired by the established bento interaction language.
2. **Given** pointer movement across a control surface, **When** the pointer changes position, **Then** highlight intensity and position update to reflect pointer proximity within that control.

---

### User Story 3 - Accessible and Mobile-Safe Interaction (Priority: P3)

As a host, I want the polished interactions to remain accessible by keyboard and usable on touch devices so visual upgrades do not reduce usability.

**Why this priority**: Visual polish must not regress accessibility or mobile behavior.

**Independent Test**: Navigate interactive controls with keyboard and on mobile viewport/touch simulation, confirming visible focus states and graceful behavior where hover is unavailable.

**Acceptance Scenarios**:

1. **Given** keyboard navigation is used, **When** focus moves through interactive controls, **Then** each focusable control shows clear focus indication independent of hover effects.
2. **Given** a mobile or touch-first environment, **When** interactive controls are used, **Then** controls remain readable, tappable, and functional without requiring hover.

---

### Edge Cases

- Logo mark asset unavailable at runtime: interface falls back to an accessible textual/shape-safe logo presentation without breaking header layout.
- Supporting logo text omitted: logo button still preserves balanced circular composition with centered mark.
- Supporting logo text hidden on small/mobile viewports: logo mark remains centered and touch target remains intact.
- Controls in dense layouts (small cards or narrow viewport): glow and highlight do not obscure labels or reduce readability.
- Touch-only devices: absence of hover does not hide critical affordance cues.
- Keyboard-only navigation: focus states remain clearly visible even when pointer effects are not active.
- Reduced-motion preference active: animated pointer-proximity effects are disabled while static affordance and focus cues remain visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST replace the current header logo mark with the designated Molndal logo mark asset.
- **FR-002**: The logo button MUST present a single circular container that can include both logo mark and optional supporting logo text inside the same button boundary.
- **FR-003**: The logo mark MUST remain visually centered on horizontal and vertical axes within the logo button regardless of whether supporting text is shown.
- **FR-003a**: Optional logo text MUST be shown on larger viewports and MAY be hidden on small/mobile viewports while preserving centered logo mark alignment.
- **FR-004**: Eligible interactive controls MUST expose visible edge definition in resting state so actionable surfaces are clearly identifiable.
- **FR-005**: Eligible interactive controls MUST show a hover border-glow response on hover-capable devices.
- **FR-006**: Eligible interactive controls MUST provide pointer-proximity highlight behavior that responds to pointer position within the control surface.
- **FR-006a**: Disabled clickable elements MUST NOT show hover/proximity interaction effects and MUST keep a clear static disabled visual state.
- **FR-007**: The interaction language MUST be applied consistently across all clickable elements in the app.
- **FR-008**: Keyboard navigation MUST retain clear focus indication that remains visible when hover effects are absent.
- **FR-009**: Mobile and touch usage MUST remain fully functional and readable without reliance on hover-only feedback.
- **FR-010**: Visual interaction polish MUST not reduce legibility of control labels or state text.
- **FR-011**: When reduced-motion preference is active, animated pointer-proximity effects MUST be disabled while static edge/glow affordances and focus visibility remain present.

### Key Entities *(include if feature involves data)*

- **Logo Button Presentation**: Branded header control containing a circular boundary, centered logo mark, optional supporting text, and interaction states.
- **Interactive Surface Pattern**: Shared visual behavior definition for clickable controls, including edge visibility, hover glow, pointer-proximity highlight, and focus treatment.
- **Control Eligibility Set**: The set of all clickable UI elements that must adopt the shared interaction pattern to ensure consistency.


### Assumptions

- The designated Molndal logo mark asset is available and approved for product use.
- Supporting logo text is configurable and may be omitted in space-constrained contexts while preserving centered mark alignment.
- Pointer-proximity effects apply where pointer input exists and degrade gracefully on touch-only devices.
- Reduced-motion preference is respected by disabling animated pointer-proximity effects while retaining static interaction cues.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In visual QA, 100% of header states show the designated Molndal mark and maintain centered mark alignment in the circular logo button.
- **SC-002**: In interaction QA on hover-capable devices, 100% of controls in the defined eligibility set display edge definition, hover glow, and pointer-proximity response.
- **SC-003**: In keyboard QA, 100% of focusable controls in the defined eligibility set show visible focus state without pointer input.
- **SC-004**: In mobile QA, 100% of tested interactive controls remain tappable, readable, and functional without hover.
- **SC-005**: In reduced-motion QA, 100% of tested controls disable animated pointer-proximity behavior while retaining visible static affordance and focus cues.
