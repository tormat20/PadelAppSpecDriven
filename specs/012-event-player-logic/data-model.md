# Data Model: Event Player Logic and Summary Icon/Alignment Update

## Entities

### 1) RequiredPlayerCapacity
- **Purpose**: Derive required assigned players from selected courts.
- **Fields**:
  - `selectedCourtCount` (integer)
  - `requiredPlayers` (integer = selectedCourtCount * 4)
- **Validation rules**:
  - If selectedCourtCount is 0, event creation remains disabled by court requirement.
  - Submission requires assigned count to equal requiredPlayers exactly.

### 2) AssignedPlayerProgress
- **Purpose**: UI progress signal for assigned players.
- **Fields**:
  - `assignedCount`
  - `requiredCount`
  - `displayText` (`assignedCount / requiredCount`)
- **Validation rules**:
  - Updates immediately when assigned players or selected courts change.

### 3) EventDateShortcutAction
- **Purpose**: Set date quickly to current date while preserving time.
- **Fields**:
  - `triggerLabel` (`Today's date`)
  - `appliedDateISO` (`YYYY-MM-DD`)
  - `preservedTime` (`HH:mm` string, unchanged)
- **Validation rules**:
  - Action updates only date field.

### 4) SummaryWinnerDisplay
- **Purpose**: Presentation behavior for crowned summary rows.
- **Fields**:
  - `iconPath` (`/images/icons/crown-color.png`)
  - `fallbackMarker` (`*`)
  - `nameAlignment` (left)
  - `iconAlignment` (right)
  - `rankAlignment` (center)
- **Validation rules**:
  - Fallback marker shown only if icon fails.
  - Rank column alignment remains centered.

## Relationships

- `RequiredPlayerCapacity` drives submit enablement and `AssignedPlayerProgress`.
- `EventDateShortcutAction` mutates create-event date field and leaves time intact.
- `SummaryWinnerDisplay` consumes crowned-player identity and maps to icon/fallback presentation.

## State Transitions

### Create Event readiness
1. `courts-selected` -> compute `requiredPlayers`
2. `players-assigned` -> compute `assignedCount`
3. `validation-evaluated` -> submit enabled only when `assignedCount == requiredPlayers`

### Date shortcut usage
1. `shortcut-idle` -> click "Today's date"
2. `date-updated` -> date set to local today
3. `time-preserved` -> previously selected time remains unchanged
