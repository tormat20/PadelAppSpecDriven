# Data Model: 3-Step Create Event Stepper

**Feature**: `017-create-event-stepper`  
**Branch**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Overview

This feature is entirely frontend. No backend schema changes are needed.
The data model documented here describes:

1. **Step index and direction** — transient UI state
2. **`CreateEventDraft`** — local in-memory state aggregating form fields across all three steps
3. **Step entry conditions** — rules derived from server-side `EventRecord.lifecycleStatus`
4. **Existing types referenced** — `EventRecord`, `EventType`, `CreateEventPayload`, `UpdateEventPayload` (all unchanged)

---

## 1. Step Index and Direction (Transient UI State)

These are `useState` values inside `CreateEventPage`. They are never persisted.

```
currentStep: 0 | 1 | 2
  0 = Setup
  1 = Roster
  2 = Confirm

direction: 1 | -1
  1 = moving forward (Next pressed)
 -1 = moving backward (Previous pressed or completed step indicator clicked)
```

**Transitions**:

| Action | `currentStep` change | `direction` |
|--------|----------------------|-------------|
| "Next" pressed on Step 0 | 0 → 1 | 1 |
| "Next" pressed on Step 1 | 1 → 2 | 1 |
| "Previous" pressed on Step 1 | 1 → 0 | -1 |
| "Previous" pressed on Step 2 | 2 → 1 | -1 |
| Completed Step 0 indicator clicked from Step 1 or 2 | → 0 | -1 |
| Completed Step 1 indicator clicked from Step 2 | → 1 | -1 |

---

## 2. `CreateEventDraft` — In-Memory Form State

The draft holds all form fields across the three steps. It lives as individual
`useState` values in `CreateEventPage` (not a single object) — matching the
existing `CreateEvent.tsx` pattern to minimize refactoring complexity.

```ts
// Step 1 — Setup
eventName: string         // default: "" (auto-populated by getRecommendedEventName)
eventDate: string         // default: "" (ISO date, e.g. "2026-03-15")
eventTime24h: string      // default: "" (HH:MM format, optional for slot creation)
eventType: EventType      // default: "WinnersCourt"

// Step 2 — Roster
courts: number[]          // default: []
assignedPlayers: AssignedPlayer[]  // default: loadDraftPlayers() from localStorage

// Cross-step metadata
editEventId: string       // from URL search param ?editEventId=...; "" if new
savedEventId: string      // set after Step 1 Next saves the slot; used in Step 2 and Step 3
expectedVersion: number   // optimistic concurrency version from server; default: 1
```

**`savedEventId`** is the key addition: when a user starts a new event, Step 1
creates the slot and stores the returned event ID here. Steps 2 and 3 then call
`updateEvent(savedEventId, ...)` rather than always deriving the ID from the URL.
For the edit flow, `savedEventId` is pre-populated with `editEventId` on mount.

---

## 3. Step Entry Conditions

Step entry conditions determine which step to open at when loading the page.
These are derived from the server-returned `EventRecord.lifecycleStatus`.

| `lifecycleStatus` | `currentStep` on mount | Rationale |
|-------------------|------------------------|-----------|
| `undefined` / not present (new event) | 0 | No event exists yet; user starts at Setup |
| `"planned"` | 1 | Slot created with mode/date/name; user resumes at Roster |
| `"ready"` | 2 | Courts and players assigned; user resumes at Confirm |
| `"ongoing"` | (not shown) | Stepper not rendered; PreviewEvent page handles this |
| `"finished"` | (not shown) | Stepper not rendered; PreviewEvent page handles this |

**Guard** in `CreateEventPage`: if the fetched event's `lifecycleStatus` is
`"ongoing"` or `"finished"`, redirect to `/events/:id/preview` immediately.
This preserves the existing behavior described in spec edge case:
> "The stepper is not shown for ongoing/finished events; those remain on the existing Preview page."

---

## 4. Per-Step "Next" Action Payloads

### Step 0 → Step 1 (Save slot)

**New event** (no `editEventId`):
```ts
createEvent({
  eventName,
  eventType,
  eventDate,
  eventTime24h,
  createAction: "create_event_slot",
  selectedCourts: [],
  playerIds: [],
})
// → returns EventRecord; store event.id as savedEventId, event.version as expectedVersion
```

**Editing existing planned slot** (has `editEventId`):
```ts
updateEvent(editEventId, {
  expectedVersion,
  eventName,
  eventType,
  eventDate,
  eventTime24h,
})
// → returns EventRecord; update expectedVersion
```

### Step 1 → Step 2 (Save roster)

```ts
updateEvent(savedEventId, {
  expectedVersion,
  selectedCourts: courts,
  playerIds: assignedPlayers.map(p => p.id),
})
// → returns EventRecord; update expectedVersion
// If response.lifecycleStatus === "ready": event is promoted automatically by backend
```

### Step 2 — Start Event

Uses the existing `startEvent(savedEventId)` API call (no payload change). On success,
navigate to `/events/:savedEventId/run`.

---

## 5. Step Indicator State Mapping

The Stepper indicator component receives a `currentStep` index and renders
each step circle in one of three visual states:

```
index < currentStep  → "complete"   (filled circle with checkmark, clickable)
index === currentStep → "active"    (highlighted circle with dot)
index > currentStep  → "inactive"   (numbered circle, muted, not clickable)
```

Clicking a "complete" indicator calls `onStepClick(index)` on the Stepper,
which sets `currentStep` to that index and `direction` to `-1`.

---

## 6. Existing Types Referenced (unchanged)

All types are sourced from `src/lib/types.ts`. No new types are added to `types.ts`.

| Type | Used in | Purpose |
|------|---------|---------|
| `EventType` | Step 1 state, payloads | `"WinnersCourt" \| "Mexicano" \| "BeatTheBox"` |
| `EventRecord` | Fetched on edit mount, returned from save APIs | Full event shape including `lifecycleStatus` |
| `CreateEventPayload` | Step 0 Next action | Slot creation payload |
| `UpdateEventPayload` | Step 0 Next (edit) and Step 1 Next actions | Roster update payload |
| `AssignedPlayer` (from `draftPlayers.ts`) | Step 1 player list state | `{ id: string; displayName: string }` |

---

## 7. Local Type Additions (new, inside `CreateEvent.tsx`)

A small helper type is defined inline in `CreateEvent.tsx` (not exported) to
document the step resume logic clearly:

```ts
type StepperStartStep = 0 | 1 | 2

function getStartStep(lifecycleStatus: EventRecord["lifecycleStatus"]): StepperStartStep {
  if (lifecycleStatus === "ready")    return 2
  if (lifecycleStatus === "planned")  return 1
  return 0
}
```

No changes to `src/lib/types.ts` are required.
