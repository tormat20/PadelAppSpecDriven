# Contract: Create Event Stepper Page

**File**: `src/pages/CreateEvent.tsx` (refactored)  
**Feature**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Purpose

The Create Event page orchestrates the full 3-step creation flow. It owns all
form state, stepper navigation state, API calls, and error handling. It renders
the `Stepper` component with the correct active step content as its child.

---

## URL & Route

- **New event**: `/events/create`
- **Edit existing event**: `/events/create?editEventId=<id>`

---

## Mounted State

```ts
// Stepper navigation (transient)
currentStep: 0 | 1 | 2     // derived from lifecycleStatus on edit mount
direction: 1 | -1           // starts at 1; updated on each navigation

// Step 1 — Setup fields
eventName: string           // "" on new; pre-filled from event on edit
eventDate: string           // "" on new; pre-filled from event on edit
eventTime24h: string        // "" on new; pre-filled from event on edit
eventType: EventType        // "WinnersCourt" on new; pre-filled on edit

// Step 2 — Roster fields
courts: number[]            // [] on new; pre-filled from event on edit
assignedPlayers: AssignedPlayer[]  // loadDraftPlayers() on new; pre-filled on edit

// Metadata
savedEventId: string        // "" until Step 1 Next saves slot; then event.id
expectedVersion: number     // 1 on new; event.version after each save
events: EventRecord[]       // fetched from listEvents() for duplicate detection

// Error states
step1Error: string          // shown inline on Step 1 when API call fails
step2Error: string          // shown inline on Step 2 when API call fails
```

---

## Mount Behavior

### New event (`editEventId` is empty)

1. Initialize all fields to defaults.
2. `currentStep = 0`, `direction = 1`.
3. Fetch `listEvents()` for duplicate detection.

### Edit event (`editEventId` is present)

1. Fetch `getEvent(editEventId)`.
2. If `lifecycleStatus` is `"ongoing"` or `"finished"` → immediately redirect to
   `/events/:editEventId/preview`.
3. Otherwise, pre-fill all form fields from the fetched event.
4. Set `savedEventId = editEventId`.
5. Set `expectedVersion = event.version`.
6. Derive `currentStep` via `getStartStep(event.lifecycleStatus)`.
7. Set `direction = 1`.

---

## Step Navigation Logic

### `handleNext()` — called by the active step's Next button

| Current step | Action |
|--------------|--------|
| 0 (Setup) | Call `createEvent` (new) or `updateEvent` (edit). On success: `savedEventId = event.id`, `expectedVersion = event.version`, `direction = 1`, `currentStep = 1`. On error: set `step1Error`, stay on Step 0. |
| 1 (Roster) | Call `updateEvent(savedEventId, { courts, playerIds })`. On success: `expectedVersion = event.version`, `direction = 1`, `currentStep = 2`. On error: set `step2Error`, stay on Step 1. |
| 2 (Confirm) | N/A — Step 2 has "Start Event" button, not "Next". |

### `handlePrevious()` — called by the active step's Previous button

| Current step | Action |
|--------------|--------|
| 1 (Roster) | `direction = -1`, `currentStep = 0`. No API call. |
| 2 (Confirm) | `direction = -1`, `currentStep = 1`. No API call. |

### `handleStepClick(index)` — called when a completed step indicator is clicked

- `direction = -1`
- `currentStep = index`

---

## Step 0 (Setup) — Disabled / Enabled Conditions

"Next" button on Step 0 is disabled when `isCreateEventDisabled({ eventName, eventDate, eventTime24h, courts: [], playerIds: [] })` returns `true`.

This means the button is enabled only when:
- `eventName.trim().length >= 2`
- `eventDate` is non-empty
- `eventTime24h` passes the HH:MM format check (when present)

---

## Step 1 (Roster) — Disabled / Enabled Conditions

"Next" button on Step 1 is always enabled (roster can be saved even if not fully ready —
the backend will set `lifecycleStatus = "planned"` or `"ready"` based on completeness).

There is no blocking validation on Step 1 — courts and players are optional for the PATCH.

---

## Step 2 (Confirm) — Start Event Conditions

"Start Event" button on Step 2 is disabled unless `isStrictCreateEventDisabled(...)` returns `false`, i.e., when:
- All Step 0 fields are valid, AND
- `courts.length > 0`, AND
- `assignedPlayers.length === getRequiredPlayerCount(courts)`

When disabled, a brief inline note explains the missing requirement.

---

## Navigation After Start Event

On successful `startEvent(savedEventId)`:
1. `clearDraftPlayers()`
2. Navigate to `/events/:savedEventId/run`

---

## Main Menu Navigation

A "Main Menu" button is accessible from every step (visible at all times in the page header or step footer). It calls `navigate("/")`. It does NOT clear the draft or delete the event — any saved slot persists.

---

## Duplicate / Past-Schedule Warnings

Both warnings from the current `CreateEvent.tsx` are preserved in Step 0:
- **Past schedule warning**: shown when `isPastSchedule({ eventDate, eventTime24h })` is true
- **Duplicate warning**: shown when another event in `events` has the same name + date + time

These appear inline below the event name input on Step 0.

---

## Rendered Structure (simplified)

```tsx
<section className="page-shell" aria-label="Create event page">
  <header className="page-header panel">
    <h2>{isEditMode ? "Edit Event" : "Create Event"}</h2>
    {/* Main Menu button lives here */}
  </header>

  <Stepper
    steps={[{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]}
    currentStep={currentStep}
    direction={direction}
    onStepClick={handleStepClick}
  >
    {currentStep === 0 && <SetupStep ... />}
    {currentStep === 1 && <RosterStep ... />}
    {currentStep === 2 && <ConfirmStep ... />}
  </Stepper>
</section>
```
