# Inline Team Result Badges Contract

## Purpose

Define externally visible UI behavior for inline mirrored result badges, setup player section labels/list behavior, and court-card transparency adjustments.

## Run Event Team Button Contract

1. Team buttons show player names and, when selected, a right-aligned result badge/value.
2. No redundant muted helper text is displayed below the court card for selection feedback.
3. Display outcomes are mirrored across both team buttons according to mode rules.

## Mode Display Rules

### Americano
1. Selecting `Win` for one side displays `Loss` for the opposing side.
2. Selecting `Loss` for one side displays `Win` for the opposing side.

### BeatTheBox
1. `Win` mirrors to `Loss`.
2. `Loss` mirrors to `Win`.
3. `Draw` mirrors to `Draw`.

### Mexicano
1. Selecting score `X` on one side displays `X` on that side.
2. Opposing side displays `24 - X`.
3. Displayed side scores always sum to `24`.

## Event Setup Player Section Contract

1. The player section heading is `Players`.
2. Assigned-player list expands downward and avoids fixed-height clipping in normal setup usage.

## Court Visual Contract

1. Court-card overlay intensity is reduced versus previous state so the image is visibly clearer.
2. Team buttons remain tinted and readable after overlay reduction.

## Compatibility Contract

1. Existing match submission payload rules remain unchanged.
2. Existing match completion and event progression logic remains unchanged.

## Verification Log Placeholders

- [X] Contract check: team buttons render inline right-aligned badges after selection
- [X] Contract check: muted helper text below cards is removed
- [X] Contract check: Mexicano badge pairs always sum to 24
- [X] Contract check: Americano/BeatTheBox mirrored outcomes render correctly on both sides
- [X] Contract check: setup player section heading/list behavior matches contract

### Evidence

- `frontend/src/components/courts/CourtGrid.tsx` renders optional `team-result-badge` per side from `resultBadgeByMatch`.
- `frontend/src/pages/RunEvent.tsx` removes below-card helper copy and maps submitted payloads to mirrored badge values.
- `frontend/src/features/run-event/resultEntry.ts` exposes `getMirroredBadgePair` and Mexicano complement payload logic.
- `frontend/tests/run-event-mexicano-options.test.tsx` validates 24 options and mirrored score pair behavior.
- `frontend/tests/result-entry-selection-state.test.tsx` validates mirrored win/loss/draw badge mapping.
- `frontend/src/components/players/PlayerSelector.tsx` exports and uses `PLAYER_SECTION_TITLE = "Players"`; assigned list clipping removed in `frontend/src/styles/components.css`.
