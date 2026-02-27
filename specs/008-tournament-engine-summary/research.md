# Phase 0 Research: Tournament Engine and Round Summary Overhaul

## Decision 1: Use mode-specific round generators instead of shared generic regrouping
- **Decision**: Implement distinct next-round scheduling behavior for Americano, Mexicano, and BeatTheBox.
- **Rationale**: The current generic regrouping logic cannot satisfy mode-specific movement and partner constraints.
- **Alternatives considered**:
  - Keep one generic generator with many mode flags.
  - Push full scheduling logic into service layer without domain-level helpers.

## Decision 2: Court ladder semantics are based on selected-court ordering
- **Decision**: Build a per-event ordered ladder from selected courts; highest selected number is top, lowest is bottom.
- **Rationale**: Supports non-contiguous court selections (`2,4,5`) while preserving user-defined top-court semantics.
- **Alternatives considered**:
  - Assume contiguous numbering and infer missing courts.
  - Treat court `1` as always top regardless of event selection.

## Decision 3: Americano overflow handling uses seeded pseudo-random spill
- **Decision**: Cap each Americano next-round court group at 4 players and resolve overflow via pseudo-random spill to adjacent valid courts using a stable event-derived seed.
- **Rationale**: Preserves requested random-like redistribution while keeping identical-state outcomes deterministic and testable.
- **Alternatives considered**:
  - True randomness (breaks deterministic requirement).
  - Fully deterministic spill priority (drops requested random behavior).

## Decision 4: Mexicano ranking and tie-break ordering
- **Decision**: Rank by cumulative points descending, tie-break by previous round rank, then player ID.
- **Rationale**: Maintains competitive continuity and deterministic outputs across reruns.
- **Alternatives considered**:
  - Tie-break by player ID only.
  - Tie-break by previous court only.

## Decision 5: Mexicano partner anti-repeat policy
- **Decision**: Enforce no immediate partner repeat by using previous-round partner history in quartet pairing generation.
- **Rationale**: Directly satisfies fairness requirement and prevents repeated same-partner rounds among top players.
- **Alternatives considered**:
  - Allow repeats when players remain on same high court.
  - Minimize repeats statistically without strict immediate prohibition.

## Decision 6: BeatTheBox partner cycle contract
- **Decision**: Enforce fixed repeating cycle per quartet: round-cycle `1: AB vs CD`, `2: AC vs BD`, `3: AD vs BC`.
- **Rationale**: Deterministic, simple to validate, and guarantees partner rotation within a 3-round cycle.
- **Alternatives considered**:
  - Generic no-repeat pairing without named cycle.
  - Preserve unspecified current behavior.

## Decision 7: Final summary matrix is round-based and numeric
- **Decision**: Build final summary columns by round (`R1..RN`) plus `Total`, with numeric values for every mode.
- **Rationale**: Aligns reporting with host expectations and keeps totals directly auditable as sum of round columns.
- **Alternatives considered**:
  - Keep match-level columns (`M1..MK`).
  - Mixed symbolic and numeric round cells.

## Decision 8: Contracts and regression strategy
- **Decision**: Define explicit contracts for next-round assignments and summary matrix shape, then verify with backend contract tests and targeted frontend summary tests.
- **Rationale**: Reduces regression risk where scheduling and presentation intersect.
- **Alternatives considered**:
  - Rely only on existing integration tests.
  - Validate only UI snapshots without backend contract assertions.
