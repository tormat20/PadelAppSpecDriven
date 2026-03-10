# Contract: Backend — Expose `roundDurationMinutes` in EventResponse

**Feature**: 030-calendar-scheduling | **Priority**: P1 (blocks all duration-based calendar rendering)
**Files affected**:
- `backend/app/api/schemas/events.py` — MODIFIED
- `backend/app/api/routers/events.py` — MODIFIED (`_to_event_response` builder)

---

## What changes

### `EventResponse` Pydantic schema

Add one field at the end of the model (before `isTeamMexicano`):

```python
roundDurationMinutes: int
```

Full updated class:

```python
class EventResponse(BaseModel):
    id: str
    eventName: str
    eventType: EventType
    eventDate: date
    eventTime24h: str | None
    status: EventStatus
    setupStatus: SetupStatus
    lifecycleStatus: Literal["planned", "ready", "ongoing", "finished"]
    missingRequirements: list[str]
    warnings: PlanningWarningsResponse
    version: int
    selectedCourts: list[int]
    playerIds: list[str]
    currentRoundNumber: int | None
    totalRounds: int
    roundDurationMinutes: int          # ← NEW
    isTeamMexicano: bool
```

### `_to_event_response()` builder in `events.py`

Add the new keyword argument:

```python
def _to_event_response(...) -> EventResponse:
    return EventResponse(
        id=event.id,
        eventName=event.event_name,
        eventType=event.event_type,
        eventDate=event.event_date,
        eventTime24h=event.event_time,
        status=event.status,
        setupStatus=event.setup_status,
        lifecycleStatus=lifecycle_status,
        missingRequirements=missing_requirements,
        warnings=PlanningWarningsResponse(**warnings),
        version=event.version,
        selectedCourts=courts,
        playerIds=player_ids,
        currentRoundNumber=event.current_round_number,
        totalRounds=event.round_count,
        roundDurationMinutes=event.round_duration_minutes,   # ← NEW
        isTeamMexicano=event.is_team_mexicano,
    )
```

This single builder is used by **all** event endpoints (`list_events`, `get_event`, `create_event`, `update_event`, `restart_event`), so adding it once propagates everywhere.

---

## What does NOT change

- No SQL changes — `round_duration_minutes` is already SELECTed in `list_all.sql` and `get_by_id.sql`.
- No migration — column exists.
- No `Event` domain model changes — `round_duration_minutes` is already an attribute.
- No service layer changes — value is already on the model object.

---

## Test contract

**New test file**: `backend/tests/test_event_response_duration.py`

```python
# Verify roundDurationMinutes is present and correct in the API response
def test_list_events_includes_round_duration_minutes(client, seed_event):
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert "roundDurationMinutes" in data[0]
    assert isinstance(data[0]["roundDurationMinutes"], int)

def test_get_event_includes_round_duration_minutes(client, seed_event):
    resp = client.get(f"/api/v1/events/{seed_event.id}")
    assert resp.status_code == 200
    assert "roundDurationMinutes" in resp.json()
```

---

## Acceptance criteria

| FR | Criterion | Verified by |
|---|---|---|
| FR-003 | `round_count × roundDurationMinutes` is computable from API response | Backend test + frontend type check |
| A1 | `roundDurationMinutes` present in all event list and single-event responses | Backend test |
