# Research: Player Stats, Search & Monthly Leaderboards

**Feature**: `022-player-stats-search`  
**Date**: 2026-03-05

---

## 1. Backend Architecture Confirmed

### Repository pattern

Every repository receives a `duckdb.DuckDBPyConnection` in `__init__`. SQL is stored in
`backend/app/repositories/sql/<domain>/` files and loaded via
`base.load_sql(path)`. New repos follow the same pattern:

```
backend/app/repositories/sql/player_stats/
```

### Service wiring

`backend/app/api/deps.py` → `services_scope()` is a `@contextmanager` that creates
all repo and service instances then yields them in a dict. New services and repos
must be added here to be available in routers.

### Migration system

`backend/app/db/migrate.py` scans `backend/app/db/migrations/*.sql` in filename
order. `000_schema_migrations.sql` is applied unconditionally on every startup (it
is idempotent — `CREATE TABLE IF NOT EXISTS schema_migrations`). Every other file is
applied exactly once, tracked in `schema_migrations`. Current last migration:
`004_rename_americano_to_winners_court.sql`.  
→ **New migration file**: `005_player_stats.sql`

---

## 2. Event Finalization Hook

`POST /events/{event_id}/finish` (in `routers/events.py`) calls
`summary_service.finish_event()` then writes `EventStatus.FINISHED`. This is the
**only** correct hook for writing player stats — it fires exactly once per event and
only when all rounds are done.

Currently `finish_event` only:
1. Calls `round_service.summarize(event_id)` → returns match/round data.
2. Calls `events_repo.set_status(event_id, FINISHED, ...)`.

Nothing writes player stats yet.

### Stat-write call chain (new)

```
finish_event()
  → player_stats_service.apply_event_stats(event_id, summary)
      → player_stats_repo.upsert_player_stats(player_id, deltas)
      → player_stats_repo.upsert_monthly_player_stats(player_id, year, month, deltas)
      → player_stats_repo.mark_event_applied(event_id)
```

`apply_event_stats` is idempotent:
- First call: `player_stats_repo.is_event_applied(event_id)` returns `False` → apply.
- Repeated call: returns `True` → skip entirely.

---

## 3. Existing Player Search — No New Endpoint Needed

`GET /api/v1/players?query=<str>` already exists in `routers/players.py`:

```python
@router.get("", response_model=list[PlayerResponse])
def list_players(query: str | None = Query(default=None)) -> list[PlayerResponse]:
    ...
    players = services["player_service"].search_players(query)
```

`player_service.search_players(query)` delegates to `players_repo.search(query)` which
does `ILIKE '%<query>%'`. This is an exact match for FR-003 / FR-004.

`frontend/src/lib/api.ts` already exposes `searchPlayers(query)` which calls
`GET /players?query=<query>`.

**Decision**: No new search endpoint required.

---

## 4. New API Endpoints Required

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/players/{player_id}/stats` | FR-008 – FR-015: player stats page data |
| `GET` | `/leaderboards/player-of-month` | FR-018 / FR-019: events-played monthly leaderboard |
| `GET` | `/leaderboards/mexicano-of-month` | FR-020: Mexicano monthly leaderboard |

The leaderboard endpoints are new and will live in a new `leaderboards` router
(`backend/app/api/routers/leaderboards.py`), mounted at `/api/v1/leaderboards`.

The player stats endpoint will be added to the existing `players` router as a nested
path: `GET /players/{player_id}/stats`.

---

## 5. Match Result Derivation (per event type)

Derived from `summary_service._match_value_for_player()` and
`_match_numeric_value_for_player()`:

### Mexicano (`ResultType.SCORE_24`)
- Per-match score: `team1_score` (player on team 1) or `team2_score` (player on team 2).
- Values range 0–24.
- **All-time stat**: sum of all per-match scores across all finalized Mexicano events.

### WinnersCourt (`ResultType.WIN_LOSS`)
- Per-match: `winner_team == player_team` → Win; else → Loss.
- Drawn result not possible (`is_draw` is always `False` for `WIN_LOSS` type).
- **All-time stats**: `wc_matches_played`, `wc_wins`, `wc_losses`.

### BeatTheBox (`ResultType.WIN_LOSS_DRAW`)
- Per-match: `is_draw` → Draw; `winner_team == player_team` → Win; else → Loss.
- Numeric values: Win = 25, Draw = 5, Loss = −15 (used for global ranking).
- **All-time stat**: `btb_score_total` = sum of numeric values; `btb_wins`, `btb_losses`, `btb_draws`.

### Exclusions
- Matches with `status != MatchStatus.COMPLETED` are excluded from all stat counts.

---

## 6. Stats Idempotency Strategy

**Decision**: Track applied events in a dedicated `player_stats_event_log` table with
PK `event_id`. If the row exists, the event has been applied; skip.

Alternative considered — `stats_finalized BOOLEAN` on the `events` table — rejected
because it adds a column to a high-traffic table and the `player_stats_event_log`
approach is more cohesive and testable in isolation.

---

## 7. Monthly Boundary

- Server is UTC (`conn.execute("SET TimeZone='UTC'")`).
- Stats are written with `finalized_at = CURRENT_TIMESTAMP` (UTC).
- Monthly leaderboards filter by `year` and `month` extracted from the `finalized_at`
  timestamp in `monthly_player_stats`.
- **Decision**: UTC calendar month. Spec assumption confirmed: "Calendar month is
  defined as the calendar month in the server's local time zone" — server is UTC, so
  UTC is correct.

---

## 8. Chart Library Decision

**Decision: Inline SVG doughnut** — zero new dependencies.

Rationale:
- The project has zero charting libraries installed.
- Adding `recharts` or `chart.js` would increase bundle size significantly.
- A win/loss(/draw) doughnut with 2–3 segments is a simple arc calculation.
- The existing pattern is to extract pure helper functions into `features/` and test
  them in isolation — an SVG arc helper follows this perfectly.
- A 100%/0% split edge case is trivially handled by rendering a full circle ring.

---

## 9. Navigation — 4th Card

`CardNav.tsx` reads its cards from a `const NAV_CARDS` array. Adding a 4th card is
a one-line array entry:

```typescript
{
  title: "Search Player",
  subtitle: "Look up player statistics",
  to: "/players/search",
  colorClass: "card-nav-card--search",
}
```

A new CSS class `card-nav-card--search` needs a colour. Existing classes use:
- `--create`: green tones
- `--view`: blue tones
- `--register`: purple tones
- `--search` (new): amber/gold tones (distinct from existing three)

---

## 10. Home Page Leaderboards

`Home.tsx` currently renders `export default function HomePage() { return <section className="page-shell" /> }`. The file also contains helper functions used by
`EventSlots.tsx` (exported). These helpers must stay; only the `HomePage` component
body changes.

The leaderboard data will be fetched inside `HomePage` via two new `useEffect` + API
calls on mount. Each leaderboard is a simple ranked list — no pagination required.

---

## 11. Frontend Routes

New routes needed:
- `/players/search` → `SearchPlayerPage`
- `/players/:playerId/stats` → `PlayerStatsPage`

Added to `frontend/src/app/routes.tsx`.

---

## 12. Test Patterns (Confirmed)

From project conventions and prior features:

- **Frontend**: Vitest 2, pure function unit tests only. No `@testing-library/react`.
  All tests in `frontend/tests/`. Must explicitly import Vitest globals (`describe`,
  `it`, `expect`).
- **Backend**: pytest + httpx for integration tests in `backend/tests/`.

New testable pure functions for this feature:
- `playerStatsChartData(wins, losses, draws?)` → SVG arc segment data
- `formatStatValue(n)` → display string for stats counters
- `rankLeaderboardEntries(entries, rankKey)` → sorted + ranked list

---

## 13. Summary: Unknowns Resolved

| Question | Decision |
|----------|----------|
| Stats storage strategy | Materialized tables (`player_stats`, `monthly_player_stats`) written at finalization |
| Idempotency | `player_stats_event_log(event_id)` junction table |
| Chart library | Inline SVG doughnut — zero deps |
| Monthly boundary | UTC calendar month (server is UTC) |
| Search endpoint | Reuse existing `GET /players?query=` |
| New endpoints | 3 new: `GET /players/{id}/stats`, `GET /leaderboards/player-of-month`, `GET /leaderboards/mexicano-of-month` |
| Nav 4th card | Add entry to `NAV_CARDS` array in `CardNav.tsx` + CSS colour class |
| Home page | Replace stub `<section />` body with leaderboard sections |
