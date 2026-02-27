# Run Event Result Modal Contract

## Purpose

Define externally visible run-event behavior for court overlays, side selection, and mode-specific modal result entry.

## Court Overlay Contract

1. Run-event court cards render with background image `images/courts/court-bg-removed.png`.
2. Team overlays display player display names, not raw identifiers, when names are available.
3. Left/right team side zones remain clickable interactive targets.
4. Hover highlight applies only to the side currently under pointer focus.

## Side Selection Contract

1. Clicking a team side opens a result modal bound to selected `matchId` + side context.
2. Result interpretation is side-relative: chosen outcome applies to clicked side.
3. Cancel/close action does not mutate match state.

## Modal Option Contract

### Americano
1. Modal shows exactly two options: `Win`, `Loss` (relative to clicked side).

### BeatTheBox
1. Modal shows exactly three options: `Win`, `Loss`, `Draw` (relative to clicked side).

### Mexicano
1. Modal shows exactly 24 clickable score alternatives.
2. Selecting score `X` for clicked side auto-assigns opposing side score `24 - X`.
3. Option selection uses click buttons, not scroll/select control.

## Submission/Progression Contract

1. Valid modal submission records result for target match and preserves existing progression rules.
2. Existing round advancement constraints remain unchanged.
3. Existing summary behaviors (progress and final) remain regression-safe.

## Verification Log Placeholders

- [X] Contract check: court cards use `images/courts/court-bg-removed.png`
- [X] Contract check: overlays display names (not IDs) when mapping data available
- [ ] Contract check: side click opens modal and close/cancel keeps match unmodified
- [X] Contract check: mode-specific options match Americano/BeatTheBox/Mexicano contract
- [X] Contract check: Mexicano `X` selection assigns opponent `24 - X`

### Evidence

- `frontend/src/components/courts/CourtGrid.tsx` uses `COURT_IMAGE_SRC` set to `/images/courts/court-bg-removed.png` with side overlay zones.
- `frontend/src/pages/RunEvent.tsx` maps identifier arrays via `mapMatchPlayersToDisplayNames` before rendering court overlays.
- `frontend/tests/run-event-court-card.test.tsx` validates court image path and display-name mapping helper.
- `frontend/src/components/matches/ResultModal.tsx` + `frontend/src/features/run-event/modeInputs.tsx` implement side-relative modal flow and mode-specific options.
- `frontend/tests/run-event-result-modal.test.tsx` validates Americano/BeatTheBox side-relative payload mapping.
- `frontend/tests/run-event-mexicano-options.test.tsx` validates exactly 24 options and complement score rule.
