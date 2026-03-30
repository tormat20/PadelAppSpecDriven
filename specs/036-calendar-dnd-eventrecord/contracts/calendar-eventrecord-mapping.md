# Contract: Calendar EventRecord Mapping

## Purpose

Define the behavioral contract for mapping existing EventRecord data into calendar-local render/edit state for the drag-and-drop POC.

## Inputs

- EventRecord-compatible event list for a visible week range.

## Output

- CalendarEventViewModel list with EventRecord-aligned semantics.

## Required Mapping Behavior

1. `eventDate` in model must match source event date.
2. `eventTime24h` in model must match source start time, or remain unscheduled/null if missing.
3. `eventType` must be preserved from source event.
4. Team Mexicano display state must resolve from existing metadata (`eventType=Mexicano` + team flag).
5. `durationMinutes` must always be a valid allowed value (`60|90|120`) after mapping.

## Update Behavior After Interaction

1. Drag/drop must update only `eventDate` and `eventTime24h`.
2. Duration changes must update only `durationMinutes`.
3. Event identity and event type must remain unchanged.
4. Updates are local-state only for this POC.

## Validation Expectations

- Invalid times are clamped/snap-adjusted to nearest valid grid slot.
- Invalid duration inputs are normalized to nearest allowed duration option.
