# Research: Previous Round Correction Flow

## Decision 1: Support repeated rollback, one round step per action

- **Decision**: Implement `Previous Round` as single-step navigation (N -> N-1) that can be pressed repeatedly until Round 1.
- **Rationale**: Matches the host’s dominant workflow (99% one-step), while still allowing full rollback coverage to the first round boundary.
- **Alternatives considered**:
  - Jump-to-round selector: rejected as unnecessary complexity for live flow.
  - Single rollback only: rejected because spec requires ability to continue back to Round 1.

## Decision 2: Round 1 boundary uses warning-style feedback and disabled/blocked back action

- **Decision**: When current round is 1, `Previous Round` cannot execute and warning-style inline feedback is shown using existing orange warning treatment.
- **Rationale**: Aligns with existing UX language for operational constraints and provides immediate user clarity.
- **Alternatives considered**:
  - Silent disable only: rejected because host explicitly requested warning feedback.
  - Modal alert: rejected as disruptive for routine operations.

## Decision 3: Previous-round correction invalidates and regenerates downstream rounds

- **Decision**: After correcting a prior round, all downstream generated rounds from that correction point are rebuilt from corrected data before continuing.
- **Rationale**: Prevents stale or inconsistent court assignment outcomes.
- **Alternatives considered**:
  - Patch-only current next round: rejected because later generated rounds may also depend on corrected ranking sequence.
  - Keep old rounds and only mark warning: rejected because it preserves known-invalid assignments.

## Decision 4: Keep correction authorization and conflict behavior consistent with existing result correction model

- **Decision**: Reuse existing host/admin permission checks and stale-write conflict handling for corrections done after rollback.
- **Rationale**: Reduces divergence and preserves predictable safety model.
- **Alternatives considered**:
  - Separate rollback-only permission path: rejected as unnecessary duplicate logic.
  - Last-write-wins: rejected due to data-loss risk.

## Decision 5: Inline summary remains read-focused; remove separate recorded-score edit block

- **Decision**: Remove the additional recorded-scores section beneath summary and keep summary table as contextual visibility only.
- **Rationale**: Host explicitly requested removal and correction through previous-round workflow instead.
- **Alternatives considered**:
  - Keep both pathways: rejected as conflicting mental model and clutter.

## Decision 6: Run action layout uses explicit navigation hierarchy

- **Decision**: Top row in action panel: `Previous Round` (left) and `Next Match` (right). Second row in same panel: `View Summary` and `Finish Event`.
- **Rationale**: Reinforces back/forward flow while keeping utility actions visible.
- **Alternatives considered**:
  - Single-row four-button layout: rejected for readability and accidental taps.
  - Keeping finish in top row: rejected by explicit request.

## Decision 7: Finish behavior remains rule-bound

- **Decision**: `Finish Event` stays gated by existing completion rules and is disabled or unavailable until valid.
- **Rationale**: Prevents accidental early finalization while layout changes.
- **Alternatives considered**:
  - Always enabled: rejected as unsafe for live operation.
