# Phase 0 Research - Calendar interaction modes + template drag-create

## Decision 1: Move vs resize mode gating

- **Decision**: Use explicit hit-zone gating where pointer actions originating in the bottom 4px enter resize mode, while all other event-card pointer actions enter move mode.
- **Rationale**: This creates deterministic behavior and prevents accidental duration edits while moving events.
- **Alternatives considered**:
  - Modifier-key resize (e.g., Shift + drag): rejected for discoverability and UX friction.
  - Full-edge resize (top and bottom): rejected for this iteration to keep behavior simple and aligned with requested bottom-edge pattern.

## Decision 2: Resize interaction mechanics

- **Decision**: Resize from bottom edge only, using pointer delta snapped to 30-minute increments, then clamp/normalize to `60 | 90 | 120`.
- **Rationale**: Matches feature requirements and ensures event durations stay valid.
- **Alternatives considered**:
  - Free-form minute resizing: rejected due to invalid duration combinations and noisier UX.
  - Direct dropdown-only duration updates: rejected because request explicitly requires drag-resize affordance.

## Decision 3: Template drag-create behavior

- **Decision**: Add draggable template items that drop onto valid grid slots to create local events with defaults: mapped type, resolved date/time, duration 90, placeholder name.
- **Rationale**: Mirrors desired scheduler workflow while keeping scope local-state only.
- **Alternatives considered**:
  - Click-to-create panel without drag: rejected because drag-create behavior is required.
  - Immediate backend persistence on create: rejected by non-goals for this phase.

## Decision 4: Team Mexicano template mapping

- **Decision**: Team Mexicano template maps to `eventType = "Mexicano"` and `isTeamMexicano = true`.
- **Rationale**: Preserves existing type compatibility while supporting distinct UI labeling.
- **Alternatives considered**:
  - New dedicated event type enum value: rejected due to unnecessary scope expansion.

## Decision 5: Interactive glare styling approach

- **Decision**: Reuse existing app interactive-surface style direction and apply scoped calendar event-card classes for glare/hover/focus states.
- **Rationale**: Maintains visual consistency and avoids style regressions.
- **Alternatives considered**:
  - Import Figma/Tailwind style stack: rejected due to global style conflict risk.
  - Build separate visual language for calendar cards: rejected due to inconsistency with app-wide interaction cues.

## Decision 6: Preview behavior preservation

- **Decision**: Keep existing drag ghost/landing preview active during move interactions and ensure it remains visible while mode separation is introduced.
- **Rationale**: Visual placement feedback is a required behavior and already a user-approved interaction.
- **Alternatives considered**:
  - Remove ghost preview and rely on cursor only: rejected because it reduces scheduling confidence.
