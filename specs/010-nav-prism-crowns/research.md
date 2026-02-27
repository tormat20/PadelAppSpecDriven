# Phase 0 Research: Navigation Shell, Prism Background, and Final Winner Crowns

## Decision: Use exact provided prism implementation behavior
- **Decision**: Implement the global background using the provided ReactBits-style prism approach and dependency behavior, including the OGL rendering model and exposed control parameters.
- **Rationale**: The feature clarification explicitly requires the provided implementation behavior rather than visual approximations, minimizing interpretation drift.
- **Alternatives considered**:
  - Build a CSS-only gradient/mesh fallback as the primary effect.
  - Build a custom WebGL shader implementation with different lifecycle and controls.

## Decision: Keep prism as a dedicated global background layer in app shell
- **Decision**: Render prism background from the app shell so it appears behind all routes and does not intercept pointer interactions.
- **Rationale**: A shell-owned layer guarantees global coverage and consistent stacking behavior across route transitions.
- **Alternatives considered**:
  - Repeat background setup per-page.
  - Keep existing light-rays and add prism only on selected pages.

## Decision: Reduced-motion policy disables prism animation while retaining visual background
- **Decision**: Respect reduced-motion by suspending prism animation and presenting a stable static frame/appearance.
- **Rationale**: Meets accessibility expectations without removing brand atmosphere entirely.
- **Alternatives considered**:
  - Keep full animation for all users.
  - Remove prism layer completely when reduced motion is enabled.

## Decision: Full-width top nav shell is a dedicated structural container
- **Decision**: Introduce an edge-to-edge top navigation shell, separate from content width constraints, with placeholder capacity for future controls.
- **Rationale**: This preserves current content layout while enabling future nav expansion without reworking page-level structure.
- **Alternatives considered**:
  - Keep header constrained to existing centered content width.
  - Add placeholder controls directly into page headers only.

## Decision: Logo button remains the home action with image-only centered mark
- **Decision**: Keep the existing logo button interaction and replace label text with centered Molndal logo image only.
- **Rationale**: Satisfies branding request while preserving known navigation behavior and accessibility expectations.
- **Alternatives considered**:
  - Remove the button and show a static logo.
  - Keep supporting text under the logo.

## Decision: Crown resolution should be backend-derived and explicit in summary payload
- **Decision**: Compute crowned player IDs in backend summary service and return them with final summary payload for direct frontend rendering.
- **Rationale**: Centralizes mode-specific winner logic in one source of truth, avoids frontend duplication, and stabilizes contract tests.
- **Alternatives considered**:
  - Derive crowns purely in frontend from standings/matches.
  - Infer crowns from rank only for all modes.

## Decision: Mexicano crown tie policy crowns all highest-score players
- **Decision**: For Mexicano final summaries, mark every player tied at the highest total score as crowned.
- **Rationale**: Matches explicit clarification and avoids arbitrary tie-breakers in this feature.
- **Alternatives considered**:
  - Crown exactly one top-ranked player only.
  - Suppress crowns on any top-score tie.

## Decision: Americano crown policy uses final-round highest-court winning team only
- **Decision**: For Americano final summaries, crown both players from the winning team in the highest court-number match of the final round.
- **Rationale**: Matches clarified business rule and aligns winner display with the final decisive court.
- **Alternatives considered**:
  - Crown standings rank #1/#2 only.
  - Crown winners from all final-round courts.

## Decision: Americano draw handling is not applicable for crown assignment
- **Decision**: Do not add Americano draw tie-handling logic for crowns.
- **Rationale**: Clarification confirms Americano result inputs do not accept draws.
- **Alternatives considered**:
  - Add fallback behavior for hypothetical draws.
  - Introduce secondary tie-break hierarchy.

## Decision: Verification strategy spans frontend and backend contracts
- **Decision**: Validate UI behavior with frontend tests and winner/crown payload correctness with backend contract/integration tests.
- **Rationale**: This feature crosses visual shell updates and summary data semantics.
- **Alternatives considered**:
  - Frontend-only tests with mocked winner logic.
  - Manual QA only.
