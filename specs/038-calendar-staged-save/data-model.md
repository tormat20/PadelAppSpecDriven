# Data Model - Calendar reliability and staged save workflow

## 1) NormalizedCalendarEvent

- **Purpose**: Canonical event shape used by calendar interactions for both legacy and new events.

### Fields

- `id: string`
- `eventName: string`
- `eventType: "Americano" | "Mexicano" | "WinnersCourt" | "RankedBox"`
- `isTeamMexicano: boolean`
- `eventDate: string`
- `eventTime24h: string | null`
- `durationMinutes: 60 | 90 | 120`
- `status: "Lobby" | "Running" | "Finished"`
- `version: number`

### Validation Rules

- Duration must always be normalized to 60/90/120.
- Team Mexicano must be represented as Mexicano + team flag.

## 2) StagedChangeSet

- **Purpose**: Tracks pending edits before explicit save.

### Fields

- `created: NormalizedCalendarEvent[]`
- `updated: Record<string, Partial<NormalizedCalendarEvent>>`
- `deleted: string[]`
- `dirty: boolean`
- `lastChangedAt: string | null`

### Validation Rules

- `dirty=true` whenever any created/updated/deleted collection is non-empty.
- Multiple edits on same event collapse to latest field values before commit.

## 3) SaveSessionState

- **Purpose**: Drives calendar save UI and failure/retry behavior.

### Fields

- `status: "idle" | "saving" | "success" | "error"`
- `errorMessage: string | null`
- `pendingCount: number`
- `lastSavedAt: string | null`

### Validation Rules

- `status="saving"` disables duplicate save submissions.
- `status="error"` preserves staged changes.

## 4) InteractionModeState

- **Purpose**: Enforces mode separation for move/resize/edit interactions.

### Fields

- `mode: "idle" | "move" | "resize" | "edit-name"`
- `activeEventId: string | null`
- `resizeZoneHeightPx: 4`

### Validation Rules

- One active mode per gesture.
- Name-click mode opens edit modal, not move/resize.

## 5) EventManagementAction

- **Purpose**: Models destructive admin action from Account Settings.

### Fields

- `action: "remove-all-events"`
- `confirmationRequired: true`
- `confirmed: boolean`

### Validation Rules

- Bulk delete cannot execute without explicit confirmation.

## 6) EventTypeVisualMap

- **Purpose**: Ensures color consistency between template list and grid events.

### Fields

- `eventType`
- `templateClass`
- `eventCardClass`

### Validation Rules

- Same type must map to same visual family across template and event slot.

## State Transitions

### Staged edit transition

1. User moves/resizes/creates/edits event.
2. UI updates local `NormalizedCalendarEvent` immediately.
3. Corresponding delta is recorded in `StagedChangeSet` and `dirty=true`.

### Save transition

1. User triggers Save Changes.
2. `SaveSessionState.status` becomes `saving`.
3. Backend commit runs for staged deltas.
4. On success: staged set cleared, `dirty=false`, status `success`.
5. On failure: staged set retained, status `error`, retry possible.

### Bulk remove transition

1. User initiates Remove All Events in Account Settings.
2. Confirmation dialog must be accepted.
3. Delete action executes; calendar and account views refresh.
