# Contract: Final Summary Crown Assignment

## Purpose

Define API and UI expectations for crown winner highlighting on final summary views.

## API Response Contract (Final Summary)

1. Final summary responses include `crownedPlayerIds` as a list of player IDs.
2. `crownedPlayerIds` is empty when no crowns apply.
3. Progress summary responses do not expose winner crowns in UI behavior (empty/no crown rendering).

## Winner Resolution Contract

1. Mexicano final summary crowns all players tied at highest total score.
2. Americano final summary crowns both players from winning team in final-round highest-court match.
3. Americano draw handling is not applicable for crowns (draw outcome not supported for Americano result input).
4. BeatTheBox does not announce winners and shows no crowns.

## UI Rendering Contract

1. Crown icon source is `images/icons/crown.png`.
2. Crown icon appears next to each crowned player name in final summary table.
3. No crown icon appears in progress summary.

## Verification Targets

- Backend contract tests for `crownedPlayerIds` population by mode.
- Frontend tests for crown icon rendering by final/progress modes and mode-specific rules.
