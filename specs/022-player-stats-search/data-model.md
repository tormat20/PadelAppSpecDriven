# Data Model: Player Stats, Search & Monthly Leaderboards

**Feature**: `022-player-stats-search`  
**Date**: 2026-03-05

---

## New Database Tables

### `player_stats` — All-time aggregate per player

```sql
CREATE TABLE IF NOT EXISTS player_stats (
  player_id              TEXT PRIMARY KEY,
  mexicano_score_total   INTEGER NOT NULL DEFAULT 0,
  btb_score_total        INTEGER NOT NULL DEFAULT 0,
  events_attended        INTEGER NOT NULL DEFAULT 0,
  wc_matches_played      INTEGER NOT NULL DEFAULT 0,
  wc_wins                INTEGER NOT NULL DEFAULT 0,
  wc_losses              INTEGER NOT NULL DEFAULT 0,
  btb_wins               INTEGER NOT NULL DEFAULT 0,
  btb_losses             INTEGER NOT NULL DEFAULT 0,
  btb_draws              INTEGER NOT NULL DEFAULT 0,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `monthly_player_stats` — Per-player per-calendar-month aggregates

```sql
CREATE TABLE IF NOT EXISTS monthly_player_stats (
  player_id       TEXT    NOT NULL,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL,
  events_played   INTEGER NOT NULL DEFAULT 0,
  mexicano_score  INTEGER NOT NULL DEFAULT 0,
  btb_score       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, year, month)
);
```

### `player_stats_event_log` — Idempotency guard

```sql
CREATE TABLE IF NOT EXISTS player_stats_event_log (
  event_id      TEXT PRIMARY KEY,
  applied_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

All three tables are created together in migration `005_player_stats.sql`.

---

## Backend Domain Models

No new domain dataclasses are needed — stats are query results, not first-class
domain entities. They are represented directly by Pydantic response schemas.

---

## New Pydantic Schemas

**File**: `backend/app/api/schemas/stats.py` (new file)

```python
from pydantic import BaseModel


class PlayerStatsResponse(BaseModel):
    player_id: str
    display_name: str
    mexicano_score_total: int
    btb_score_total: int
    events_attended: int
    wc_matches_played: int
    wc_wins: int
    wc_losses: int
    btb_wins: int
    btb_losses: int
    btb_draws: int


class LeaderboardEntryResponse(BaseModel):
    rank: int
    player_id: str
    display_name: str
    events_played: int        # for player-of-month
    mexicano_score: int       # for both leaderboards
    btb_score: int            # for player-of-month tiebreaker


class LeaderboardResponse(BaseModel):
    year: int
    month: int
    entries: list[LeaderboardEntryResponse]
```

---

## New Repository

**File**: `backend/app/repositories/player_stats_repo.py`

```python
class PlayerStatsRepository:
    def __init__(self, conn): ...

    def is_event_applied(self, event_id: str) -> bool: ...
    def mark_event_applied(self, event_id: str) -> None: ...

    def upsert_player_stats(self, player_id: str, deltas: dict) -> None: ...
    # deltas keys: mexicano_score_delta, btb_score_delta, events_attended_delta,
    #              wc_matches_played_delta, wc_wins_delta, wc_losses_delta,
    #              btb_wins_delta, btb_losses_delta, btb_draws_delta

    def upsert_monthly_player_stats(
        self, player_id: str, year: int, month: int, deltas: dict
    ) -> None: ...
    # deltas keys: events_played_delta, mexicano_score_delta, btb_score_delta

    def get_player_stats(self, player_id: str) -> dict | None: ...
    # Returns raw row dict or None if no stats row exists yet

    def get_player_of_month(self, year: int, month: int) -> list[dict]: ...
    # Returns list of {player_id, events_played, mexicano_score, btb_score}
    # ordered by (events_played DESC, mexicano_score DESC, btb_score DESC)

    def get_mexicano_of_month(self, year: int, month: int) -> list[dict]: ...
    # Returns list of {player_id, mexicano_score}
    # ordered by mexicano_score DESC, excludes players with mexicano_score == 0
```

SQL files go in `backend/app/repositories/sql/player_stats/`:

| File | Purpose |
|------|---------|
| `is_event_applied.sql` | SELECT from `player_stats_event_log` |
| `mark_event_applied.sql` | INSERT into `player_stats_event_log` |
| `upsert_player_stats.sql` | INSERT … ON CONFLICT UPDATE with delta arithmetic |
| `upsert_monthly_player_stats.sql` | INSERT … ON CONFLICT UPDATE with delta arithmetic |
| `get_player_stats.sql` | SELECT all columns from `player_stats` by `player_id` |
| `get_player_of_month.sql` | Aggregated monthly leaderboard query with JOIN to `players` |
| `get_mexicano_of_month.sql` | Monthly Mexicano leaderboard query with JOIN to `players` |

---

## New Service

**File**: `backend/app/services/player_stats_service.py`

```python
class PlayerStatsService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
        players_repo: PlayersRepository,
        player_stats_repo: PlayerStatsRepository,
    ): ...

    def apply_event_stats(self, event_id: str) -> None:
        """
        Idempotently write player stats for a finished event.
        Reads all matches in the event, accumulates per-player deltas,
        then upserts into player_stats and monthly_player_stats.
        No-ops if event_id already in player_stats_event_log.
        """
        ...

    def get_player_stats(self, player_id: str) -> dict:
        """Returns all-time stats dict for one player. Returns zero-filled
        dict if no stats row exists yet (player has no finalized events)."""
        ...

    def get_player_of_month_leaderboard(self, year: int, month: int) -> list[dict]:
        """Returns player-of-month leaderboard for given year/month."""
        ...

    def get_mexicano_of_month_leaderboard(self, year: int, month: int) -> list[dict]:
        """Returns Mexicano-of-month leaderboard for given year/month."""
        ...
```

---

## Wiring Changes

### `backend/app/api/deps.py`

Add `PlayerStatsRepository` and `PlayerStatsService` to `services_scope()`:

```python
from app.repositories.player_stats_repo import PlayerStatsRepository
from app.services.player_stats_service import PlayerStatsService

# Inside services_scope():
player_stats_repo = PlayerStatsRepository(conn)
player_stats_service = PlayerStatsService(
    events_repo, rounds_repo, matches_repo, players_repo, player_stats_repo
)

yield {
    ...
    "player_stats_service": player_stats_service,
}
```

### `backend/app/services/summary_service.finish_event()`

Add call to `player_stats_service.apply_event_stats(event_id)` **after**
`events_repo.set_status(...)`. The service must be injected into `SummaryService`:

```python
# summary_service.py — constructor addition
def __init__(self, ..., player_stats_service: PlayerStatsService):
    ...
    self.player_stats_service = player_stats_service

# finish_event addition
self.events_repo.set_status(event_id, EventStatus.FINISHED, ...)
self.player_stats_service.apply_event_stats(event_id)
```

### `backend/app/main.py`

Add the new `leaderboards` router:

```python
from app.api.routers import leaderboards
app.include_router(leaderboards.router, prefix="/api/v1")
```

---

## New Routers

### `backend/app/api/routers/leaderboards.py` (new file)

```python
router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])

@router.get("/player-of-month", response_model=LeaderboardResponse)
def get_player_of_month(): ...

@router.get("/mexicano-of-month", response_model=LeaderboardResponse)
def get_mexicano_of_month(): ...
```

### `backend/app/api/routers/players.py` (add endpoint)

```python
@router.get("/{player_id}/stats", response_model=PlayerStatsResponse)
def get_player_stats(player_id: str): ...
```

---

## Frontend Type Additions

**File**: `frontend/src/lib/types.ts`

```typescript
// New type — player all-time stats (mirrors PlayerStatsResponse)
export type PlayerStats = {
  playerId: string
  displayName: string
  mexicanoScoreTotal: number
  btbScoreTotal: number
  eventsAttended: number
  wcMatchesPlayed: number
  wcWins: number
  wcLosses: number
  btbWins: number
  btbLosses: number
  btbDraws: number
}

// New type — one row in a leaderboard
export type LeaderboardEntry = {
  rank: number
  playerId: string
  displayName: string
  eventsPlayed: number      // primary key for player-of-month
  mexicanoScore: number     // primary key for mexicano-of-month; tiebreaker for PotM
  btbScore: number          // second tiebreaker for PotM
}

// New type — full leaderboard response
export type Leaderboard = {
  year: number
  month: number
  entries: LeaderboardEntry[]
}
```

---

## Frontend API Additions

**File**: `frontend/src/lib/api.ts`

```typescript
export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const data = await request<any>(`/players/${playerId}/stats`)
  return {
    playerId: data.player_id,
    displayName: data.display_name,
    mexicanoScoreTotal: data.mexicano_score_total ?? 0,
    btbScoreTotal: data.btb_score_total ?? 0,
    eventsAttended: data.events_attended ?? 0,
    wcMatchesPlayed: data.wc_matches_played ?? 0,
    wcWins: data.wc_wins ?? 0,
    wcLosses: data.wc_losses ?? 0,
    btbWins: data.btb_wins ?? 0,
    btbLosses: data.btb_losses ?? 0,
    btbDraws: data.btb_draws ?? 0,
  }
}

export async function getPlayerOfMonthLeaderboard(): Promise<Leaderboard> {
  return request('/leaderboards/player-of-month')
  // normalizer converts snake_case to camelCase
}

export async function getMexicanoOfMonthLeaderboard(): Promise<Leaderboard> {
  return request('/leaderboards/mexicano-of-month')
}
```

---

## New Frontend Files

| File | Purpose |
|------|---------|
| `frontend/src/pages/SearchPlayer.tsx` | Search input + filtered player list |
| `frontend/src/pages/PlayerStats.tsx` | Player stats page with charts |
| `frontend/src/features/player-stats/chartData.ts` | Pure fn: SVG arc segment data for doughnuts |
| `frontend/src/features/player-stats/formatStats.ts` | Pure fn: format stat value labels |
| `frontend/src/features/leaderboards/rankLeaderboard.ts` | Pure fn: sort + rank leaderboard entries |
| `frontend/tests/player-stats-chart-data.test.ts` | Unit tests for `chartData.ts` |
| `frontend/tests/player-stats-format.test.ts` | Unit tests for `formatStats.ts` |
| `frontend/tests/leaderboard-ranking.test.ts` | Unit tests for `rankLeaderboard.ts` |

---

## SVG Doughnut Chart Shape

The doughnut chart helper `chartData.ts` computes SVG arc `d` attributes for each
segment. API:

```typescript
export type ChartSegment = {
  label: string
  value: number
  color: string
  /** SVG path d attribute for the arc */
  arcPath: string
}

/**
 * Build an array of SVG arc segments for a doughnut chart.
 * Returns a single "empty" segment if all values are zero.
 */
export function buildDoughnutSegments(
  segments: Array<{ label: string; value: number; color: string }>,
  cx: number,
  cy: number,
  r: number,
  innerR: number,
): ChartSegment[]
```

The 100% / 0% edge case renders one full ring using a pair of arcs (SVG arcs with
`sweep-flag=1` cannot cover exactly 360° — standard workaround is two 180° arcs).
