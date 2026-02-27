# Contract: Summary Ranking Rules by Mode

## Purpose

Define deterministic rank assignment rules for summary responses across Mexicano, Americano, and BeatTheBox.

## Ranking Rules

1. Progress summaries: rank rows by current accumulated points/score descending for all modes.
2. Mexicano final summaries: rank rows by total descending, using competition ranking for ties (`1,1,3,4...`).
3. Americano final summaries:
   - Process final-round courts from highest to lowest court number.
   - For each court, winners slot precedes losers slot.
   - Within each winners/losers slot, players are alphabetically ordered by display name.
4. BeatTheBox final summaries:
   - Round cells show numeric points per round.
   - Total equals sum of round points.
   - Row ordering uses court-group priority derived from global carry-over score progression.

## Determinism Requirements

1. Rank and row order must be stable for identical input data across repeated requests.
2. Tie handling must follow mode rule without ambiguous fallback behavior.

## Verification Targets

- Backend contract/integration tests for per-mode rank/order correctness.
- Frontend summary tests confirming rank-column rendering aligns with returned order.
