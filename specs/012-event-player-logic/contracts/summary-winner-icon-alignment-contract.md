# Contract: Summary Winner Icon and Alignment

## Purpose

Define summary row presentation for rank, player name, and winner emblem.

## Rules

1. Winner icon source is `/images/icons/crown-color.png`.
2. If icon fails to load, fallback marker `*` is shown.
3. Rank column values are centered.
4. Player name in name cell is left-aligned.
5. Winner emblem appears on the far right of the same name cell.

## Verification Targets

- Frontend rendering tests for icon path constant and crown membership behavior.
- Visual verification for rank/name/icon alignment in final summary matrix.
