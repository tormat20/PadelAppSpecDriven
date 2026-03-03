# Contract: Event Slots Status Layout

## Purpose

Define list-view presentation behavior for planned/ready status in Home > Event Slots.

## Rules

1. Event Slots list includes both planned and ready events.
2. Status indicator uses a dedicated fixed alignment column.
3. Status indicator remains centered in that column for all rows regardless of event name length.
4. Status remains clearly readable in mixed planned/ready lists.

## UI Expectations

1. Long event names do not push status indicators out of alignment.
2. Short event names do not collapse status alignment.
3. Visual scan path for status is consistent across rows.

## Verification Targets

- Frontend layout tests with short/long name fixtures.
- Visual regression or snapshot checks for alignment consistency.
