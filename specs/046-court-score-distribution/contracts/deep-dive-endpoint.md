# API Contract: Player Deep Dive Endpoint

**Endpoint**: `GET /api/v1/players/{player_id}/stats/deep-dive`
**Feature**: `046-court-score-distribution`
**Change type**: Non-breaking additive (two new response fields) + breaking rename (two field names)

---

## Request

```
GET /api/v1/players/{player_id}/stats/deep-dive
```

No query parameters. No request body. Authentication per existing middleware (unchanged).

---

## Response shape

HTTP 200. Content-Type: `application/json`.

The top-level shape is unchanged (`mexicano`, `americano`, `team_mexicano`, `ranked_box`,
`winners_court`). The `mexicano`, `americano`, and `team_mexicano` objects change as follows.

### Changed fields in Score24ModeStats objects

| Old field name | New field name | Notes |
|---|---|---|
| `avg_court_per_round` | `avg_court_score_per_round` | Entries also renamed (see below) |
| `avg_court_overall` | `avg_court_score_overall` | Value range changes: was raw court number (e.g. 3.5), now 0.0–10.0 |

Entries within `avg_court_score_per_round`:

| Old entry field | New entry field | Notes |
|---|---|---|
| `avg_court` | `avg_court_score` | Float, 0.0–10.0 |
| `round` | `round` | Unchanged |
| `sample_count` | `sample_count` | Unchanged |

### New fields in Score24ModeStats objects

```
score_distribution            — array, always present, always 25 entries (scores 0–24)
score_distribution_per_court  — array, present but may be empty
```

---

## Full response example

```json
{
  "mexicano": {
    "avg_score_per_round": [
      { "round": 1, "avg_score": 14.5, "sample_count": 2 }
    ],
    "avg_score_per_round_last_month": [],
    "avg_score_per_round_last_week": [],
    "avg_court_score_per_round": [
      { "round": 1, "avg_court_score": 7.5, "sample_count": 2 }
    ],
    "avg_court_score_overall": 7.5,
    "match_wdl": { "wins": 2, "draws": 0, "losses": 1 },
    "score_distribution": [
      { "score": 0, "count": 0 },
      { "score": 1, "count": 0 },
      { "score": 2, "count": 0 },
      { "score": 3, "count": 0 },
      { "score": 4, "count": 0 },
      { "score": 5, "count": 0 },
      { "score": 6, "count": 0 },
      { "score": 7, "count": 1 },
      { "score": 8, "count": 0 },
      { "score": 9, "count": 0 },
      { "score": 10, "count": 0 },
      { "score": 11, "count": 0 },
      { "score": 12, "count": 0 },
      { "score": 13, "count": 0 },
      { "score": 14, "count": 0 },
      { "score": 15, "count": 0 },
      { "score": 16, "count": 0 },
      { "score": 17, "count": 1 },
      { "score": 18, "count": 0 },
      { "score": 19, "count": 0 },
      { "score": 20, "count": 0 },
      { "score": 21, "count": 0 },
      { "score": 22, "count": 0 },
      { "score": 23, "count": 0 },
      { "score": 24, "count": 0 }
    ],
    "score_distribution_per_court": [
      {
        "court_number": 3,
        "distribution": [
          { "score": 0, "count": 0 },
          { "score": 1, "count": 0 },
          { "score": 2, "count": 0 },
          { "score": 3, "count": 0 },
          { "score": 4, "count": 0 },
          { "score": 5, "count": 0 },
          { "score": 6, "count": 0 },
          { "score": 7, "count": 1 },
          { "score": 8, "count": 0 },
          { "score": 9, "count": 0 },
          { "score": 10, "count": 0 },
          { "score": 11, "count": 0 },
          { "score": 12, "count": 0 },
          { "score": 13, "count": 0 },
          { "score": 14, "count": 0 },
          { "score": 15, "count": 0 },
          { "score": 16, "count": 0 },
          { "score": 17, "count": 1 },
          { "score": 18, "count": 0 },
          { "score": 19, "count": 0 },
          { "score": 20, "count": 0 },
          { "score": 21, "count": 0 },
          { "score": 22, "count": 0 },
          { "score": 23, "count": 0 },
          { "score": 24, "count": 0 }
        ]
      }
    ]
  },
  "americano": { "...same shape..." },
  "team_mexicano": { "...same shape..." },
  "ranked_box": {
    "per_round_wdl": [],
    "elo_timeline": []
  },
  "winners_court": {
    "per_round_wdl": []
  }
}
```

---

## Empty / no-data state

When a player has no Score24 matches for a mode, `_empty_score24_stats()` is returned:

```json
{
  "avg_score_per_round": [],
  "avg_score_per_round_last_month": [],
  "avg_score_per_round_last_week": [],
  "avg_court_score_per_round": [],
  "avg_court_score_overall": null,
  "match_wdl": { "wins": 0, "draws": 0, "losses": 0 },
  "score_distribution": [
    { "score": 0, "count": 0 }, { "score": 1, "count": 0 },
    "... 25 entries total, all count: 0 ..."
  ],
  "score_distribution_per_court": []
}
```

`score_distribution` is always present with 25 entries. `score_distribution_per_court` is
always present (may be an empty array).

---

## Invariants

- `score_distribution` always has exactly 25 entries with `score` values 0–24 in order.
- `score_distribution_per_court` contains only courts where at least one score was recorded.
- Entries in `score_distribution_per_court` are ordered by `court_number` ascending.
- `avg_court_score_overall` is `null` when there are no court-scored matches; otherwise a
  float in `[0.0, 10.0]`.
- `avg_court_score` within each `avg_court_score_per_round` entry is in `[0.0, 10.0]`.

---

## Error responses

No new error responses. Existing 404 (player not found) and 500 (unexpected error) behaviour
is unchanged.

---

## Frontend consumption notes

- `types.ts`: rename `RoundAvgCourt` → `RoundAvgCourtScore`; field `avgCourt` → `avgCourtScore`;
  top-level `avgCourtPerRound` → `avgCourtScorePerRound`; `avgCourtOverall` → `avgCourtScoreOverall`.
- `PlayerStats.tsx`: `CourtLineChart` props change to accept `RoundAvgCourtScore[]` and
  `avgCourtScoreOverall`. Y-axis changes from `1–maxCourtInt` to fixed `0–10`.
- New `ScoreDistChart` component uses `buildBarSegments` from `chartData.ts` directly.
