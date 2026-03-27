# Contract: Template Drag-Create on Calendar

## Purpose

Define behavior for creating new calendar events by dragging event-type templates onto valid grid slots.

## Template Source Contract

1. Template panel contains five draggable template entries:
   - Americano
   - Mexicano
   - Team Mexicano
   - WinnersCourt
   - RankedBox
2. Templates are visible and available from calendar page without changing route access rules.

## Drop/Create Contract

1. Dropping a template onto a valid slot creates one new local event.
2. New event defaults:
   - `eventDate` from target day
   - `eventTime24h` from target slot
   - `durationMinutes = 90`
   - placeholder `eventName`
3. Team Mexicano template mapping:
   - `eventType = "Mexicano"`
   - `isTeamMexicano = true`

## Invalid Drop Contract

1. Dropping outside valid grid slots creates no event.
2. Existing events are not mutated by invalid template drops.

## Post-Creation Interaction Contract

1. Newly created events support move mode.
2. Newly created events support bottom-edge resize mode.
3. Newly created events obey the same duration constraints as existing events.
