# Data Model: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Feature**: `021-confetti-podium-ux`  
**Date**: 2026-03-04

## Backend API Changes

### `FinalSummaryResponse` (add field)

**File**: `backend/app/api/schemas/summary.py`

```python
# Before
class FinalSummaryResponse(BaseModel):
    event_id: str
    event_name: str
    is_final: bool
    player_rows: list[PlayerRowResponse]
    ...

# After — add:
    event_type: str   # "Mexicano" | "WinnersCourt" | "BeatTheBox"
```

**Router change** (`backend/app/api/routers/events.py`):

```python
# In the summary endpoint, add to FinalSummaryResponse(...) constructor:
event_type=event.event_type.value,
```

No database migration required — `event_type` already exists on the `Event` domain object.

---

## Frontend Type Changes

### `FinalEventSummary` (add field)

**File**: `frontend/src/lib/types.ts`

```typescript
// Before
export interface FinalEventSummary {
  eventId: string;
  eventName: string;
  isFinal: boolean;
  playerRows: PlayerRow[];
  ...
}

// After — add:
  eventType: EventType;  // "Mexicano" | "WinnersCourt" | "BeatTheBox"
```

### `normalizeFinalSummaryResponse` (pass through field)

**File**: `frontend/src/lib/api.ts`

```typescript
// Add to the normalization mapping:
eventType: data.event_type as EventType,
```

---

## New Logical Entities

### `PodiumSlot`

A logical concept representing one podium position. Not persisted — derived at render time.

```typescript
interface PodiumSlot {
  place: 1 | 2 | 3;          // podium position
  label: string;              // "1st", "2nd", "3rd"
  players: string[];          // 1 name (Mexicano) or 2 names (WinnersCourt)
  heightClass: string;        // "podium-slot--first" | "podium-slot--second" | "podium-slot--third"
}
```

### `RosterHints`

Pure function output from `rosterHints.ts`.

```typescript
interface RosterHints {
  showChooseCourts: boolean;    // true when courts.length === 0
  showAssignPlayers: boolean;   // true when courts.length > 0 && players.length !== courts.length * 4
}
```

---

## API Response Shape (after change)

```json
GET /events/{id}/summary
{
  "event_id": "abc123",
  "event_name": "Tuesday Mexicano",
  "is_final": true,
  "event_type": "Mexicano",
  "player_rows": [
    { "rank": 1, "player_name": "Alice", "total_points": 48, "wins": 3 },
    { "rank": 2, "player_name": "Bob",   "total_points": 42, "wins": 2 },
    { "rank": 3, "player_name": "Carol", "total_points": 38, "wins": 2 }
  ]
}
```
