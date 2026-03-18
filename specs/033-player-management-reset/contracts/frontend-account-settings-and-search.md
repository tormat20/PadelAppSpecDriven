# Contract: Frontend — Account Settings & Search Player Pages

**Feature**: 033-player-management-reset | **Priority**: P1–P4
**Files affected**:
- `frontend/src/pages/AccountSettings.tsx` — MODIFIED (Player Management section)
- `frontend/src/pages/SearchPlayer.tsx` — MODIFIED (richer rows, edit mode, per-player delete)
- `frontend/src/lib/api.ts` — MODIFIED (3 new API functions)
- `frontend/src/styles/components.css` — MODIFIED (settings danger action layout)

---

## `api.ts` — 3 new functions

**File**: `frontend/src/lib/api.ts`

Add after the existing player functions:

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

All three use the existing `request<T>()` helper (auth headers, error handling).

---

## `AccountSettings.tsx` — Player Management section

### State additions

```ts
type DialogMode = "reset-stats" | "delete-all" | null

const [confirmDialog, setConfirmDialog] = useState<DialogMode>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
const [statusMessage, setStatusMessage] = useState("")
```

### Handler functions

```ts
async function handleResetStats() {
  setIsSubmitting(true)
  try {
    await resetAllPlayerStats()
    setConfirmDialog(null)
    setStatusMessage("All player stats have been reset.")
  } catch {
    setStatusMessage("Something went wrong. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}

async function handleDeleteAll() {
  setIsSubmitting(true)
  try {
    await deleteAllPlayers()
    setConfirmDialog(null)
    setStatusMessage("All players have been removed.")
  } catch {
    setStatusMessage("Something went wrong. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}
```

### JSX addition (insert after the Court Configuration section)

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
        onClick={() => { setStatusMessage(""); setConfirmDialog("reset-stats") }}
      >
        Reset Player Stats
      </button>
      <button
        type="button"
        className={withInteractiveSurface("button--danger")}
        onClick={() => { setStatusMessage(""); setConfirmDialog("delete-all") }}
      >
        Remove All Players
      </button>
    </div>
    {statusMessage && (
      <p className="settings-status-message" role="status">{statusMessage}</p>
    )}
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
  </div>
)}
```

### New CSS — settings layout helpers

Add to `components.css`:

```css
.settings-section-description {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin: 0 0 var(--space-3);
}

.settings-danger-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.settings-status-message {
  margin-top: var(--space-3);
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}
```

---

## `SearchPlayer.tsx` — Richer rows + Edit mode

### Imports to add

```ts
import { useState } from "react"   // already present
import ConfirmDialog from "../components/ConfirmDialog"
import { deletePlayer } from "../lib/api"
```

### State additions

```ts
const [isEditing, setIsEditing] = useState(false)
const [deletingId, setDeletingId] = useState<string | null>(null)
const [deleteError, setDeleteError] = useState("")
const [isDeleting, setIsDeleting] = useState(false)
```

### `filterPlayers` — export + email matching

```ts
// Change from:
function filterPlayers(...)

// Change to:
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

### Delete handler

```ts
async function handleDeleteConfirmed() {
  if (!deletingId) return
  setIsDeleting(true)
  try {
    await deletePlayer(deletingId)
    setCatalog((prev) => prev.filter((p) => p.id !== deletingId))
    setDeletingId(null)
    setDeleteError("")
  } catch {
    setDeleteError("Could not delete player. Please try again.")
  } finally {
    setIsDeleting(false)
  }
}
```

### Panel header — Edit/Done toggle

The panel that currently holds just `<ul className="player-search-list">` gains a header row:

```tsx
{!loading && !error && filtered.length > 0 && (
  <section className="panel">
    <div className="player-search-panel-header">
      <span className="player-search-count muted">
        {filtered.length} player{filtered.length !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        className={withInteractiveSurface("button-secondary player-search-edit-btn")}
        onClick={() => setIsEditing((v) => !v)}
      >
        {isEditing ? "Done" : "Edit"}
      </button>
    </div>
    {deleteError && (
      <p className="warning-text" role="alert">{deleteError}</p>
    )}
    <ul className="player-search-list" role="list">
      {filtered.map((player) => (
        <li key={player.id} className="player-search-item">
          {isEditing ? (
            <div className={withInteractiveSurface("player-search-row player-search-row--edit")}>
              <span className="player-search-name-group">
                <span className="player-search-name">{player.displayName}</span>
                {player.email && (
                  <span className="player-search-email muted">{player.email}</span>
                )}
              </span>
              <button
                type="button"
                className={withInteractiveSurface("player-search-remove-btn")}
                aria-label={`Remove ${player.displayName}`}
                onClick={() => { setDeleteError(""); setDeletingId(player.id) }}
              >
                −
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={withInteractiveSurface("player-search-row")}
              onClick={() => navigate(`/players/${player.id}/stats`)}
              aria-label={`View stats for ${player.displayName}`}
            >
              <span className="player-search-name-group">
                <span className="player-search-name">{player.displayName}</span>
                {player.email && (
                  <span className="player-search-email muted">{player.email}</span>
                )}
              </span>
              <span className="player-search-arrow" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 13L13 3M13 3H6M13 3V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  </section>
)}
```

### ConfirmDialog for per-player delete

Placed after the main panel (outside, at the end of the JSX return):

```tsx
{deletingId && (() => {
  const player = catalog.find((p) => p.id === deletingId)
  return (
    <ConfirmDialog
      title={`Remove ${player?.displayName ?? "this player"}?`}
      message="This will permanently delete this player and all their data."
      confirmLabel="Yes, remove"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={handleDeleteConfirmed}
      onCancel={() => { setDeletingId(null); setDeleteError("") }}
    />
  )
})()}
```

### New CSS for edit mode

Add to `components.css`:

```css
.player-search-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.player-search-count {
  font-size: 0.8rem;
}

.player-search-edit-btn {
  font-size: 0.8rem;
  padding: var(--space-1) var(--space-2);
}

.player-search-row--edit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  cursor: default;
}

.player-search-remove-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-danger);
  background: transparent;
  color: var(--color-danger);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-search-remove-btn:hover {
  background: var(--color-danger);
  color: #fff;
}
```

---

## Behaviour rules

- Edit mode resets to `false` whenever the user navigates away (natural React unmount).
- Editing mode and the search filter operate independently — deleting a player in edit mode with an active filter removes only that player from `catalog`; the filter re-applies to the updated `catalog`.
- If `filtered.length` drops to 0 after a deletion and `isEditing` is still true, the "Edit"/"Done" header disappears (because the `filtered.length > 0` guard removes the panel). This is acceptable — the empty-state panel renders instead.
- The `catalog` state is the authoritative local list. Deletion mutates it directly via `setCatalog(prev => prev.filter(...))` — no re-fetch required.

---

## Always show email

Per the spec and research decision, email is shown whether or not it is non-null:

| State | Render |
|-------|--------|
| `email` is a non-empty string | Show email text |
| `email` is `null` or `undefined` | Show nothing (no placeholder text, no crash) |

The existing conditional `{player.email && <span>...</span>}` already handles this correctly and is kept as-is.
