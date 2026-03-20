# Contract: Run Page Action Layout and Summary Scope

## Purpose

Define required action placement and summary behavior in ongoing run-event UI.

## Action Layout Contract

## 1) Top Row Navigation

- Left action: `Previous Round`
- Right action: `Next Match`

Both actions appear in the primary action row for ongoing events.

## 2) Second Row Utility Actions

- `View Summary`
- `Finish Event`

Both actions appear beneath top row in the same panel section.

## 3) Enablement Rules

- `Previous Round`: disabled/unavailable on round 1.
- `Next Match`: follows existing round-completion requirements.
- `Finish Event`: follows existing finish availability requirements.

## Inline Summary Contract

## 4) Summary Scope

- `View Summary` expands/collapses summary table in place.
- Separate recorded-scores edit list below summary table is removed.
- Score correction workflow is performed via previous-round navigation, not through a duplicate score-edit block under summary.

## Messaging Contract

## 5) Warning Feedback

- Blocked previous-round action at round 1 uses existing orange warning-style message treatment already used for run-event requirement warnings.
