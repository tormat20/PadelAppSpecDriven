# Data Model: UX Fixes & Game Mode Enhancements (024)

**Branch**: `024-ux-gamemode-enhancements`

---

## Unchanged Entities

The following tables/models are **not structurally changed** by this feature:

- `players`, `event_players`, `event_courts`
- `rounds`, `matches`
- `event_scores`, `player_round_scores`, `rankings`
- `users`

---

## Modified Entities

### `events` table — new column

**New column**: `is_team_mexicano BOOLEAN NOT NULL DEFAULT FALSE`

Used to distinguish Team Mexicano from standard Mexicano. Stored on the event row so it
is always available without an additional join. Default `FALSE` means no migration is needed
for existing events — they retain standard Mexicano behaviour.

Migration file: `008_team_mexicano.sql`

```sql
ALTER TABLE events ADD COLUMN is_team_mexicano BOOLEAN NOT NULL DEFAULT FALSE;
```

### `Event` domain model (`backend/app/domain/models.py`)

Add field: `is_team_mexicano: bool`

### `EventResponse` schema (`backend/app/api/schemas/events.py`)

Add field: `isTeamMexicano: bool`

### `EventRecord` frontend type (`frontend/src/lib/types.ts`)

Add field: `isTeamMexicano?: boolean`

### `EventType` frontend type (`frontend/src/lib/types.ts`)

No changes — Team Mexicano is a sub-mode flag, not a new EventType value.

---

## New Entities

### `event_teams` table

Stores fixed team pairs for Team Mexicano events.

```sql
CREATE TABLE IF NOT EXISTS event_teams (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player1_id  TEXT NOT NULL REFERENCES players(id),
    player2_id  TEXT NOT NULL REFERENCES players(id)
);
```

Migration file: `008_team_mexicano.sql` (same migration as above)

**Python model** (`backend/app/domain/models.py`):

```python
@dataclass(slots=True)
class EventTeam:
    id: str
    event_id: str
    player1_id: str
    player2_id: str
```

**Repository**: `EventTeamsRepository` in `backend/app/repositories/event_teams_repo.py`  
Methods: `create(id, event_id, p1_id, p2_id)`, `list_by_event(event_id) -> list[EventTeam]`,
`delete_by_event(event_id)`

**Frontend type** (`frontend/src/lib/types.ts`):

```ts
export type EventTeam = {
  id: string
  eventId: string
  player1Id: string
  player2Id: string
}
```

---

### `event_substitutions` table

Records player substitutions during ongoing events.

```sql
CREATE TABLE IF NOT EXISTS event_substitutions (
    id                   TEXT PRIMARY KEY,
    event_id             TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    departing_player_id  TEXT NOT NULL REFERENCES players(id),
    substitute_player_id TEXT NOT NULL REFERENCES players(id),
    effective_from_round INT  NOT NULL
);
```

Migration file: `009_substitutions.sql`

**Python model** (`backend/app/domain/models.py`):

```python
@dataclass(slots=True)
class EventSubstitution:
    id: str
    event_id: str
    departing_player_id: str
    substitute_player_id: str
    effective_from_round: int
```

**Repository**: `SubstitutionsRepository` in `backend/app/repositories/substitutions_repo.py`  
Methods: `create(id, event_id, departing_id, sub_id, from_round)`,
`list_by_event(event_id) -> list[EventSubstitution]`

**Frontend type** (`frontend/src/lib/types.ts`):

```ts
export type SubstitutePlayerPayload = {
  departingPlayerId: string
  substitutePlayerId: string
}
```

---

## Derived / Computed Additions (no new tables)

### Tiebreaker context (Story 8)

Not persisted. Derived in-memory by `SummaryOrderingService` from existing match data:

- `wins_by_player: dict[str, int]` — count of matches where player's team scored > 12
- `best_match_by_player: dict[str, int]` — highest single-match score per player

These are computed in `summary_service.py` and passed into the ordering methods.

---

## Migration Plan

| Migration file | Contents |
|----------------|----------|
| `008_team_mexicano.sql` | `ALTER TABLE events ADD COLUMN is_team_mexicano`; `CREATE TABLE event_teams` |
| `009_substitutions.sql` | `CREATE TABLE event_substitutions` |

Both migrations use the existing `schema_migrations` tracking table.  
Both are additive (no data loss, no backfill needed).
