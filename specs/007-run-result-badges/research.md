# Phase 0 Research: Event Setup Label + Run Card Transparency + Inline Team Result Badges

## Decision 1: Render mirrored outcomes inside team buttons
- **Decision**: Replace below-card helper feedback with right-aligned inline result badges on each team button.
- **Rationale**: Hosts scan team buttons first; embedding outcomes in-place reduces eye travel and ambiguity.
- **Alternatives considered**:
  - Keep helper text below card and only show one-side result.
  - Use a separate summary badge row under each card.

## Decision 2: Preserve existing scoring formulas and derive mirrored display state
- **Decision**: Continue using existing mode-specific payload semantics, then derive opposite-side display value from the selected outcome.
- **Rationale**: Maintains scoring correctness while adding mirrored visual clarity.
- **Alternatives considered**:
  - Introduce new backend response shape for per-side display labels.
  - Store mirrored labels separately in persistent state.

## Decision 3: Mexicano display uses complement rule from selected score
- **Decision**: When one side selects `X`, display `X` on selected side and `24 - X` on opposing side.
- **Rationale**: Aligns with game rule and host expectation, preventing manual complement calculation.
- **Alternatives considered**:
  - Show only selected-side score.
  - Require separate explicit entry for both sides.

## Decision 4: Create-event player section heading should be "Players"
- **Decision**: Use a single primary heading `Players` above add/search controls and assigned list.
- **Rationale**: Collapses ambiguous labels and improves immediate discoverability.
- **Alternatives considered**:
  - Keep existing `Suggestions` + `Assigned to this event` as top-level headings.
  - Rename suggestions only and leave assigned heading as-is.

## Decision 5: Assigned-player list should expand naturally
- **Decision**: Remove fixed-height clipping for assigned player list so entries remain visible without inner scrolling in normal use.
- **Rationale**: Setup accuracy improves when all assigned players are visible together.
- **Alternatives considered**:
  - Keep capped-height list with scrollbar.
  - Add collapse/expand behavior for long lists.

## Decision 6: Reduce card overlay opacity but preserve tinted team controls
- **Decision**: Lower court-card overlay intensity while keeping tinted team button backgrounds for readability and click affordance.
- **Rationale**: Court image remains visible without sacrificing button contrast.
- **Alternatives considered**:
  - Remove overlay completely.
  - Keep current overlay and only change button opacity.

## Decision 7: Minimize backend changes for this feature
- **Decision**: Implement UI behavior primarily in frontend and validate backend contracts remain compatible.
- **Rationale**: Scope is UX polish; backend formulas already satisfy required semantics.
- **Alternatives considered**:
  - Add new backend fields for mirrored display values.
  - Add separate endpoint for run-event presentation state.
