# Contract: Backend — Date-Range Filter on `GET /api/v1/events`

**Feature**: 030-calendar-scheduling | **Priority**: P1 (required for efficient week navigation)
**Files affected**:
- `backend/app/api/routers/events.py` — MODIFIED (`list_events` endpoint signature)
- `backend/app/repositories/events_repo.py` — MODIFIED (new `list_by_date_range` method)
- `backend/app/repositories/sql/events/list_by_date_range.sql` — NEW
- `backend/app/services/event_service.py` — MODIFIED (new `list_events_by_date_range` method)

---

## Endpoint change

### Before

```
GET /api/v1/events
→ Returns all events (no filter)
```

### After

```
GET /api/v1/events
→ Returns all events (unchanged behaviour when no params supplied)

GET /api/v1/events?from=2026-03-09&to=2026-03-15
→ Returns only events where event_date BETWEEN 2026-03-09 AND 2026-03-15 (inclusive)
```

**Query parameters** (both optional):

| Parameter | Type | Format | Description |
|---|---|---|---|
| `from` | `date` | `YYYY-MM-DD` | Inclusive lower bound on `event_date` |
| `to` | `date` | `YYYY-MM-DD` | Inclusive upper bound on `event_date` |

**Behaviour rules**:
- Both params present → filtered query
- Only `from` present (no `to`) → fall back to unfiltered `list_all()` (simplest safe behaviour; frontend always sends both)
- Only `to` present (no `from`) → fall back to unfiltered `list_all()`
- Neither present → fall back to unfiltered `list_all()` (existing behaviour)
- Invalid date format → FastAPI returns 422 Unprocessable Entity (built-in Pydantic validation)

---

## Router change — `events.py`

```python
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query   # Query added

@router.get("", response_model=list[EventResponse])
def list_events(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> list[EventResponse]:
    with services_scope() as services:
        if from_date is not None and to_date is not None:
            events = services["event_service"].list_events_by_date_range(from_date, to_date)
        else:
            events = services["event_service"].list_events()
        return [
            _to_event_response(
                row["event"],
                row["player_ids"],
                row["courts"],
                row["missing_requirements"],
                row["warnings"],
                row["lifecycle_status"],
            )
            for row in events
        ]
```

---

## New SQL file — `list_by_date_range.sql`

```sql
SELECT id, event_name, event_type, event_date, status,
       round_count, round_duration_minutes, current_round_number,
       event_time, setup_status, version, is_team_mexicano
FROM events
WHERE event_date BETWEEN ? AND ?
ORDER BY event_date ASC, COALESCE(event_time, '00:00') ASC, created_at ASC;
```

Column positions (0-indexed): identical to `list_all.sql`. The `Event` construction code from `list_all()` is copy-pasted verbatim into `list_by_date_range()`.

---

## Repository change — `events_repo.py`

```python
def list_by_date_range(self, from_date: date, to_date: date) -> list[Event]:
    rows = self.conn.execute(
        load_sql("events/list_by_date_range.sql"),
        [from_date.isoformat(), to_date.isoformat()],
    ).fetchall()
    return [
        Event(
            id=row[0],
            event_name=row[1],
            event_type=EventType(row[2]),
            event_date=date.fromisoformat(str(row[3])),
            status=EventStatus(row[4]),
            round_count=row[5],
            round_duration_minutes=row[6],
            current_round_number=row[7],
            event_time=row[8],
            setup_status=SetupStatus(row[9]),
            version=row[10],
            is_team_mexicano=bool(row[11]),
        )
        for row in rows
    ]
```

---

## Service change — `event_service.py`

Add a new `list_events_by_date_range(from_date, to_date)` method that mirrors `list_events()` but calls `repo.list_by_date_range(from_date, to_date)` instead of `repo.list_all()`. The enrichment loop (player IDs, courts, lifecycle status, warnings) is identical.

---

## Frontend — new API function

**File**: `frontend/src/lib/api.ts`

```ts
export async function listEventsByDateRange(
  from: string,   // YYYY-MM-DD
  to: string,     // YYYY-MM-DD
): Promise<EventRecord[]> {
  const res = await fetch(
    `${API_BASE}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: authHeaders() },
  )
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<EventRecord[]>
}
```

Existing `listEvents()` is unchanged.

---

## Test contract

**New test file**: `backend/tests/test_events_date_range_filter.py`

```python
def test_no_params_returns_all_events(client, seed_events):
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    assert len(resp.json()) == len(seed_events)

def test_date_range_filters_correctly(client, seed_events):
    # seed_events has events on 2026-03-08, 2026-03-11, 2026-03-20
    resp = client.get("/api/v1/events?from=2026-03-09&to=2026-03-15")
    assert resp.status_code == 200
    ids = [e["id"] for e in resp.json()]
    assert event_on_march_11.id in ids
    assert event_on_march_08.id not in ids
    assert event_on_march_20.id not in ids

def test_invalid_date_format_returns_422(client):
    resp = client.get("/api/v1/events?from=not-a-date&to=also-not")
    assert resp.status_code == 422

def test_only_from_returns_all_events(client, seed_events):
    # Only one param provided → falls back to list_all
    resp = client.get("/api/v1/events?from=2026-03-01")
    assert resp.status_code == 200
    assert len(resp.json()) == len(seed_events)
```

---

## Acceptance criteria

| FR | Criterion | Verified by |
|---|---|---|
| FR-007b | `GET /api/v1/events?from=…&to=…` returns only events in the range | Backend integration test |
| FR-007b | Frontend uses date-range params when navigating weeks | Frontend test (`calendar-api-integration.test.ts`) |
| — | No params → all events returned (backwards compat) | Backend test |
