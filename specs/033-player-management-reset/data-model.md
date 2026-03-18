# Data Model: Player Management & Reset Controls (033)

**Branch**: `033-player-management-reset` | **Date**: 2026-03-18

---

## No Schema Migrations Required

All data is in existing tables. This feature adds **no new columns, no new tables, and no migration file**. It only adds delete/reset operations on existing rows.

---

## Backend Changes

### 1. New SQL file — `players/delete.sql`

**File**: `backend/app/repositories/sql/players/delete.sql`

```sql
-- Cascade-delete a single player and all their dependent records.
-- Order matters: FK-constrained tables first, then players itself.
DELETE FROM event_substitutions
WHERE departing_player_id = ? OR substitute_player_id = ?;

DELETE FROM event_teams
WHERE player1_id = ? OR player2_id = ?;

DELETE FROM event_players   WHERE player_id = ?;
DELETE FROM event_scores    WHERE player_id = ?;
DELETE FROM player_round_scores WHERE player_id = ?;
DELETE FROM global_rankings WHERE player_id = ?;
DELETE FROM player_stats    WHERE player_id = ?;
DELETE FROM monthly_player_stats WHERE player_id = ?;
DELETE FROM players         WHERE id = ?;
```

**Parameter binding order** (9 params, some repeated for dual-column tables):

| Position | Value |
|----------|-------|
| 1 | `player_id` (event_substitutions departing) |
| 2 | `player_id` (event_substitutions substitute) |
| 3 | `player_id` (event_teams player1) |
| 4 | `player_id` (event_teams player2) |
| 5–9 | `player_id` × 5 (event_players, event_scores, player_round_scores, global_rankings, player_stats) |
| 10 | `player_id` (monthly_player_stats) |
| 11 | `player_id` (players) |

**Note**: DuckDB executes multi-statement SQL in one `execute()` call. Each statement is a separate `conn.execute()` call in the repository method (see section 3 below) for clarity and to avoid DuckDB multi-statement edge cases.

---

### 2. New SQL file — `players/delete_all.sql`

**File**: `backend/app/repositories/sql/players/delete_all.sql`

```sql
DELETE FROM event_substitutions;
DELETE FROM event_teams;
DELETE FROM event_players;
DELETE FROM event_scores;
DELETE FROM player_round_scores;
DELETE FROM global_rankings;
DELETE FROM player_stats;
DELETE FROM monthly_player_stats;
DELETE FROM player_stats_event_log;
DELETE FROM players;
```

Each statement is issued as a separate `conn.execute()` call (no params needed).

---

### 3. New SQL file — `player_stats/reset_all.sql`

**File**: `backend/app/repositories/sql/player_stats/reset_all.sql`

```sql
DELETE FROM player_stats;
DELETE FROM monthly_player_stats;
DELETE FROM player_stats_event_log;
DELETE FROM global_rankings;
UPDATE players SET global_ranking_score = 0;
```

Each statement is issued as a separate `conn.execute()` call.

---

### 4. `PlayersRepository` — new methods

**File**: `backend/app/repositories/players_repo.py`

```python
def delete(self, player_id: str) -> None:
    """Cascade-delete one player and all their dependent records."""
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
    """Delete every player and all their dependent records."""
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

**Rationale for inline SQL** (not `.sql` files): These are short multi-statement sequences where inline strings are cleaner and easier to audit than separate files. The pattern matches how `delete_event` works in `events_repo.py`.

---

### 5. `PlayerStatsRepository` — new method

**File**: `backend/app/repositories/player_stats_repo.py`

```python
def reset_all_stats(self) -> None:
    """Zero out all player stats, rankings, and clear the idempotency log."""
    for stmt in [
        "DELETE FROM player_stats",
        "DELETE FROM monthly_player_stats",
        "DELETE FROM player_stats_event_log",
        "DELETE FROM global_rankings",
        "UPDATE players SET global_ranking_score = 0",
    ]:
        self.conn.execute(stmt)
```

---

### 6. `PlayerService` — new methods

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

    def delete_player(self, player_id: str) -> bool:
        """Delete a player and all their data. Returns True if player existed, False if not found."""
        existing = self.players_repo.get(player_id)
        if not existing:
            return False
        self.players_repo.delete(player_id)
        return True

    def delete_all_players(self) -> None:
        """Remove every player and all associated data."""
        self.players_repo.delete_all()

    def reset_all_player_stats(self) -> None:
        """Zero all stats for every player without removing players."""
        if self.player_stats_repo is None:
            raise RuntimeError("player_stats_repo required for reset_all_player_stats")
        self.player_stats_repo.reset_all_stats()
```

**Note on `services_scope`**: `PlayerService` currently receives only `players_repo`. The `deps.py` `services_scope` must be updated to also pass `player_stats_repo` when constructing `PlayerService`:

```python
# In services_scope():
player_service = PlayerService(players_repo, player_stats_repo)
```

---

### 7. New router — `backend/app/api/routers/admin.py`

```python
from fastapi import APIRouter, Depends, HTTPException
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

### 8. Updated router — `backend/app/api/routers/players.py`

Add one new endpoint to the existing players router:

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

---

### 9. `main.py` — register admin router

```python
from app.api.routers.admin import router as admin_router
# ...
app.include_router(admin_router, prefix=settings.api_prefix)
```

---

## Frontend Changes

### 10. `api.ts` — new API functions

**File**: `frontend/src/lib/api.ts`

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

All three use the existing `request<T>()` helper which automatically attaches the Bearer token and throws `ApiError` on non-2xx.

---

### 11. Pure helper — `filterPlayers` update

**File**: `frontend/src/pages/SearchPlayer.tsx`

The existing `filterPlayers` function filters on `displayName` only. It must be extended to also match on `email`:

```ts
// Before
function filterPlayers(players: PlayerApiRecord[], query: string): PlayerApiRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return players
  return players.filter((p) => p.displayName.toLowerCase().includes(q))
}

// After
export function filterPlayers(players: PlayerApiRecord[], query: string): PlayerApiRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return players
  return players.filter(
    (p) =>
      p.displayName.toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q),
  )
}
```

**Export** (`export function`) is required so the unit test can import it.

---

### 12. New `ConfirmDialog` component

**File**: `frontend/src/components/ConfirmDialog.tsx`

```tsx
type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: "default" | "danger"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps)
```

Renders as:
- `.result-modal-backdrop` wrapping `.result-modal.confirm-dialog`
- Inside: `<h2>` title, `<p>` message, two buttons
- Confirm button: `.button--danger` when `variant="danger"`, `.button` otherwise
- Cancel button: `.button-secondary`
- While `isLoading`: confirm button disabled + shows "…" text

---

### 13. CSS additions

**File**: `frontend/src/styles/components.css`

New classes to add:

```css
/* Danger button — mirrors .button but uses --color-danger */
.button--danger { ... }

/* ConfirmDialog overrides for the result-modal panel */
.confirm-dialog { ... }
.confirm-dialog__title { ... }
.confirm-dialog__message { ... }
.confirm-dialog__actions { ... }
```

Full CSS is defined in the contract file `contracts/frontend-confirm-dialog-and-css.md`.

---

### 14. `AccountSettings.tsx` — Player Management section

Add a new `{isAdmin && ...}` section below "Court Configuration":

```tsx
{isAdmin && (
  <div className="settings-section">
    <h2 className="settings-section-title">Player Management</h2>
    <p className="settings-section-description">
      Destructive operations — these cannot be undone.
    </p>
    <div className="settings-danger-actions">
      <button
        type="button"
        className={withInteractiveSurface("button-secondary")}
        onClick={() => setConfirmDialog("reset-stats")}
      >
        Reset Player Stats
      </button>
      <button
        type="button"
        className={withInteractiveSurface("button--danger")}
        onClick={() => setConfirmDialog("delete-all")}
      >
        Remove All Players
      </button>
    </div>
    {confirmDialog === "reset-stats" && (
      <ConfirmDialog
        title="Reset All Player Stats?"
        message="This will clear all stats for every player. Players themselves will not be removed."
        confirmLabel="Yes, reset"
        variant="default"
        isLoading={isSubmitting}
        onConfirm={handleResetStats}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    {confirmDialog === "delete-all" && (
      <ConfirmDialog
        title="Remove All Players?"
        message="This will permanently delete all players and all associated data. This cannot be undone."
        confirmLabel="Yes, delete all"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    {statusMessage && (
      <p className="settings-status-message" role="status">{statusMessage}</p>
    )}
  </div>
)}
```

Local state added to `AccountSettingsPage`:

```ts
const [confirmDialog, setConfirmDialog] = useState<"reset-stats" | "delete-all" | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
const [statusMessage, setStatusMessage] = useState("")
```

---

### 15. `SearchPlayer.tsx` — Edit mode + per-player delete

New state added:

```ts
const [isEditing, setIsEditing] = useState(false)
const [deletingId, setDeletingId] = useState<string | null>(null)
const [deleteError, setDeleteError] = useState("")
```

Panel header area gains an "Edit" / "Done" toggle button (top-right).

Each player row in edit mode gains a "−" button (`.player-search-remove-btn`) that sets `deletingId`.

When `deletingId` is set, a `ConfirmDialog` is shown naming the specific player.

On confirm: calls `deletePlayer(deletingId)`, removes the player from `catalog` state, closes dialog — no page reload.

The `filterPlayers` function is exported for unit testing (see section 11).

---

## No Type Changes Required

`PlayerApiRecord` already has `email?: string | null`. No changes to `types.ts` are needed.
