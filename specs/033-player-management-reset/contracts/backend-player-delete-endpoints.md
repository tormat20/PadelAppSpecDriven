# Contract: Backend — Player Delete Endpoints

**Feature**: 033-player-management-reset | **Priority**: P1 (US1), P2 (US2), P4 (US4)
**Files affected**:
- `backend/app/api/routers/players.py` — MODIFIED (new `DELETE /{player_id}`)
- `backend/app/api/routers/admin.py` — NEW
- `backend/app/main.py` — MODIFIED (register admin router)
- `backend/app/services/player_service.py` — MODIFIED (3 new methods)
- `backend/app/repositories/players_repo.py` — MODIFIED (2 new methods)
- `backend/app/repositories/player_stats_repo.py` — MODIFIED (1 new method)
- `backend/app/api/deps.py` — MODIFIED (pass `player_stats_repo` to `PlayerService`)

---

## Endpoint 1 — `DELETE /api/v1/players/{player_id}`

### Request

```
DELETE /api/v1/players/{player_id}
Authorization: Bearer <admin-token>
```

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{"status": "ok"}` | Player found and deleted |
| 404 | `{"detail": "Player not found."}` | No player with that ID |
| 401 | — | Missing or invalid token |
| 403 | — | Token is not admin role |

### Behaviour

1. Checks that the player exists via `players_repo.get(player_id)`.
2. If not found → 404.
3. Deletes from dependent tables in FK-safe order (see `data-model.md` section 4).
4. Deletes from `players`.
5. Returns `{"status": "ok"}`.

**Decision**: Deletion is always allowed even if the player is in an active event (per spec edge case resolution). The active event may show a missing player slot but continues uninterrupted.

### Router code

```python
# In backend/app/api/routers/players.py

@router.delete("/{player_id}", status_code=200)
def delete_player(
    player_id: str,
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        found = services["player_service"].delete_player(player_id)
    if not found:
        raise HTTPException(status_code=404, detail="Player not found.")
    return {"status": "ok"}
```

---

## Endpoint 2 — `POST /api/v1/admin/players/reset-stats`

### Request

```
POST /api/v1/admin/players/reset-stats
Authorization: Bearer <admin-token>
```

No request body.

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{"status": "ok"}` | Stats cleared (even if no rows existed) |
| 401 | — | Missing or invalid token |
| 403 | — | Token is not admin role |

### Behaviour

1. Executes (in order):
   - `DELETE FROM player_stats`
   - `DELETE FROM monthly_player_stats`
   - `DELETE FROM player_stats_event_log`
   - `DELETE FROM global_rankings`
   - `UPDATE players SET global_ranking_score = 0`
2. Returns `{"status": "ok"}`.

**Decision**: Idempotent — calling when there are no stats is a no-op that still returns 200.

### Router code

```python
# In backend/app/api/routers/admin.py

from fastapi import APIRouter, Depends
from app.api.deps import TokenData, require_admin, services_scope

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/players/reset-stats", status_code=200)
def reset_all_player_stats(
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        services["player_service"].reset_all_player_stats()
    return {"status": "ok"}
```

---

## Endpoint 3 — `DELETE /api/v1/admin/players`

### Request

```
DELETE /api/v1/admin/players
Authorization: Bearer <admin-token>
```

No request body.

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{"status": "ok"}` | All players deleted (even if list was already empty) |
| 401 | — | Missing or invalid token |
| 403 | — | Token is not admin role |

### Behaviour

1. Executes (in order):
   - `DELETE FROM event_substitutions`
   - `DELETE FROM event_teams`
   - `DELETE FROM event_players`
   - `DELETE FROM event_scores`
   - `DELETE FROM player_round_scores`
   - `DELETE FROM global_rankings`
   - `DELETE FROM player_stats`
   - `DELETE FROM monthly_player_stats`
   - `DELETE FROM player_stats_event_log`
   - `DELETE FROM players`
2. Returns `{"status": "ok"}`.

**Decision**: `matches` rows are left as historical records (same behaviour as `delete_event`).

### Router code

```python
# In backend/app/api/routers/admin.py (continued)

@router.delete("/players", status_code=200)
def delete_all_players(
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        services["player_service"].delete_all_players()
    return {"status": "ok"}
```

---

## `deps.py` — `services_scope` update

`PlayerService` must receive `player_stats_repo` as a second argument so `reset_all_player_stats()` works:

```python
# In services_scope():
player_service = PlayerService(players_repo, player_stats_repo)
```

---

## `main.py` — register admin router

```python
from app.api.routers.admin import router as admin_router
# ...
app.include_router(admin_router, prefix=settings.api_prefix)
```

After this, the full URL prefix is `/api/v1/admin/...`.

---

## Backend tests

**New test file**: `backend/tests/test_player_delete.py`

Test cases:
1. `DELETE /players/{id}` returns 200 and player is gone from `GET /players/search`
2. `DELETE /players/{id}` with unknown ID returns 404
3. `DELETE /players/{id}` with non-admin token returns 403
4. `POST /admin/players/reset-stats` returns 200; re-fetching leaderboard shows zero scores
5. `POST /admin/players/reset-stats` with non-admin token returns 403
6. `DELETE /admin/players` returns 200; `GET /players/search` returns empty list
7. `DELETE /admin/players` with non-admin token returns 403
8. `DELETE /admin/players` when list is already empty returns 200 (idempotent)
