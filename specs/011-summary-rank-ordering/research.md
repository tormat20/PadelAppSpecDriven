# Phase 0 Research: Summary Rank Column and Mode-Specific Ordering Rules

## Decision: Add rank as explicit summary field instead of deriving only in UI
- **Decision**: Include rank-ready ordering metadata in summary payload and render explicit rank column in UI.
- **Rationale**: Backend-defined order reduces frontend ambiguity and keeps deterministic behavior across clients and reloads.
- **Alternatives considered**:
  - Compute all rank/order rules exclusively in frontend from raw rows.
  - Keep payload unchanged and assign rank by current row index only.

## Decision: Mexicano final ranking uses descending total with competition tie ranking
- **Decision**: Sort Mexicano by total descending and display competition ranks (`1,1,3,4...`) for ties.
- **Rationale**: Matches clarified business rule and communicates tie impact clearly.
- **Alternatives considered**:
  - Dense rank style (`1,1,2,3...`).
  - Unique sequential ranks even when tied.

## Decision: Americano final ranking follows court-priority winner/loser sequencing
- **Decision**: Rank order is produced by final-round court descending: winners first, then losers, court by court.
- **Rationale**: Aligns outcomes with event narrative and explicit product requirement.
- **Alternatives considered**:
  - Rank by total score only.
  - Rank by standings rank produced by prior scoring pipeline.

## Decision: Americano intra-pair ordering uses alphabetical display-name order
- **Decision**: Within each winners pair and losers pair, order players alphabetically by display name.
- **Rationale**: Deterministic and human-checkable without depending on insertion order.
- **Alternatives considered**:
  - Preserve backend match record order.
  - Use current total as intra-pair tie-break.

## Decision: Progress summary ranking uses current accumulated score descending for all modes
- **Decision**: Progress-mode rank values are derived from current accumulated points/score, descending.
- **Rationale**: Provides consistent live leaderboard behavior and mode-agnostic interpretation.
- **Alternatives considered**:
  - Keep legacy unsorted row order.
  - Apply final-only ordering logic during progress.

## Decision: BeatTheBox summary cells show numeric round points and explicit totals
- **Decision**: Replace non-numeric outcome labels in summary matrix with per-round numeric points and total sum.
- **Rationale**: Supports ranking transparency and deterministic ordering checks.
- **Alternatives considered**:
  - Keep W/L/D display and infer totals separately.
  - Show only total without per-round points.

## Decision: BeatTheBox court groups derive from global carry-over score progression
- **Decision**: Court-group priority for ordering is based on global score progression context (existing ranking progression model), highest group first.
- **Rationale**: Matches clarified domain rule that BeatTheBox scoring persists across events.
- **Alternatives considered**:
  - Group by final-round court only.
  - Group by highest court reached within current event only.

## Decision: Preserve crown behavior and event flow while extending summary contract
- **Decision**: Keep crown-assignment semantics unchanged and only extend summary payload for ranking/ordering metadata.
- **Rationale**: Reduces rework and isolates this feature to presentation + deterministic ordering contract.
- **Alternatives considered**:
  - Recompute crowns from new rank only.
  - Couple crown and rank rules into one new winner model.

## Decision: Validate with backend contract/integration plus frontend rendering tests
- **Decision**: Add test coverage in backend contract/integration and frontend summary tests for rank column + ordering rules.
- **Rationale**: Feature spans API contract and UI behavior; both layers must validate determinism.
- **Alternatives considered**:
  - Frontend-only tests with mocked payloads.
  - Manual QA only.
