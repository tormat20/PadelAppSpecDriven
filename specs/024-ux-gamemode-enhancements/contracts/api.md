# API Contracts: UX Fixes & Game Mode Enhancements (024)

All contracts follow project conventions:
- Backend: FastAPI, sync `def` handlers, `?` positional params, `services_scope()` context manager
- Auth: Bearer token required on all write endpoints
- Error format: `{"detail": {"code": "ERROR_CODE", "message": "..."}}`

---

## Unchanged Endpoints (no contract changes)

The following endpoints are unchanged in signature; only internal logic changes:

| Endpoint | Change |
|----------|--------|
| `PATCH /api/v1/events/{event_id}` | Guard added: reject if `lifecycleStatus` is `ongoing` or `finished` |
| `POST /api/v1/events/{event_id}/next` | Round cap guard removed for Mexicano events |
| `GET /api/v1/events/{event_id}/summary` | Tiebreaker ordering improved for Mexicano; response shape unchanged |
| `GET /api/v1/events/{event_id}` | Response gains `isTeamMexicano` field |
| `GET /api/v1/events` | Each event response gains `isTeamMexicano` field |
| `POST /api/v1/events` | Request gains optional `isTeamMexicano` field |

---

## Modified: Create Event

**Endpoint**: `POST /api/v1/events`

### Request (additions only — all existing fields unchanged)

```json
{
  "eventName": "Saturday Mexicano",
  "eventType": "Mexicano",
  "eventDate": "2026-03-15",
  "eventTime24h": "10:00",
  "createAction": "create_event",
  "selectedCourts": [1, 2],
  "playerIds": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
  "isTeamMexicano": true
}
```

New field: `isTeamMexicano: bool` (optional, default `false`, only relevant when `eventType == "Mexicano"`)

### Response (additions only — all existing fields unchanged)

```json
{
  "id": "evt-uuid",
  "eventType": "Mexicano",
  "isTeamMexicano": true,
  "...": "...all existing fields unchanged..."
}
```

---

## Modified: Update Event Setup

**Endpoint**: `PATCH /api/v1/events/{event_id}`

### Request (additions only)

```json
{
  "expectedVersion": 1,
  "eventType": "WinnersCourt",
  "isTeamMexicano": false
}
```

New field: `isTeamMexicano: bool | null` (optional; when provided, updates the flag)

### Error: Mode change blocked on ongoing/finished event

**Status**: `409 Conflict`
```json
{
  "detail": {
    "code": "EVENT_MODE_CHANGE_BLOCKED",
    "message": "Event mode can only be changed before the event is started."
  }
}
```

---

## New: Set Team Mexicano Teams

**Endpoint**: `POST /api/v1/events/{event_id}/teams`  
**Auth**: Required (admin)  
**Description**: Assigns fixed team pairs for a Team Mexicano event. Replaces any existing
team assignments for the event (idempotent: call again to re-assign).

### Request

```json
{
  "teams": [
    {"player1Id": "p1", "player2Id": "p2"},
    {"player1Id": "p3", "player2Id": "p4"},
    {"player1Id": "p5", "player2Id": "p6"},
    {"player1Id": "p7", "player2Id": "p8"}
  ]
}
```

Validation:
- All player IDs must be assigned to the event in `event_players`
- No player may appear in more than one team pair
- `eventType` must be `Mexicano` and `isTeamMexicano` must be `true`
- If `len(players) % 2 != 0`, the request is rejected (but this should be blocked earlier by `missing_requirements`)

### Response `200 OK`

```json
{
  "teams": [
    {"id": "team-uuid-1", "eventId": "evt-uuid", "player1Id": "p1", "player2Id": "p2"},
    {"id": "team-uuid-2", "eventId": "evt-uuid", "player1Id": "p3", "player2Id": "p4"}
  ]
}
```

### Errors

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `EVENT_NOT_FOUND` | Event does not exist |
| `409` | `EVENT_NOT_TEAM_MEXICANO` | Event is not a Team Mexicano event |
| `409` | `EVENT_ALREADY_STARTED` | Event is ongoing or finished |
| `422` | (Pydantic) | Player appears in multiple teams, or unknown player ID |

---

## New: Get Team Mexicano Teams

**Endpoint**: `GET /api/v1/events/{event_id}/teams`  
**Auth**: Required  
**Description**: Returns the fixed team assignments for a Team Mexicano event.

### Response `200 OK`

```json
{
  "teams": [
    {"id": "team-uuid-1", "eventId": "evt-uuid", "player1Id": "p1", "player2Id": "p2"},
    {"id": "team-uuid-2", "eventId": "evt-uuid", "player1Id": "p3", "player2Id": "p4"}
  ]
}
```

Returns an empty `teams` list if no teams have been assigned yet.

---

## New: Substitute Player

**Endpoint**: `POST /api/v1/events/{event_id}/substitute`  
**Auth**: Required (admin)  
**Description**: Replaces a player for all future rounds of an ongoing event.
The substitution takes effect from the next round; the current in-progress round
is not modified.

### Request

```json
{
  "departingPlayerId": "player-uuid-old",
  "substitutePlayerId": "player-uuid-new"
}
```

`substitutePlayerId` must reference an existing player in the player catalogue.
If the organiser wants to use a new player, they must create the player first via
`POST /api/v1/players` and then call this endpoint.

### Response `200 OK`

```json
{
  "substitutionId": "sub-uuid",
  "eventId": "evt-uuid",
  "departingPlayerId": "player-uuid-old",
  "substitutePlayerId": "player-uuid-new",
  "effectiveFromRound": 3
}
```

`effectiveFromRound` = current round number + 1.

### Errors

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `EVENT_NOT_FOUND` | Event does not exist |
| `409` | `EVENT_NOT_ONGOING` | Event is not in `ongoing` state |
| `404` | `PLAYER_NOT_IN_EVENT` | `departingPlayerId` is not currently assigned to this event |
| `404` | `SUBSTITUTE_NOT_FOUND` | `substitutePlayerId` does not exist in the player catalogue |
| `409` | `SUBSTITUTE_ALREADY_IN_EVENT` | `substitutePlayerId` is already assigned to this event |

---

## Response Shape Change: EventResponse

All event-returning endpoints gain `isTeamMexicano: bool`:

```json
{
  "id": "evt-uuid",
  "eventName": "Saturday Mexicano",
  "eventType": "Mexicano",
  "isTeamMexicano": true,
  "eventDate": "2026-03-15",
  "eventTime24h": "10:00",
  "status": "Lobby",
  "setupStatus": "planned",
  "lifecycleStatus": "planned",
  "missingRequirements": ["team_mexicano_odd_players"],
  "warnings": {"pastDateTime": false, "duplicateSlot": false, "duplicateCount": 0},
  "version": 1,
  "selectedCourts": [1, 2],
  "playerIds": ["p1", "p2", "p3", "p4", "p5"],
  "currentRoundNumber": null,
  "totalRounds": 6
}
```

### Missing Requirements: New value for Team Mexicano

When `isTeamMexicano = true` and player count is odd:
```json
"missingRequirements": ["team_mexicano_odd_players"]
```

---

## No New Endpoint: Stories 1, 2, 3, 7, 8, 9

- **S1 (UserMenu z-index)**: Frontend CSS only
- **S2 (player name split)**: Frontend JSX/CSS only
- **S3 (open in new window)**: Frontend JS only
- **S7 (unlimited rounds)**: Backend logic change in existing `POST /next` — no signature change
- **S8 (tiebreaker)**: Backend ordering logic change — existing `GET /summary` response gains
  accurate ranking, no schema change
- **S9 (documentation)**: Markdown files only
