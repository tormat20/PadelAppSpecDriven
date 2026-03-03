# Phase 0 Research: Event State and Restart Iteration

## Decision: Keep setup and runtime lifecycle as separate state dimensions
- **Decision**: Continue using setup-readiness (`planned`/`ready`) separately from runtime lifecycle (`ongoing`/`finished`) and map organizer-visible labels consistently.
- **Rationale**: Prevents state ambiguity, keeps action gating deterministic, and aligns with existing lifecycle persistence.
- **Alternatives considered**:
  - Single unified status enum only.
  - Frontend-only state inference from mixed fields.

## Decision: Transition to `ongoing` immediately on successful start and auto-finish on completion
- **Decision**: Start action persists ongoing runtime state immediately; event auto-transitions to finished when required rounds/matches complete.
- **Rationale**: Matches clarified operator expectations and avoids stale labels/actions.
- **Alternatives considered**:
  - Manual finish-only transition.
  - Delayed ongoing state update after first score submission.

## Decision: Restart is an explicit confirmed reset for ongoing events only
- **Decision**: `Restart Event` requires confirmation, clears prior run progress/results for that event, preserves setup, returns event to ready, and navigates to preview.
- **Rationale**: Supports operational recovery while protecting against accidental destructive resets.
- **Alternatives considered**:
  - Keep prior run history attached and start another run layer.
  - Auto-restart without confirmation.

## Decision: Fix self-duplicate warning via explicit self-exclusion in duplicate checks
- **Decision**: Duplicate-slot checks in edit mode exclude the currently edited event from matching logic.
- **Rationale**: Removes false-positive warnings for unchanged name/date/time edits.
- **Alternatives considered**:
  - Hide warning entirely in edit mode.
  - Require name/date/time change before checking duplicates.

## Decision: Standardize actionable resume/load error guidance
- **Decision**: Normalize resume/load failures to actionable guidance (retry, return to slots/preview) instead of generic network-only messaging.
- **Rationale**: Existing mixed/silent failure handling slows recovery and confuses operators.
- **Alternatives considered**:
  - Continue exposing raw backend messages.
  - Generic static error banner for all failures.

## Decision: Expand Preview summary context for run readiness decisions
- **Decision**: Show Event Mode, Date/Time, Setup Status, Players Assigned, and Courts Assigned rows in preview.
- **Rationale**: Gives quick operational checks before start/resume/restart decisions.
- **Alternatives considered**:
  - Keep minimal preview fields.
  - Show details only behind a secondary panel.
