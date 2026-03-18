# Research: Player Management & Reset Controls (033)

**Branch**: `033-player-management-reset`
**Date**: 2026-03-18

---

## Key Finding: No First/Last Name Split

**Decision**: Display player `displayName` as a single string in search rows (not split into first/surname).
**Rationale**: The player model has always used a single opaque `display_name` field. There is no `first_name`/`last_name` column anywhere in the DB schema, domain model, or API response. Splitting the display name by heuristics (e.g. last word = surname) would be fragile and incorrect for many real names. The spec's "first name, surname" phrasing was written without knowledge of the data model.
**Adaptation**: The search row will show `displayName` prominently and `email` below it — exactly the meaningful identification the user wanted. This already partially exists (email is conditionally rendered); we are making email always visible and improving the layout.
**Alternatives considered**: Adding `first_name`/`last_name` columns via a migration — rejected as out of scope and a breaking schema change with no clear benefit for this feature.

---

## Cascade Delete: Tables to Clean Up Per Player

When deleting a single player or all players, these tables must be cleaned up **before** deleting from `players` (FK enforcement blocks deletion otherwise):

| Table | Player column(s) | Delete clause |
|---|---|---|
| `event_substitutions` | `departing_player_id`, `substitute_player_id` | `WHERE departing_player_id = ? OR substitute_player_id = ?` |
| `event_teams` | `player1_id`, `player2_id` | `WHERE player1_id = ? OR player2_id = ?` |
| `event_players` | `player_id` | `WHERE player_id = ?` |
| `event_scores` | `player_id` | `WHERE player_id = ?` |
| `player_round_scores` | `player_id` | `WHERE player_id = ?` |
| `global_rankings` | `player_id` | `WHERE player_id = ?` |

These tables reference player IDs as raw TEXT (no declared FK) and must also be cleaned for data integrity:

| Table | Player column(s) | Action |
|---|---|---|
| `matches` | `team1_player1_id`, `team1_player2_id`, `team2_player1_id`, `team2_player2_id` | Leave orphaned (historical record) — same behaviour as existing event delete |
| `player_stats` | `player_id` (PK) | `DELETE WHERE player_id = ?` |
| `monthly_player_stats` | `player_id` | `DELETE WHERE player_id = ?` |
| `player_stats_event_log` | no direct player ref | No action on per-player delete |

**Decision**: Match rows in `matches` are left as historical records on player delete (consistent with how `delete_event` works — it deletes matches only by `event_id`, not by player).

---

## Stats Reset: Tables to Clear

A "Reset All Player Stats" wipes accumulated stats while keeping player rows. Tables to clear:

| Table | Action |
|---|---|
| `player_stats` | `DELETE FROM player_stats` (all rows) |
| `monthly_player_stats` | `DELETE FROM monthly_player_stats` (all rows) |
| `player_stats_event_log` | `DELETE FROM player_stats_event_log` (clears idempotency log so events can be re-applied if needed) |
| `global_rankings` | `DELETE FROM global_rankings` |
| `players.global_ranking_score` | `UPDATE players SET global_ranking_score = 0` |

**Decision**: Reset all five in a single backend operation — they are all derived/cached stats. The `player_stats_event_log` must be cleared too, otherwise re-running an event through the system would be a no-op (the idempotency guard would block it).

---

## Remove All Players: Operation Order

```
DELETE FROM event_substitutions
DELETE FROM event_teams
DELETE FROM event_players
DELETE FROM event_scores
DELETE FROM player_round_scores
DELETE FROM global_rankings
DELETE FROM player_stats
DELETE FROM monthly_player_stats
DELETE FROM player_stats_event_log   -- orphaned refs, clean up
DELETE FROM players
```

`matches` rows are left in place (historical, no FK constraint to players).

---

## Backend API Design

**Decision**: Add two new bulk endpoints and one per-player delete endpoint, all admin-only.

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/api/v1/players/{player_id}` | Delete single player + cascade |
| `POST` | `/api/v1/admin/players/reset-stats` | Zero out all player stats |
| `DELETE` | `/api/v1/admin/players` | Delete all players + cascade |

**Rationale**: Admin bulk operations go under `/admin/` prefix to make the destructive nature explicit and to group them separately from the player CRUD router. Single-player delete lives on the player resource at `DELETE /players/{id}` — standard REST convention.

**Auth**: All three endpoints require `require_admin` (same as `POST /players`). The `require_admin` dependency already exists in `backend/app/api/deps.py`.

---

## Frontend Confirmation Dialog

**Decision**: Build a reusable `ConfirmDialog` component using the existing `result-modal-backdrop` / `result-modal` CSS pattern as a base, with new CSS classes for the danger variant.

**Rationale**: The `result-modal` pattern (backdrop + centred panel) is already established and tested. Extending it with `.confirm-dialog` + `.confirm-dialog--danger` classes is lower-risk than introducing a third-party modal library or building from scratch.

**Token**: `--color-danger: #b53f41` already exists. A `.button--danger` class will be introduced following the same structure as `.button` and `.button-secondary`.

---

## Frontend Edit Mode

**Decision**: Edit mode in `SearchPlayer.tsx` is controlled by a single `isEditing: boolean` state variable. Toggling it shows/hides the "−" buttons on each row. No route change, no separate page.

**Rationale**: All filtering and rendering is already client-side in-memory. Adding a boolean toggle is the minimal-complexity approach.

---

## Account Settings: Admin-Only Section

**Decision**: Add a new "Player Management" section to `AccountSettings.tsx` below the existing "Court Configuration" section, rendered only when `user.role === "admin"`. The section contains two buttons:
1. "Reset Player Stats" — warning-level, uses `.button-secondary` style
2. "Remove All Players" — danger-level, uses new `.button--danger` style

**Rationale**: The page already has an `isAdmin` guard for the "Court Configuration" section. The same pattern is reused. No new page or route needed.
