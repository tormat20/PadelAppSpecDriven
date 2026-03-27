# Data Model - Calendar Drag-and-Drop POC on EventRecord

## 1) CalendarEventViewModel

- **Purpose**: Calendar-local event model used for rendering and drag/drop edits while remaining EventRecord-compatible.
- **Source**: Derived from existing EventRecord API payload.

### Fields

- `id: string` - Event identifier.
- `eventName: string` - Display name shown on event card.
- `eventType: "WinnersCourt" | "Mexicano" | "RankedBox" | "Americano"` - Canonical type from EventRecord.
- `isTeamMexicano: boolean` - Flag for Team Mexicano label rendering.
- `eventDate: string` - ISO date (`YYYY-MM-DD`) used for week-column placement.
- `eventTime24h: string | null` - Start time (`HH:MM`) used for vertical placement.
- `durationMinutes: 60 | 90 | 120` - POC-local duration used for block height and edits.
- `status: "Lobby" | "Running" | "Finished"` - Existing lifecycle status.
- `selectedCourts: number[]` - Existing informational metadata displayed on card.
- `version: number` - Existing optimistic concurrency value (not used for writes in phase 1).

### Validation Rules

- `eventDate` must parse to a valid calendar date.
- `eventTime24h` must be null/empty (unscheduled) or valid `HH:MM`.
- `durationMinutes` must be one of `60`, `90`, `120`.
- `eventType` must stay within the existing EventRecord set.

## 2) WeeklySlot

- **Purpose**: Represents target day/time position for drag/drop calculations.

### Fields

- `dayIndex: number` - Week column index (0-6 relative to selected week start).
- `minutesFromGridStart: number` - Raw/snap-adjusted minutes from calendar grid origin.
- `resolvedDate: string` - ISO date resolved from `dayIndex` and visible week.
- `resolvedTime24h: string` - `HH:MM` resolved from snapped minute position.

### Validation Rules

- `dayIndex` must be clamped to visible week bounds.
- `minutesFromGridStart` must be clamped to valid grid range before conversion.

## 3) DurationOption

- **Purpose**: Allowed set for calendar duration edits.

### Values

- `60`
- `90`
- `120`

### Normalization Rule

- Any attempted duration update outside allowed values must be normalized to the nearest allowed option before writing to calendar state.

## 4) Mapping Contracts

## EventRecord -> CalendarEventViewModel

- Preserve shared fields (`id`, `eventName`, `eventType`, `eventDate`, `eventTime24h`, `status`, `selectedCourts`, `version`).
- Derive `isTeamMexicano` from existing event metadata.
- Derive `durationMinutes` from existing duration-related fields, then normalize to allowed duration set.

## Calendar interaction -> updated CalendarEventViewModel

- Drag/drop updates `eventDate` and `eventTime24h` only.
- Duration edit updates `durationMinutes` only.
- Event type and identity fields remain unchanged during drag/drop and duration edit operations.

## 5) State Transitions

### Drag/drop transition

1. User starts dragging one event card.
2. Calendar resolves target WeeklySlot on hover/drop.
3. On drop, only dragged event receives updated `eventDate` + `eventTime24h`.
4. Updated event re-renders in new slot.

### Duration transition

1. User changes duration through allowed interaction.
2. Input value is validated/normalized to `60|90|120`.
3. Target event `durationMinutes` is updated.
4. Event block height/time range re-renders immediately.
