# Data Model: Calendar Popup Editor with Immediate Save

## Entity: PopupEditSession

- **Purpose**: Represents active modal editing state for a selected calendar event.
- **Fields**:
  - `eventId` (string, required)
  - `isOpen` (boolean, required)
  - `mode` (enum: `edit`, `create-like-edit`, `readonly`)
  - `formValues` (object, required)
  - `isDirty` (boolean)
  - `isSaving` (boolean)
  - `saveError` (string | null)
- **Validation rules**:
  - `eventId` must map to an existing calendar event.
  - `formValues.eventName` minimum 3 chars.
  - Duration limited to `60 | 90 | 120` unless product explicitly broadens.

## Entity: PopupImmediateSavePayload

- **Purpose**: Data submitted from popup when user clicks Save.
- **Fields**:
  - `eventId` (string, required)
  - `expectedVersion` (number, required)
  - `eventName` (string, optional)
  - `eventType` (enum, optional)
  - `eventDate` (date string, optional)
  - `eventTime24h` (time string, optional)
  - `eventDurationMinutes` (enum minutes, optional)
  - `selectedCourts` (number[], optional)
  - `playerIds` (string[], optional)
- **Validation rules**:
  - At least one editable field must change when save is attempted.
  - Courts/players setup remains consistent with existing setup constraints.

## Entity: PopupImmediateSaveResult

- **Purpose**: Canonical persisted event snapshot used to refresh local source-of-truth.
- **Fields**:
  - `event` (normalized event object)
  - `persistedAt` (timestamp)
  - `version` (number, incremented)
  - `status` (enum: `saved`, `conflict`, `error`)

## Entity: StagedCalendarChangeSet

- **Purpose**: Holds unsaved quick edits (drag/resize/etc.) outside popup immediate-save path.
- **Fields**:
  - `creates` (list)
  - `updates` (list)
  - `deletes` (list)
  - `dirty` (boolean)
- **Validation rules**:
  - Updates include `expectedVersion` when required.
  - Entries are deduplicated by event identity.

## Entity: ReconciledEventState

- **Purpose**: Event-level merge result after popup immediate save intersects staged state.
- **Fields**:
  - `eventId` (string)
  - `persistedSnapshot` (event)
  - `stagedEntryCleared` (boolean)
  - `remainingStagedEntries` (count)
- **State transitions**:
  1. `staged + popup-open`
  2. `popup-save-success`
  3. `event-specific staged reconciliation`
  4. `baseline/source updated`

## Relationship Notes

- `PopupEditSession` targets one `CalendarEvent` at a time.
- `PopupImmediateSaveResult` updates `ReconciledEventState` for the same event.
- `StagedCalendarChangeSet` persists for unrelated events after reconciliation.
- `Redo Changes` reads reconciled baseline and only applies to unsaved staged entries.
