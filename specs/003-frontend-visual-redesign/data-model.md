# Data Model: Frontend Visual Redesign

## Overview

This feature does not introduce new backend domain entities. The model below defines UI-level entities needed to plan implementation, validation, and non-regression checks.

## Entities

### 1) VisualFoundation
- **Purpose**: Shared design primitives applied across all primary pages.
- **Fields**:
  - `colorTokens`: semantic color set for surfaces, text, accents, borders, states
  - `typographyScale`: heading/body/label size and weight mapping
  - `spacingScale`: standardized spacing steps
  - `radiusScale`: corner radius tokens
  - `layerScale`: z-layer contract for background/content/sticky/overlay
  - `motionTokens`: duration/easing tiers and reduced-motion behavior flags
- **Validation rules**:
  - Must support contrast-compliant text/background pairings for primary controls.
  - Must define deterministic layer order to avoid ad-hoc stacking conflicts.

### 2) AppShellPresentation
- **Purpose**: Shared shell frame for branding, atmospheric background, and content container behavior.
- **Fields**:
  - `headerPattern`: logo/branding placement and responsive behavior
  - `backgroundMode`: atmospheric effect mode + static fallback
  - `contentFrame`: max-width, padding, and breakpoints
  - `focusVisibilityPolicy`: focus ring and keyboard navigation visibility rules
- **Relationships**:
  - Composes `VisualFoundation`.
  - Applied by all `PagePresentation` entities.

### 3) PagePresentation
- **Purpose**: Visual implementation slice for each primary route page.
- **Fields**:
  - `pageId`: `home | create-event | preview-event | run-event | summary`
  - `layoutPattern`: section arrangement and responsive stacking rules
  - `componentStates`: normal/hover/focus/disabled/loading/error/empty visuals
  - `motionProfile`: entrance/transition behavior and reduced-motion fallback
- **Validation rules**:
  - Required controls remain visible and actionable at desktop and mobile widths.
  - No horizontal overflow in default state for primary workflows.
- **Relationships**:
  - Uses `VisualFoundation`.
  - Rendered within `AppShellPresentation`.

### 4) WorkflowParityCheck
- **Purpose**: Defines non-regression verification for existing host workflows.
- **Fields**:
  - `workflowName`: create, preview, run, summary
  - `baselineOutcome`: expected outcome from pre-redesign behavior
  - `postRedesignOutcome`: observed outcome after redesign
  - `status`: pass/fail
  - `notes`: discrepancy notes if any
- **Validation rules**:
  - `baselineOutcome` must equal `postRedesignOutcome` unless approved bug-fix exception exists.

### 5) QualityGateResult
- **Purpose**: Stores measurable pass/fail outcomes for cross-browser, performance, accessibility, and reduced-motion criteria.
- **Fields**:
  - `gateType`: browser | performance | accessibility | reduced-motion
  - `target`: criterion statement from spec success criteria
  - `measurement`: observed value or checklist result
  - `status`: pass/fail
  - `evidenceRef`: link/path to test artifact or manual QA note
- **Validation rules**:
  - All gate types must pass before completion.

## Relationships Summary

- `VisualFoundation` -> reused by `AppShellPresentation` and all `PagePresentation` records.
- `AppShellPresentation` -> container and global style context for each `PagePresentation`.
- `WorkflowParityCheck` and `QualityGateResult` -> verification layer for validating redesigned UI against spec constraints.

## State Transitions

### PagePresentation lifecycle
1. `planned` -> defined in task slice
2. `implemented` -> styles/components applied
3. `verified` -> parity + quality checks passed
4. `accepted` -> stakeholder review complete

### QualityGateResult lifecycle
1. `pending`
2. `measured`
3. `pass` or `fail`
4. if `fail`, return to implementation and re-measure
