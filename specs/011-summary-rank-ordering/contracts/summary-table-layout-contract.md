# Contract: Summary Table Layout

## Purpose

Define expected summary table column layout and display behavior for progress and final summaries.

## Column Layout

1. Leftmost column is always `Rank`.
2. Second column is always `Player`.
3. Round columns follow (`R1..Rn` for final, mode-appropriate round columns for progress).
4. Last column is `Total` for final summaries.

## Display Behavior

1. Rank values shown in table must match deterministic order from ranking contract.
2. BeatTheBox round cells display numeric point values, not outcome labels.
3. Existing crown visualization behavior remains unchanged and coexists with new rank column.

## Accessibility and Readability

1. Table headers remain clear and consistent across viewports.
2. Added Rank column must not remove existing keyboard or screen-reader usability.

## Verification Targets

- Frontend tests for column order and rank-cell rendering.
- Regression checks for summary readability on desktop/mobile viewports.
