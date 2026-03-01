# Phase 0 Research: Event Player Logic and Summary Icon/Alignment Update

## Decision: Enforce exact create-event capacity as courts * 4
- **Decision**: Create Event submission is enabled only when assigned players equal selected courts multiplied by four.
- **Rationale**: This matches host mental model and avoids invalid event setup combinations.
- **Alternatives considered**:
  - Keep minimum/divisible-by-4 rule only.
  - Auto-trim or auto-complete assigned players.

## Decision: Show assigned progress as `assigned / required`
- **Decision**: Render assigned player counter in the Assigned header, right aligned from the title.
- **Rationale**: Immediate capacity feedback reduces setup friction.
- **Alternatives considered**:
  - Show count only in helper text.
  - Show warning only when invalid.

## Decision: Keep native single-field time input
- **Decision**: Retain native `type="time"` single input field and do not replace with custom hour/minute controls.
- **Rationale**: User prefers native single-field behavior despite locale-specific AM/PM picker UI on some platforms.
- **Alternatives considered**:
  - Custom HH/MM selector to enforce 24h picker visuals.
  - Third-party time picker component.

## Decision: Place "Today's date" shortcut below schedule row
- **Decision**: Add clickable text action below date/time row; action updates date only.
- **Rationale**: Better visual placement and faster date selection without changing selected time.
- **Alternatives considered**:
  - Button inside schedule row.
  - Auto-fill date on page load.

## Decision: Switch summary winner icon to colored crown asset
- **Decision**: Use `crown-color` icon path for winner emblem.
- **Rationale**: Improved visual clarity for crowned rows.
- **Alternatives considered**:
  - Keep monochrome crown.
  - Use text-only winner badge.

## Decision: Keep rank centered and name cell split left/right
- **Decision**: Keep rank centered while name cell shows player text left and emblem right.
- **Rationale**: Preserves numeric scanability and improves name-row visual balance.
- **Alternatives considered**:
  - Center all columns.
  - Left-align both rank and name.

## Decision: Preserve crown fallback marker
- **Decision**: Keep `*` fallback marker when icon loading fails.
- **Rationale**: Provides visible signal that winner logic is still functioning.
- **Alternatives considered**:
  - Hide icon entirely on error.
  - Replace with text badge.
