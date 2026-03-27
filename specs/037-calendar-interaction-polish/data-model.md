# Data Model - Calendar interaction modes + template drag-create

## 1) CalendarEventInteractionState

- **Purpose**: Tracks per-gesture interpretation so move and resize do not conflict.

### Fields

- `eventId: string | null` - active event for current interaction.
- `mode: "idle" | "move" | "resize"` - active interaction mode.
- `resizeAnchor: "bottom" | null` - resize origin indicator.
- `startClientY: number | null` - pointer baseline for resize delta.
- `startDurationMinutes: 60 | 90 | 120 | null` - initial duration before resize.

### Validation Rules

- `mode = "resize"` only when pointer starts in bottom 4px zone.
- `mode = "move"` and `mode = "resize"` are mutually exclusive.

## 2) ResizeZone

- **Purpose**: Encodes bottom-edge resize detection boundary for event cards.

### Fields

- `heightPx: 4` - bottom-edge activation thickness.
- `isInResizeZone: boolean` - computed from pointer position relative to card bounds.

### Validation Rules

- Enter resize mode only if `isInResizeZone` is true at pointer down.

## 3) TemplateEventType

- **Purpose**: Defines draggable template source entries for creating calendar events.

### Fields

- `templateId: string` - stable template identifier.
- `displayLabel: string` - user-visible label.
- `eventType: "Americano" | "Mexicano" | "WinnersCourt" | "RankedBox"` - mapped base type.
- `isTeamMexicano: boolean` - true only for Team Mexicano template.

### Validation Rules

- Team Mexicano template must map to `eventType = "Mexicano"` and `isTeamMexicano = true`.

## 4) CalendarEventLocal (existing local model extension)

- **Purpose**: Local event object used on calendar grid and updated through move/resize/create interactions.

### Required Fields (for this feature)

- `id: string`
- `eventName: string` (placeholder accepted for template-created events)
- `eventType`
- `isTeamMexicano: boolean`
- `eventDate: string`
- `eventTime24h: string | null`
- `durationMinutes: 60 | 90 | 120`

### Validation Rules

- Template-created events default to `durationMinutes = 90`.
- Resize updates must keep `durationMinutes` in `60 | 90 | 120`.

## 5) State Transitions

### Move transition

1. Pointer/drag starts on event body (outside resize zone).
2. Interaction state enters `mode = "move"`.
3. Ghost/preview tracks destination slot.
4. On drop, update only `eventDate` and `eventTime24h`.

### Resize transition

1. Pointer down in bottom 4px resize zone.
2. Interaction state enters `mode = "resize"` with baseline values.
3. Pointer delta snaps to 30-minute steps.
4. Duration is normalized/clamped to `60 | 90 | 120`.
5. Event block height/time-range updates immediately.

### Template create transition

1. User drags template type onto a valid slot.
2. New local event is created with mapped type fields and defaults.
3. Event appears in target date/time slot with duration 90.
4. New event supports same move and resize interactions as existing events.
