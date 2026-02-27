# Contract: Final Summary Round Matrix

## Purpose

Define finished-event summary payload/behavior expected by UI and tests after scheduling overhaul.

## Matrix Contract

1. Final summary columns are round-based (`R1...RN`) plus `Total`.
2. Match-index columns (`M1...MK`) are not present in final summary output.
3. Each round cell value is numeric for all modes.
4. For each player, `Total` equals sum of all round cell numeric values.
5. Player list and matrix rows are deterministic for identical event state.

## Compatibility Contract

1. Existing scoring formulas remain unchanged.
2. Event progression and finish endpoint behaviors remain backward compatible.

## Verification Targets

- Backend contract tests for summary response shape and value invariants.
- Frontend summary page tests for round headers and numeric cell display.

## Verification Log Placeholders

- [ ] Final summary columns verified as `R1..RN` plus `Total`
- [ ] Final summary excludes match-index columns (`M1..MK`)
- [ ] Final summary round cells verified numeric for all modes
- [ ] Player total verified as sum of round cells
