# Phase 0 Research: Dual Event Creation Flows and Editable Preview

## Decision: Split create actions into strict-create and slot-create commands
- **Decision**: Treat `Create Event` and `Create Event Slot` as separate intent paths with distinct validation behavior.
- **Rationale**: This cleanly restores strict creation rules while preserving a planning-first path for placeholders.
- **Alternatives considered**:
  - Single create action with an optional checkbox for slot mode.
  - Auto-detect slot mode based on missing players/courts.

## Decision: Keep slot-create planning-fields-only regardless of form setup selections
- **Decision**: `Create Event Slot` always uses only name/mode/date/time and ignores any courts/players currently selected in the form.
- **Rationale**: Prevents accidental ready creation through slot flow and aligns with clarified user intent.
- **Alternatives considered**:
  - Include selected setup fields when present.
  - Include setup fields but force planned status.

## Decision: Reuse Create Event surface for editing with explicit edit mode
- **Decision**: Route `Edit Event` from Preview to the existing create surface in edit mode with prefilled values.
- **Rationale**: Minimizes UX fragmentation and reduces implementation risk by reusing proven inputs and validation UX.
- **Alternatives considered**:
  - Inline edit modal/panel on Preview.
  - Separate dedicated Edit Event page.

## Decision: Use single edit action label and allow partial saves
- **Decision**: In edit mode, show only `Save Changes` and allow incomplete setup saves that keep or set status to planned.
- **Rationale**: Supports incremental setup completion without blocking organizer progress; start gating continues to protect execution.
- **Alternatives considered**:
  - Require full readiness before any edit save.
  - Keep both create buttons visible in edit mode.

## Decision: Maintain warning and readiness semantics across create and edit
- **Decision**: Past date/time and duplicate warnings remain non-blocking in both create and edit flows; readiness recalculates immediately after save.
- **Rationale**: Preserves existing operator expectations and prevents surprise regressions.
- **Alternatives considered**:
  - Block edits when warnings are present.
  - Recalculate readiness only on preview reload.

## Decision: Standardize Event Slots list status alignment as a fixed centered column
- **Decision**: Render status indicators in a dedicated fixed-alignment column, independent of event name length.
- **Rationale**: Improves scanability and reduces visual jitter in mixed short/long-name rows.
- **Alternatives considered**:
  - Keep status placement inline with variable text lengths.
  - Truncate names aggressively to force pseudo-alignment.
