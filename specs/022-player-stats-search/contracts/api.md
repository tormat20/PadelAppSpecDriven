# API Contracts: Player Stats, Search & Monthly Leaderboards

**Feature**: `022-player-stats-search`  
**Date**: 2026-03-05  
**Base URL**: `http://127.0.0.1:8000/api/v1`

---

## Existing Endpoints Used (No Changes)

### `GET /players?query=<string>`

Used by the Search Player page. Already exists; no changes required.

**Request**: `GET /api/v1/players?query=ali`  
**Response**: `200 OK`

```json
[
  { "id": "abc123", "displayName": "Alice Mora", "globalRankingScore": 1250 },
  { "id": "def456", "displayName": "Alicia Vega", "globalRankingScore": 980 }
]
```

- `query` is optional. If omitted, returns all players.
- Matching is case-insensitive substring (`ILIKE '%query%'`).

---

## New Endpoint 1 — Player Stats

### `GET /players/{player_id}/stats`

Returns all-time aggregate statistics for one player.

**Path**: `GET /api/v1/players/{player_id}/stats`

**Path parameter**:
| Param | Type | Description |
|-------|------|-------------|
| `player_id` | `string` | UUID of the player |

**Success response**: `200 OK`

```json
{
  "player_id": "abc123",
  "display_name": "Alice Mora",
  "mexicano_score_total": 312,
  "btb_score_total": 145,
  "events_attended": 7,
  "wc_matches_played": 18,
  "wc_wins": 11,
  "wc_losses": 7,
  "btb_wins": 4,
  "btb_losses": 2,
  "btb_draws": 1
}
```

**Notes**:
- If the player exists but has no finalized events, all numeric fields return `0`.
- If the player does not exist: `404 Not Found`

```json
{ "detail": "Player not found" }
```

---

## New Endpoint 2 — Player of the Month Leaderboard

### `GET /leaderboards/player-of-month`

Returns a ranked list of all players who participated in at least one finalized event
in the current calendar month. Ranked by:
1. `events_played` descending (primary)
2. `mexicano_score` descending (tiebreaker 1)
3. `btb_score` descending (tiebreaker 2)

**Path**: `GET /api/v1/leaderboards/player-of-month`

**Query parameters**: None (current UTC month is derived server-side)

**Success response**: `200 OK`

```json
{
  "year": 2026,
  "month": 3,
  "entries": [
    {
      "rank": 1,
      "player_id": "abc123",
      "display_name": "Alice Mora",
      "events_played": 3,
      "mexicano_score": 88,
      "btb_score": 50
    },
    {
      "rank": 2,
      "player_id": "def456",
      "display_name": "Bob Patel",
      "events_played": 2,
      "mexicano_score": 64,
      "btb_score": 25
    }
  ]
}
```

**Empty month response**: `200 OK` with an empty entries array:

```json
{ "year": 2026, "month": 3, "entries": [] }
```

**Notes**:
- Players tied on all three criteria receive the same rank; the next rank skips
  accordingly (dense ranking is acceptable — implementation detail).
- Players who have only played in previous months do not appear.

---

## New Endpoint 3 — Mexicano Player of the Month Leaderboard

### `GET /leaderboards/mexicano-of-month`

Returns a ranked list of players ordered by total Mexicano points accumulated in
the current calendar month. Players who participated only in non-Mexicano events
are excluded.

**Path**: `GET /api/v1/leaderboards/mexicano-of-month`

**Query parameters**: None

**Success response**: `200 OK`

```json
{
  "year": 2026,
  "month": 3,
  "entries": [
    {
      "rank": 1,
      "player_id": "abc123",
      "display_name": "Alice Mora",
      "events_played": 2,
      "mexicano_score": 88,
      "btb_score": 0
    },
    {
      "rank": 2,
      "player_id": "ghi789",
      "display_name": "Carlos Ruiz",
      "events_played": 1,
      "mexicano_score": 72,
      "btb_score": 0
    }
  ]
}
```

**Empty month response**: `200 OK` with empty entries.

**Notes**:
- `events_played` here counts only Mexicano events this month.
- `btb_score` is `0` for all entries (not relevant to this leaderboard, included
  for response shape consistency).

---

## Frontend ↔ Backend Field Mapping

The frontend normalizer in `api.ts` converts snake_case to camelCase:

| Backend field | Frontend field |
|---------------|---------------|
| `player_id` | `playerId` |
| `display_name` | `displayName` |
| `mexicano_score_total` | `mexicanoScoreTotal` |
| `btb_score_total` | `btbScoreTotal` |
| `events_attended` | `eventsAttended` |
| `wc_matches_played` | `wcMatchesPlayed` |
| `wc_wins` | `wcWins` |
| `wc_losses` | `wcLosses` |
| `btb_wins` | `btbWins` |
| `btb_losses` | `btbLosses` |
| `btb_draws` | `btbDraws` |
| `events_played` (leaderboard) | `eventsPlayed` |
| `mexicano_score` (leaderboard) | `mexicanoScore` |
| `btb_score` (leaderboard) | `btbScore` |

---

## Error Responses (Standard Shape)

All errors follow the existing FastAPI `HTTPException` format:

```json
{ "detail": "<message or error object>" }
```

| Status | Scenario |
|--------|---------|
| `404` | Player not found in `/players/{id}/stats` |
| `500` | Unexpected server error — surface as generic error state in UI |
