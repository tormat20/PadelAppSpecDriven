# Research: Normalized Court Score and Score Distribution Histograms

**Branch**: `046-court-score-distribution`
**Phase**: 0 — Outline & Research

---

## 1. Court-set data access

**Decision**: Reuse the existing `events_repo.list_courts(event_id) → list[int]` method.

**Rationale**: The method already exists at `backend/app/repositories/events_repo.py:113` and
queries the `event_courts` table, returning court numbers in ascending order. No new SQL or
repo method is needed.

**How to reach it from the service**: `_compute_score24_stats()` is currently a pure
module-level function that does not have access to `events_repo`. The service method
`get_player_deep_dive()` does have access (via `self.events_repo`). The solution is:

1. In `PlayerStatsService.get_player_deep_dive()`, collect all distinct `event_id`s from the
   match rows.
2. Call `self.events_repo.list_courts(event_id)` once per distinct event_id.
3. Build a `court_score_map: dict[str, dict[int, float]]` (event_id → court_number → normalized_score).
4. Pass `court_score_map` to `_compute_deep_dive(rows, court_score_map)`, which forwards it
   to `_compute_score24_stats(rows, court_score_map)`.

This keeps `_compute_score24_stats` a pure function (testable without a DB), while the repo
access stays in the service layer where it belongs.

**Alternatives considered**:
- Joining `event_courts` directly in `get_deep_dive_matches.sql`: would return one row per
  court per match (fan-out), complicating the aggregation logic significantly. Rejected.
- Passing `events_repo` into `_compute_score24_stats`: violates the existing pattern of pure
  module-level helpers. Rejected.

---

## 2. Normalization formula

**Decision**: Rank-based equal-step normalization scoped per event.

**Formula**: Given the sorted deduplicated court list `[c0, c1, ..., cN]` for an event (N+1 courts total):
- `court_score(ci) = (i / N) * 10`  — where `i` is the 0-based rank of the court
- Single court (N=0): `court_score = 10` (special case — sole court = highest)

**Example**:
- Courts `[2, 3, 4, 5, 6]` (N=4): court 4 is rank 2 → `(2/4)*10 = 5.0` ✓
- Courts `[1, 3, 4, 5, 7]` (N=4): court 3 is rank 1 → `(1/4)*10 = 2.5` ✓
- Courts `[4]` (N=0): court 4 → `10.0` ✓

**Rationale**: Equal steps between ranked positions regardless of absolute number gaps. This is
the "rank-based" normalization specified in FR-002 and the acceptance scenarios in spec.md.

**Alternatives considered**:
- Min-max normalization on raw court numbers: `(court - min) / (max - min) * 10`. Fails for
  non-contiguous courts where steps are unequal (e.g. court 3 vs court 7 in a {1,3,7} set
  would produce 2.0 and 8.0 respectively, not equal 5.0). Rejected per spec.

---

## 3. Score distribution data structure

**Decision**: Always emit exactly 25 entries in `score_distribution` (scores 0–24), including
zero-count entries. Per-court distributions follow the same shape.

**Rationale**:
- Fixed-length array means the frontend never needs to find "which index = which score". It
  can iterate directly: `distribution[i].score === i` always.
- Consistent with FR-007 ("X-axis MUST be fixed at 0–24 even if not all values observed").
- Simplifies the `buildBarSegments` call: pass all 25 items with `yMin=0`,
  `yMax=maxCount` (derived from the data).

**How to build it**:
```python
counts = [0] * 25
for row in score24_rows:
    s1 = int(row["team1_score"] or 0)
    s2 = int(row["team2_score"] or 0)
    if 0 <= s1 <= 24: counts[s1] += 1
    if 0 <= s2 <= 24: counts[s2] += 1
distribution = [{"score": i, "count": counts[i]} for i in range(25)]
```

Both team scores are counted independently (FR-006). Out-of-range scores are silently ignored
(edge case from spec).

---

## 4. Frontend chart rendering

**Decision**: Reuse `buildBarSegments()` from `chartData.ts` for both the all-courts and
per-court histograms. Build a new `ScoreDistChart` component in `PlayerStats.tsx`.

**Rationale**: `buildBarSegments` (lines 147–171 of `chartData.ts`) already accepts
`(items, color, svgW, svgH, paddingX, paddingY, yMin, yMax)` and returns `BarSegment[]`. It
maps exactly to the distribution histogram pattern:
- `items`: the 25 `{label: "0"..."24", value: count}` entries
- `yMin=0`
- `yMax=maxCount` (derived from max count across all bars; or at minimum 1 to avoid
  division-by-zero)

**SVG width for 25 bars**: 25 bars at ~12px each + padding → `svgW = 380` is sufficient.
The existing `dd-chart-scroll` wrapper handles horizontal overflow on small screens (SC-006).

**Alternatives considered**:
- A new bar chart helper function: unnecessary since `buildBarSegments` already does this
  exactly. Rejected to avoid duplication.

---

## 5. Existing empty-state pattern

The existing `CourtLineChart` returns `null` when `data.length === 0`. The `Score24Tab`
wraps it with a guard: `{data.avgCourtPerRound.length > 0 && <CourtLineChart ... />}`.

For distribution charts, the spec requires an empty-state message (User Story 2, scenario 2)
rather than silent omission. The existing `<DeepDiveEmpty />` component (`PlayerStats.tsx:718`)
renders `"No data yet for this mode."` — we can reuse this pattern for distribution charts
when `score_distribution` is all zeros.

**Decision**: Show `<p className="dd-empty-state muted">No score data yet.</p>` inline within
the distribution section when all counts are zero, rather than hiding the section entirely.

---

## 6. No unknowns remaining

All items that were NEEDS CLARIFICATION in the initial Technical Context scan have been
resolved:
- Court-set access: reuse existing `list_courts()` ✓
- Normalization formula: rank-based, documented above ✓
- Distribution structure: fixed 25 entries ✓
- Frontend rendering: reuse `buildBarSegments` ✓
- Empty-state: inline message ✓
- Field naming strategy: clean rename confirmed by user ✓
