# Phase 0 Research - Calendar reliability and staged save workflow

## Decision 1: Persist via staged save, not per-gesture writes

- **Decision**: Use staged local edits with explicit `Save changes` commit action in calendar header.
- **Rationale**: Preserves responsiveness during heavy drag/resize sessions and avoids latency per interaction.
- **Alternatives considered**:
  - Immediate save on every gesture: rejected due to perceived sluggishness risk and write amplification.
  - Time-based auto-save only: rejected because users requested explicit control and predictable commit moment.

## Decision 2: Save failure handling

- **Decision**: Keep staged edits in place after failed save, show actionable error, and allow retry without losing local changes.
- **Rationale**: Prevents user data loss and keeps the editing flow recoverable.
- **Alternatives considered**:
  - Revert all local staged edits on failure: rejected due to high frustration and rework.
  - Silent retry without user signal: rejected due to poor transparency.

## Decision 3: Legacy event normalization

- **Decision**: Normalize old and new events into the same calendar-local shape at load time, including duration and team flags.
- **Rationale**: Ensures old events behave like new events for move/resize/edit interactions.
- **Alternatives considered**:
  - Conditional UI logic per event generation/version: rejected as brittle and harder to maintain.

## Decision 4: Modal editing approach

- **Decision**: Reuse existing event edit/setup flow in an overlay modal above calendar with close/cancel/save controls.
- **Rationale**: Preserves user flow and avoids route/context switching when editing many events.
- **Alternatives considered**:
  - Redirect to separate edit page: rejected by UX requirement.
  - Build a separate lightweight editor for calendar only: rejected due to duplication risk.

## Decision 5: Event management bulk delete

- **Decision**: Add Account Settings "Event Management" with explicit confirmation before deleting all events.
- **Rationale**: Provides administrative cleanup control while reducing accidental destructive actions.
- **Alternatives considered**:
  - No confirmation: rejected due to destructive risk.
  - Soft-delete only: rejected for this phase due to non-goal scope expansion.

## Decision 6: Color and hover behavior

- **Decision**: Use consistent per-event-type color mapping for templates and scheduled slots, with subtle edge-emphasis interaction style.
- **Rationale**: Increases visual scanning speed while matching existing app interaction aesthetics.
- **Alternatives considered**:
  - Strong glow effects: rejected as visually noisy.
  - Monochrome event cards: rejected due to lower type discoverability.

## Decision 7: Laptop-first layout widening

- **Decision**: Increase calendar container width usage and optimize two-column calendar/template composition for common laptop widths.
- **Rationale**: Current layout underuses horizontal space, reducing readability.
- **Alternatives considered**:
  - Keep current centered/narrow width: rejected due to user feedback.
  - Force full-bleed always: rejected due to potential readability issues on edge cases.
