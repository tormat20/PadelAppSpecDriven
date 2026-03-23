# Research: Calendar Popup Editor with Immediate Save

## Decision 1: Use centered modal overlay for calendar editing

- **Decision**: Replace drawer-style edit surface with centered modal overlay that preserves current calendar background context.
- **Rationale**: User intent is explicit: popup should feel like confirm/result modal and avoid stretched inline appearance.
- **Alternatives considered**:
  - Keep existing drawer and restyle only: rejected because it does not change interaction model.
  - Full route redirect to create page: rejected because calendar context must remain primary.

## Decision 2: Reuse create-event style form language inside popup

- **Decision**: Use the same visual and progression pattern as create-event form grid (mode, schedule, duration, naming, setup progression), but in modal context.
- **Rationale**: Consistency lowers cognitive load and makes editing familiar.
- **Alternatives considered**:
  - Minimal popup with only basic fields: rejected because courts/players editing must be fully available.
  - Build entirely new editing form language: rejected due unnecessary UX divergence.

## Decision 3: Adopt hybrid persistence model

- **Decision**: Popup Save persists immediately; drag/resize quick edits remain staged unless explicitly changed later.
- **Rationale**: Courts/players setup is high-effort and should not be reversible via staged undo by accident.
- **Alternatives considered**:
  - Keep all edits staged until global save: rejected by product direction.
  - Make all calendar edits immediate: rejected because staged workflow remains useful for quick scheduling passes.

## Decision 4: Reconcile staged state per-event after popup immediate save

- **Decision**: On successful popup save, update local source state and clear/replace staged entries for that specific event only.
- **Rationale**: Prevents stale staged payloads from re-applying outdated values during later Save Changes.
- **Alternatives considered**:
  - Clear all staged changes globally: rejected (destructive to unrelated in-progress edits).
  - Keep staged entries untouched: rejected (risk of silent overwrite/regression).

## Decision 5: Redo Changes only affects unsaved staged edits

- **Decision**: Redo continues to reset unsaved staged changes to last saved baseline and must never undo popup-persisted updates.
- **Rationale**: Preserves reliability expectation once user pressed popup Save.
- **Alternatives considered**:
  - Redo resets entire week including persisted popup changes: rejected as data-loss behavior.

## Decision 6: Conflict/error handling follows existing optimistic concurrency pattern

- **Decision**: Keep version conflict semantics and return actionable feedback for retry in popup.
- **Rationale**: Existing event update flow already supports explicit concurrency behavior; popup should align.
- **Alternatives considered**:
  - Last-write-wins without feedback: rejected due hidden overwrite risk.
  - Hard lock editing: rejected due unnecessary complexity.
