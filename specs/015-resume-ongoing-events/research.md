# Phase 0 Research: Resumable Ongoing Events and Run-State UX

## Decision: Treat `ongoing` as explicit run-state surfaced to UI
- **Decision**: Keep setup readiness (`planned`/`ready`) separate from runtime execution state and surface `ongoing` as the running state for organizer-facing UX.
- **Rationale**: Prevents setup state from being overloaded with runtime semantics and resolves ambiguity between ready and actively running events.
- **Alternatives considered**:
  - Infer `ongoing` indirectly from existing running status only in frontend.
  - Merge `ongoing` into setup readiness values.

## Decision: Resume uses persisted backend event/round/match/result data only
- **Decision**: Resume flow reconstructs UI from persisted event status, current round pointer, matches, and recorded results; no browser-only session dependency.
- **Rationale**: Existing repositories already persist these entities and provide reliable recovery after navigation/reload.
- **Alternatives considered**:
  - Store resumable state in local storage/session storage.
  - Recreate rounds/matches on resume from scratch.

## Decision: Action gating aligns with latest persisted run-state
- **Decision**: `Start Event` shown only for ready; `Resume Event` shown for ongoing; no execution action for planned.
- **Rationale**: Reduces operator error and makes next actions unambiguous across Home and Preview.
- **Alternatives considered**:
  - Keep `Open` action and branch inside run page only.
  - Show both Start and Resume based on permissive conditions.

## Decision: Standardize actionable load/resume errors
- **Decision**: Normalize error handling into explicit user-recoverable messages (retry, return to slots, open preview) instead of raw/opaque network text.
- **Rationale**: Current API wrapper/UI paths can surface raw payload text or silent failures; consistent guidance improves recovery speed.
- **Alternatives considered**:
  - Continue exposing raw backend error text.
  - Backend-only message updates without frontend normalization.

## Decision: Keep existing create-slot, strict-create, and edit-save semantics unchanged
- **Decision**: Scope this feature to run-state and resume UX only; do not alter prior create/edit behavior.
- **Rationale**: Limits regression risk and preserves already validated workflows.
- **Alternatives considered**:
  - Refactor create/edit semantics together with run-state changes.
  - Introduce unified event state machine in this iteration.

## Decision: Preview schedule presentation uses combined date-time display
- **Decision**: Show date and time in one line where time is available.
- **Rationale**: Improves operator context before start/resume decisions.
- **Alternatives considered**:
  - Keep date-only display.
  - Display time in a separate field block.
