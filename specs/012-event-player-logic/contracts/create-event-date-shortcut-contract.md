# Contract: Create Event Date Shortcut

## Purpose

Define behavior for the "Today's date" shortcut in create-event flow.

## Rules

1. Shortcut appears as clickable text below the schedule row.
2. Clicking shortcut sets event date field to local today in `YYYY-MM-DD` format.
3. Clicking shortcut does not modify selected time value.

## Verification Targets

- Frontend tests for date helper behavior and schedule normalization.
- Manual verification that native single time input remains unchanged by shortcut usage.
