# Contract: Calendar Drag-and-Drop POC Behavior

## Route Contract

- Route: `/calendar`
- Access behavior: unchanged from existing route guards.
- Page behavior: renders interactive weekly calendar instead of placeholder content.

## User-Visible Card Contract

Each scheduled event card must render:

1. Event name.
2. Event type label (Americano, Mexicano, Team Mexicano, WinnersCourt, RankedBox).
3. Time range derived from `eventTime24h` and `durationMinutes`.
4. Duration value.

## Drag-and-Drop Contract

1. User can drag an event card to another valid weekly slot.
2. On drop success, the card appears at the new slot in the same page session.
3. Dragging one event must not mutate unrelated events.
4. Drops outside valid grid bounds must not produce invalid date/time state.

## Duration Edit Contract

1. User can change event duration through the provided duration control.
2. Resulting duration must be constrained to `60`, `90`, or `120` minutes.
3. Updated duration must immediately affect card display (height/time range).

## POC Boundary Contract

1. Calendar state initializes from loaded events.
2. Edits remain local in memory for phase 1.
3. No backend write persistence is required in this feature phase.
