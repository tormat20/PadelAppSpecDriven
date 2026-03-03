# Data Model: Dual Event Creation Flows and Editable Preview

## Entities

### 1) EventCreateIntent
- **Purpose**: Represents organizer-selected create action and corresponding validation mode.
- **Fields**:
  - `actionType` (enum: `create_event` | `create_event_slot`)
  - `planningFields` (name, mode, date, time)
  - `setupSelections` (courts, players) from current form state
- **Validation rules**:
  - `create_event` requires full mode-specific readiness constraints before submission is enabled.
  - `create_event_slot` requires only planning fields and ignores `setupSelections` at save time.

### 2) EventSetupState
- **Purpose**: Current event readiness state used for preview/start gating.
- **Fields**:
  - `setupStatus` (enum: `planned` | `ready`)
  - `missingRequirements` (list)
  - `mode`
  - `courts`
  - `players`
- **Validation rules**:
  - Recomputed after each edit save.
  - Incomplete setup results in `planned`; complete setup results in `ready`.

### 3) EventEditSession
- **Purpose**: Editable representation loaded from Preview into the create surface.
- **Fields**:
  - `eventId`
  - `isEditMode` (boolean)
  - `prefilledPlanningFields`
  - `prefilledSetupFields`
  - `primaryActionLabel` (fixed string: `Save Changes`)
- **Validation rules**:
  - In edit mode, only `Save Changes` is presented as the primary save action.
  - `Save Changes` permits incomplete setup and preserves `planned` as needed.

### 4) EventSlotListRow
- **Purpose**: View model for Home > Event Slots rendering consistency.
- **Fields**:
  - `eventId`
  - `displayName`
  - `scheduleSummary`
  - `setupStatus`
  - `statusColumnAlignment` (fixed centered behavior)
- **Validation rules**:
  - Status placement remains centered in a consistent column regardless of `displayName` length.

## Relationships

- `EventCreateIntent` creates or updates `EventSetupState`.
- `EventEditSession` modifies `EventSetupState` for an existing event.
- `EventSlotListRow` reflects `EventSetupState.setupStatus` for list presentation.

## State Transitions

1. `create_event` with full valid setup -> `ready`
2. `create_event_slot` with valid planning fields -> `planned`
3. `edit_save` with incomplete setup -> `planned`
4. `edit_save` with complete setup -> `ready`
5. `edit_save` removing required setup from a ready event -> `planned`
