# Contract: Summary Ordering Metadata

## Purpose

Define payload expectations required for deterministic frontend rendering of ranks and row order.

## Response Expectations

1. Summary payload includes enough data to render rank and order without frontend heuristics.
2. Ordered row output and rank values are aligned (row 1 rank equals first displayed rank, etc.).
3. Existing response compatibility fields remain available where required by current clients.

## Mode-Specific Metadata Expectations

1. Mexicano final metadata supports competition tie ranks.
2. Americano final metadata supports court-priority winner/loser slot ordering and alphabetical intra-slot ordering.
3. BeatTheBox metadata supports global carry-over score progression grouping and within-group descending totals.

## Failure/Fallback Behavior

1. If mode-specific ordering inputs are incomplete, response remains valid and deterministic with documented fallback behavior.
2. No mode emits unstable ordering between repeated requests for identical source data.

## Verification Targets

- Backend contract tests for payload shape and ordering metadata correctness.
- Integration tests ensuring summary endpoint returns deterministic ranked rows for each mode.
