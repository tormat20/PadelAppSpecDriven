# Data Model: Normalized Court Score and Score Distribution Histograms

**Branch**: `046-court-score-distribution`
**Phase**: 1 — Design

No database schema changes. All new data is derived at query-time from existing tables.

---

## Entities

### CourtScore (derived, not stored)

A normalized 0–10 float derived from a player's raw court number within a specific event's
court set. Never persisted — computed on-the-fly during the deep-dive endpoint response.

| Field | Type | Description |
|---|---|---|
| raw_court_number | int | The court number recorded on the match row |
| event_court_set | list[int] | Sorted deduplicated court numbers active in that event |
| court_score | float | `(rank / (len(set)-1)) * 10`; 10.0 when set has one court |

### ScoreDistEntry

One bucket in a score distribution histogram.

| Field | Type | Description |
|---|---|---|
| score | int | Score value 0–24 |
| count | int | Number of times this score appeared (both teams counted independently) |

Invariant: a full distribution always has exactly 25 entries (scores 0–24 inclusive).

### ScoreDistPerCourt

A per-court distribution container.

| Field | Type | Description |
|---|---|---|
| court_number | int | Court number (ascending order in the list) |
| distribution | list[ScoreDistEntry] | 25 entries, scores 0–24 |

Only courts with at least one recorded score contribute an entry (FR-008).

---

## Backend Pydantic schema changes

**File**: `backend/app/api/schemas/stats.py`

```python
# RENAMED from RoundAvgCourt
class RoundAvgCourtScore(BaseModel):
    round: int
    avg_court_score: float        # was avg_court; now 0–10 normalized
    sample_count: int

class ScoreDistEntry(BaseModel):  # NEW
    score: int
    count: int

class ScoreDistPerCourt(BaseModel):  # NEW
    court_number: int
    distribution: list[ScoreDistEntry]

class Score24ModeStats(BaseModel):
    avg_score_per_round: list[RoundAvgScore]
    avg_score_per_round_last_month: list[RoundAvgScore]
    avg_score_per_round_last_week: list[RoundAvgScore]
    avg_court_score_per_round: list[RoundAvgCourtScore]   # RENAMED (was avg_court_per_round)
    avg_court_score_overall: float | None                  # RENAMED (was avg_court_overall)
    match_wdl: MatchWDL
    score_distribution: list[ScoreDistEntry]              # NEW — always 25 entries
    score_distribution_per_court: list[ScoreDistPerCourt] # NEW — only courts with data
```

The old `RoundAvgCourt` class is removed. No other schemas change.

---

## Frontend TypeScript type changes

**File**: `frontend/src/lib/types.ts`

```ts
// RENAMED from RoundAvgCourt
export type RoundAvgCourtScore = {
  round: number
  avgCourtScore: number     // was avgCourt; now 0–10 normalized
  sampleCount: number
}

// NEW
export type ScoreDistEntry = {
  score: number             // 0–24
  count: number
}

// NEW
export type ScoreDistPerCourt = {
  courtNumber: number
  distribution: ScoreDistEntry[]
}

export type Score24ModeStats = {
  avgScorePerRound: RoundAvgScore[]
  avgScorePerRoundLastMonth: RoundAvgScore[]
  avgScorePerRoundLastWeek: RoundAvgScore[]
  avgCourtScorePerRound: RoundAvgCourtScore[]    // RENAMED (was avgCourtPerRound)
  avgCourtScoreOverall: number | null             // RENAMED (was avgCourtOverall)
  matchWdl: MatchWDL
  scoreDistribution: ScoreDistEntry[]             // NEW
  scoreDistributionPerCourt: ScoreDistPerCourt[]  // NEW
}
```

The old `RoundAvgCourt` type is removed. References in `PlayerStats.tsx` are updated.

---

## Service layer changes

**File**: `backend/app/services/player_stats_service.py`

### New: `_normalize_court_score(court_number, sorted_courts) → float`

Pure function. Given a sorted list of court numbers for an event, returns the 0–10 score for
the given court. Used by `_compute_score24_stats`.

```
if len(sorted_courts) <= 1: return 10.0
rank = sorted_courts.index(court_number)
return (rank / (len(sorted_courts) - 1)) * 10.0
```

### Modified: `_compute_score24_stats(rows, court_score_map) → dict`

Signature gains `court_score_map: dict[str, dict[int, float]]` parameter.
- Replaces raw court accumulation with normalized score lookup: `court_score_map[event_id][court_number]`
- Adds distribution accumulation: counts `team1_score` and `team2_score` per row independently
- Returns two new keys: `score_distribution` (list[dict]) and `score_distribution_per_court` (list[dict])

### Modified: `_empty_score24_stats() → dict`

Adds default values for the two new keys:
```python
"avg_court_score_per_round": [],
"avg_court_score_overall": None,
"score_distribution": [{"score": i, "count": 0} for i in range(25)],
"score_distribution_per_court": [],
```

### Modified: `_compute_deep_dive(rows, court_score_map) → dict`

Signature gains `court_score_map` parameter and forwards it to `_compute_score24_stats`.

### Modified: `PlayerStatsService.get_player_deep_dive(player_id) → dict`

Builds `court_score_map` before calling `_compute_deep_dive`:
```python
rows = self.player_stats_repo.get_deep_dive_matches(player_id)
distinct_event_ids = {r["event_id"] for r in rows}
court_score_map = {}
for eid in distinct_event_ids:
    courts = sorted(self.events_repo.list_courts(eid))
    court_score_map[eid] = {
        c: _normalize_court_score(c, courts) for c in courts
    }
return _compute_deep_dive(rows, court_score_map)
```

---

## Validation rules

- `score_distribution` always has exactly 25 entries (indices 0–24), even when all counts are zero.
- `score_distribution_per_court` contains only courts where `sum(entry.count for entry in distribution) > 0`.
- Score values outside 0–24 are silently ignored (clamped away) — spec edge case.
- Court numbers not in `court_score_map[event_id]` fall back to `None` / are excluded from court-score series (defensive — should not occur in clean data).
- `avg_court_score_overall` is `None` when no court-score data points exist.
