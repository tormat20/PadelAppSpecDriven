# Quickstart: Player Management & Reset Controls (033)

**Branch**: `033-player-management-reset` | **Date**: 2026-03-18

This guide gives an implementer everything needed to start coding immediately. Read the contracts for full detail; this file is the fast-start reference.

---

## Run tests

```bash
# Backend
cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q

# Frontend
cd frontend && npm test -- --run
```

All existing tests must remain green after every change.

---

## Implementation order (recommended)

Backend first (unblocks frontend type-checking and API calls), then frontend bottom-up.

```
Step 1  Backend — PlayerService & repos: delete_player, delete_all_players, reset_all_player_stats
Step 2  Backend — New DELETE /players/{id} endpoint
Step 3  Backend — New admin router (POST /admin/players/reset-stats + DELETE /admin/players)
Step 4  Backend — Register admin router in main.py + update deps.py
Step 5  Backend — Write backend tests (test_player_delete.py)
Step 6  Frontend — Add deletePlayer, resetAllPlayerStats, deleteAllPlayers to api.ts
Step 7  Frontend — Write filterPlayers unit test (player-search-filter.test.ts)
Step 8  Frontend — Build ConfirmDialog component + CSS
Step 9  Frontend — AccountSettings: Player Management section (US1 + US2)
Step 10 Frontend — SearchPlayer: richer rows + edit mode + per-player delete (US3 + US4)
```

---

## Step 1 — Backend: repository + service methods

### `PlayersRepository` — add `delete` and `delete_all`

**File**: `backend/app/repositories/players_repo.py`

```python
def delete(self, player_id: str) -> None:
    """Cascade-delete one player and all dependent records."""
    self.conn.execute(
        "DELETE FROM event_substitutions WHERE departing_player_id = ? OR substitute_player_id = ?",
        [player_id, player_id],
    )
    self.conn.execute(
        "DELETE FROM event_teams WHERE player1_id = ? OR player2_id = ?",
        [player_id, player_id],
    )
    for table, column in [
        ("event_players", "player_id"),
        ("event_scores", "player_id"),
        ("player_round_scores", "player_id"),
        ("global_rankings", "player_id"),
        ("player_stats", "player_id"),
        ("monthly_player_stats", "player_id"),
    ]:
        self.conn.execute(f"DELETE FROM {table} WHERE {column} = ?", [player_id])
    self.conn.execute("DELETE FROM players WHERE id = ?", [player_id])

def delete_all(self) -> None:
    """Delete every player and all dependent records."""
    for stmt in [
        "DELETE FROM event_substitutions",
        "DELETE FROM event_teams",
        "DELETE FROM event_players",
        "DELETE FROM event_scores",
        "DELETE FROM player_round_scores",
        "DELETE FROM global_rankings",
        "DELETE FROM player_stats",
        "DELETE FROM monthly_player_stats",
        "DELETE FROM player_stats_event_log",
        "DELETE FROM players",
    ]:
        self.conn.execute(stmt)
```

### `PlayerStatsRepository` — add `reset_all_stats`

**File**: `backend/app/repositories/player_stats_repo.py`

```python
def reset_all_stats(self) -> None:
    """Zero all player stats, rankings, and idempotency log."""
    for stmt in [
        "DELETE FROM player_stats",
        "DELETE FROM monthly_player_stats",
        "DELETE FROM player_stats_event_log",
        "DELETE FROM global_rankings",
        "UPDATE players SET global_ranking_score = 0",
    ]:
        self.conn.execute(stmt)
```

### `PlayerService` — add 3 methods + accept `player_stats_repo`

**File**: `backend/app/services/player_service.py`

```python
from app.repositories.player_stats_repo import PlayerStatsRepository

class PlayerService:
    def __init__(
        self,
        players_repo: PlayersRepository,
        player_stats_repo: PlayerStatsRepository | None = None,
    ):
        self.players_repo = players_repo
        self.player_stats_repo = player_stats_repo

    # ...existing methods unchanged...

    def delete_player(self, player_id: str) -> bool:
        existing = self.players_repo.get(player_id)
        if not existing:
            return False
        self.players_repo.delete(player_id)
        return True

    def delete_all_players(self) -> None:
        self.players_repo.delete_all()

    def reset_all_player_stats(self) -> None:
        if self.player_stats_repo is None:
            raise RuntimeError("player_stats_repo required")
        self.player_stats_repo.reset_all_stats()
```

Run tests:
```bash
cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q
```
Expected: all pass (no endpoints yet, but service is callable).

---

## Step 2 — Backend: `DELETE /players/{player_id}`

**File**: `backend/app/api/routers/players.py`

Add at the end of the file (before any trailing blank lines):

```python
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

Ensure `HTTPException` is already imported (it is in the existing router).

---

## Step 3 — Backend: admin router

**New file**: `backend/app/api/routers/admin.py`

```python
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


@router.delete("/players", status_code=200)
def delete_all_players(
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        services["player_service"].delete_all_players()
    return {"status": "ok"}
```

---

## Step 4 — Backend: wire everything together

### `deps.py` — pass `player_stats_repo` to `PlayerService`

**File**: `backend/app/api/deps.py`

Find the line:
```python
player_service = PlayerService(players_repo)
```

Change to:
```python
player_service = PlayerService(players_repo, player_stats_repo)
```

Do the same in `read_services_scope` if `PlayerService` is constructed there (it is not currently, but check).

### `main.py` — register admin router

**File**: `backend/app/main.py`

```python
from app.api.routers.admin import router as admin_router
# ...
app.include_router(admin_router, prefix=settings.api_prefix)
```

Run tests:
```bash
cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q
```
Expected: all pass.

---

## Step 5 — Backend: write tests

**New file**: `backend/tests/test_player_delete.py`

Key test cases (use the existing test fixtures for creating players and getting an admin token):
1. `DELETE /api/v1/players/{id}` → 200, player gone
2. `DELETE /api/v1/players/nonexistent` → 404
3. `DELETE /api/v1/players/{id}` with non-admin token → 403
4. `POST /api/v1/admin/players/reset-stats` → 200
5. `POST /api/v1/admin/players/reset-stats` with non-admin token → 403
6. `DELETE /api/v1/admin/players` → 200, player list empty
7. `DELETE /api/v1/admin/players` with non-admin token → 403
8. `DELETE /api/v1/admin/players` when already empty → 200 (idempotent)

```bash
cd backend && PYTHONPATH=. uv run python -m pytest tests/test_player_delete.py -v
```

---

## Step 6 — Frontend: new API functions

**File**: `frontend/src/lib/api.ts`

Append after the existing player functions (near `searchPlayers`):

```ts
export async function deletePlayer(playerId: string): Promise<void> {
  await request<{ status: string }>(`/players/${encodeURIComponent(playerId)}`, {
    method: "DELETE",
  })
}

export async function resetAllPlayerStats(): Promise<void> {
  await request<{ status: string }>("/admin/players/reset-stats", {
    method: "POST",
  })
}

export async function deleteAllPlayers(): Promise<void> {
  await request<{ status: string }>("/admin/players", {
    method: "DELETE",
  })
}
```

Run frontend tests:
```bash
cd frontend && npm test -- --run
```
Expected: all pass.

---

## Step 7 — Frontend: unit test for `filterPlayers`

**New file**: `frontend/tests/player-search-filter.test.ts`

```ts
import { describe, it, expect } from "vitest"
import { filterPlayers } from "../src/pages/SearchPlayer"
import type { PlayerApiRecord } from "../src/lib/api"

const players: PlayerApiRecord[] = [
  { id: "1", displayName: "Anna Berg", email: "anna@example.com" },
  { id: "2", displayName: "Carlos Font", email: "carlos@example.com" },
  { id: "3", displayName: "Maria Soto", email: null },
]

describe("filterPlayers", () => {
  it("returns all players when query is empty", () => {
    expect(filterPlayers(players, "")).toHaveLength(3)
  })
  it("filters by displayName (case-insensitive)", () => {
    expect(filterPlayers(players, "anna")).toEqual([players[0]])
  })
  it("filters by email", () => {
    expect(filterPlayers(players, "carlos@")).toEqual([players[1]])
  })
  it("returns empty array when no match", () => {
    expect(filterPlayers(players, "zzznomatch")).toHaveLength(0)
  })
  it("handles null email without crashing", () => {
    expect(filterPlayers(players, "soto")).toEqual([players[2]])
  })
  it("trims whitespace from query", () => {
    expect(filterPlayers(players, "  anna  ")).toEqual([players[0]])
  })
})
```

This test will **fail** until `filterPlayers` is exported from `SearchPlayer.tsx` (Step 10). Write the test file now, implement the export in Step 10.

Run tests to confirm the expected failure:
```bash
cd frontend && npm test -- --run
```

---

## Step 8 — Frontend: ConfirmDialog + CSS

### New component

**New file**: `frontend/src/components/ConfirmDialog.tsx`

See `contracts/frontend-confirm-dialog-and-css.md` for the full component source. Key points:
- Uses `.result-modal-backdrop` + `.result-modal.confirm-dialog` (existing + new CSS classes)
- `variant="danger"` → confirm button gets `.button--danger`
- Backdrop click calls `onCancel`
- All buttons disabled when `isLoading`

### CSS additions

**File**: `frontend/src/styles/components.css`

Append new classes (see `contracts/frontend-confirm-dialog-and-css.md` for full CSS):
- `.button--danger`
- `.confirm-dialog`, `.confirm-dialog__title`, `.confirm-dialog__message`, `.confirm-dialog__actions`

Run frontend tests:
```bash
cd frontend && npm test -- --run
```
Expected: all pass (component has no unit tests; CSS is visual-only).

---

## Step 9 — Frontend: AccountSettings Player Management section

**File**: `frontend/src/pages/AccountSettings.tsx`

1. Add imports: `useState`, `ConfirmDialog`, `resetAllPlayerStats`, `deleteAllPlayers`, `withInteractiveSurface`
2. Add local state: `confirmDialog`, `isSubmitting`, `statusMessage`
3. Add handler functions: `handleResetStats`, `handleDeleteAll`
4. Add JSX section after Court Configuration block (see `contracts/frontend-account-settings-and-search.md`)
5. Add CSS to `components.css`: `.settings-section-description`, `.settings-danger-actions`, `.settings-status-message`

Manual test:
- Log in as admin → Account Settings → "Reset Player Stats" → confirm → success message shown
- Log in as admin → Account Settings → "Remove All Players" → confirm → success message shown
- Cancel on each dialog → no change

---

## Step 10 — Frontend: SearchPlayer richer rows + edit mode

**File**: `frontend/src/pages/SearchPlayer.tsx`

1. Export `filterPlayers` (add `export` keyword) + add email matching
2. Add imports: `ConfirmDialog`, `deletePlayer`
3. Add state: `isEditing`, `deletingId`, `deleteError`, `isDeleting`
4. Add `handleDeleteConfirmed` handler
5. Replace the player list JSX with the panel-header + edit-mode version (see contract)
6. Add CSS to `components.css`: panel header + edit mode classes

Run frontend tests (Step 7 test should now pass):
```bash
cd frontend && npm test -- --run
```
Expected: all pass including `player-search-filter.test.ts`.

Manual test:
- Player Search → rows show name + email (if present)
- Search by email → results filtered correctly
- "Edit" → "−" buttons appear, "Edit" → "Done"
- "Done" → back to normal mode
- "−" → confirmation dialog naming the player → "Yes, remove" → player gone, no reload
- Cancel → player still present

---

## Files to touch

| File | Action | Step |
|------|--------|------|
| `backend/app/repositories/players_repo.py` | Modify | 1 |
| `backend/app/repositories/player_stats_repo.py` | Modify | 1 |
| `backend/app/services/player_service.py` | Modify | 1 |
| `backend/app/api/routers/players.py` | Modify | 2 |
| `backend/app/api/routers/admin.py` | Create | 3 |
| `backend/app/api/deps.py` | Modify | 4 |
| `backend/app/main.py` | Modify | 4 |
| `backend/tests/test_player_delete.py` | Create | 5 |
| `frontend/src/lib/api.ts` | Modify | 6 |
| `frontend/tests/player-search-filter.test.ts` | Create | 7 |
| `frontend/src/components/ConfirmDialog.tsx` | Create | 8 |
| `frontend/src/styles/components.css` | Modify | 8, 9, 10 |
| `frontend/src/pages/AccountSettings.tsx` | Modify | 9 |
| `frontend/src/pages/SearchPlayer.tsx` | Modify | 10 |

---

## Key constraints (never break these)

1. **All tests must pass** before committing — `npm test -- --run` + `pytest tests/ -q`
2. **TypeScript zero errors** — `cd frontend && npx tsc --noEmit`
3. **CSS tokens only** — no hardcoded hex values; use `var(--color-danger)` etc.
4. **`withInteractiveSurface()`** on all interactive buttons
5. **Admin-only** — all 3 new API endpoints require `require_admin`; AccountSettings buttons only shown when `isAdmin`
6. **No page reload** on per-player delete — mutate `catalog` state directly

---

## Contracts (detailed per-story specs)

- [`contracts/backend-player-delete-endpoints.md`](./contracts/backend-player-delete-endpoints.md)
- [`contracts/frontend-confirm-dialog-and-css.md`](./contracts/frontend-confirm-dialog-and-css.md)
- [`contracts/frontend-account-settings-and-search.md`](./contracts/frontend-account-settings-and-search.md)
