# Phase 0 Research: Player Selection and Favicon Improvements

## Player creation and assignment behavior

- **Decision**: A successful add action creates a player in the global catalog and immediately assigns that player to the active event draft.
- **Rationale**: The main workflow pain is ambiguity after "Add New". Immediate assignment provides clear feedback and keeps setup momentum.
- **Alternatives considered**:
  - Create player without auto-assigning, requiring a second selection step.
  - Add player in a separate management screen before event setup.

## Duplicate-name handling policy

- **Decision**: Use case-insensitive duplicate detection; if a match exists, reuse the existing player record and assign it to the event draft instead of creating a new record.
- **Rationale**: Prevents catalog fragmentation and ensures search/assignment remain predictable.
- **Alternatives considered**:
  - Allow duplicate records for same name with different casing.
  - Block duplicate creation and force manual lookup.

## Search suggestion trigger and matching rule

- **Decision**: Show suggestions after one typed character and apply case-insensitive prefix matching.
- **Rationale**: This satisfies the explicit expectation that typing "A" surfaces names such as "Alberta" and reduces unnecessary clicks.
- **Alternatives considered**:
  - Start suggestions after two characters.
  - Require explicit search submit action.

## Draft assignment persistence scope

- **Decision**: Persist assigned-player state for the active event draft and restore it when returning to that same draft, including refresh scenarios.
- **Rationale**: Protects hosts from accidental progress loss during setup and supports longer draft workflows.
- **Alternatives considered**:
  - Session-only in-memory assignment.
  - Persist only until tab refresh.

## Assignment removal semantics

- **Decision**: Minus action removes player from active event draft only and never deletes the player from the global catalog.
- **Rationale**: Hosts need rapid roster corrections without risking catalog data loss.
- **Alternatives considered**:
  - Remove from both event draft and global catalog.
  - No direct remove control in assigned list.

## Favicon compatibility strategy

- **Decision**: Configure Molndal logo SVG as primary favicon source with PNG fallback for compatibility.
- **Rationale**: Maximizes fidelity to provided brand asset while covering browsers with weaker SVG favicon handling.
- **Alternatives considered**:
  - SVG only.
  - PNG only.
