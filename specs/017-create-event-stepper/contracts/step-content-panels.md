# Contract: Step Content Panels

**File**: inline in `src/pages/CreateEvent.tsx`  
**Feature**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Overview

The three step panels are rendered inside `CreateEvent.tsx` as the `children`
of the `Stepper` component. They receive their props directly from the page's
state and handlers. They are not extracted as separate components (they are
domain-specific to Create Event and would not be reused elsewhere).

---

## Step 0 — Setup Panel

**Purpose**: Collect the minimum required information to create an event slot.

### Inputs

| Field | Component | Binding |
|-------|-----------|---------|
| Event mode | `ModeAccordion` | `eventType` / `setEventType` |
| Event date | `<input type="date">` | `eventDate` / `setEventDate` |
| Event time | `<input type="time" step={60}>` | `eventTime24h` / `setEventTime24h` |
| Event name | `<input placeholder="Event name">` | `eventName` / `setEventName` |

### Derived displays

- **"Today's date" button**: fills `eventDate` with `getTodayDateISO()`
- **Past-schedule warning**: shown when `isPastSchedule({ eventDate, eventTime24h })` is true
- **Duplicate warning**: shown when `events` contains an event with matching name + date + time
- **Auto-name**: `getRecommendedEventName(...)` sets `eventName` when date + time are filled (new events only)

### Actions

| Button | Enabled when | Behaviour |
|--------|-------------|-----------|
| Next | `!isCreateEventDisabled({ eventName, eventDate, eventTime24h, courts: [], playerIds: [] })` | Calls `handleNext()` — creates or updates slot |
| Main Menu | Always | `navigate("/")` |

### Error display

When `step1Error` is non-empty, render an inline `<p className="warning-text">`
below the Next button with the API error message.

---

## Step 1 — Roster Panel

**Purpose**: Select courts and assign players to the event.

### Inputs

| Field | Component | Binding |
|-------|-----------|---------|
| Courts | `CourtSelector` | `courts` / `setCourts` |
| Players | `PlayerSelector` | `assignedPlayers` / `setAssignedPlayers` |

### Derived displays

- **Player count progress**: `"{ assignedPlayers.length } / { getRequiredPlayerCount(courts) } players"` — helps user track readiness.
- **Required player count hint**: e.g. `"{ courts.length } courts × 4 players required"` rendered as `.muted` text.

### Actions

| Button | Enabled when | Behaviour |
|--------|-------------|-----------|
| Next | Always (no blocking validation on roster save) | Calls `handleNext()` — saves courts + players |
| Previous | Always | Calls `handlePrevious()` — navigates back to Step 0 |
| Main Menu | Always | `navigate("/")` |

### Error display

When `step2Error` is non-empty, render an inline `<p className="warning-text">`
below the Next button with the API error message.

---

## Step 2 — Confirm Panel

**Purpose**: Show a read-only summary and provide the "Start Event" action.

### Summary fields (read-only)

| Label | Value source |
|-------|-------------|
| Event | `eventName` |
| Mode | `getEventModeLabel(eventType)` |
| Date | `eventDate` |
| Time | `eventTime24h` (shown as-is, or "—" if empty) |
| Courts | `courts.length` |
| Players | `assignedPlayers.length` |

Rendered using existing `.summary-row` CSS class pattern from `components.css`.

### Actions

| Button | Enabled when | Behaviour |
|--------|-------------|-----------|
| Start Event | `!isStrictCreateEventDisabled({ eventName, eventDate, eventTime24h, courts, playerIds })` | Calls `startEvent(savedEventId)` → navigate to run |
| Previous | Always | Calls `handlePrevious()` — back to Step 1 |
| Main Menu | Always | `navigate("/")` |

### Disabled Start Event helper text

When "Start Event" is disabled, show a `<p className="warning-text">` with a clear explanation.
Logic mirrors the existing `PreviewEvent.tsx` pattern:
```
"Add players and courts to start event"
```
Or, if courts are set but player count is wrong:
```
"{ getRequiredPlayerCount(courts) - assignedPlayers.length } more players needed to start"
```

---

## CSS Layout for Step Panels

Each step panel is wrapped in a `<div className="panel form-grid">` (matching
the current Create Event left-column style). The `Stepper` component wraps
the animated region in `.stepper-content` which clips overflow during transitions.

The two-column grid (`grid-columns-2 create-event-grid`) used in the current
`CreateEvent.tsx` is removed. Each step is a single full-width column panel.
This keeps the stepper layout clean and avoids competing with the slide animation.

On Step 1 (Roster), the `PlayerSelector` renders below the `CourtSelector` within
the same single-column panel — stacked vertically rather than side-by-side.

---

## Shared Navigation: Main Menu Button

The "Main Menu" button appears in the page `<header>` above the stepper, so it is
always accessible from any step without counting as part of the step action row.
This fulfills FR-013 ("A 'Main Menu' navigation option MUST be accessible from every step
without discarding already-saved progress").
