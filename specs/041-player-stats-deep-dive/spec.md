# Feature Specification: Player Stats Deep-Dive Panel

**Feature Branch**: `041-player-stats-deep-dive`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "Add a large selectable-tab statistics panel on the player stats page showing per-round average scores, win/draw/loss doughnuts, average court data, RB per-round breakdown, WC per-round breakdown, and an RB elo line chart."

---

## Overview

Extend the player stats page (`/players/:id/stats`) with a **deep-dive panel** below the existing overview strip. The panel contains five tabs — one per event type — each revealing mode-specific charts. The overview strip (four stat cards) is unchanged.

### Tab list

| Tab label | Event type in DB |
|---|---|
| Mexicano | `event_type = "Mexicano"`, `is_team_mexicano = false` |
| Americano | `event_type = "Americano"` |
| Team Mexicano | `event_type = "Mexicano"`, `is_team_mexicano = true` |
| Ranked Box | `event_type = "RankedBox"` |
| Winners Court | `event_type = "WinnersCourt"` |

Default selected: Mexicano. All five tabs always visible; empty state shown when there is no data.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tab selector navigates between views (Priority: P1)

As a player, I can click a tab to switch the deep-dive panel to a different event type.

**Acceptance Scenarios**:
1. Stats page loads → five tab pills visible, Mexicano active by default.
2. Click "Ranked Box" → RankedBox charts appear, RankedBox tab visually active.
3. Player with no Americano events clicks Americano tab → "No data yet" shown, tab not hidden.
4. Switching tabs never reloads the page or refetches data.

---

### User Story 2 — Score-24 modes: average score per round bar chart (Priority: P1)

Bar chart, Y fixed 0–24, X = round numbers. Each bar = mean score that player earned in that round number across all finished events of the selected mode. Only rounds that have ≥1 data point are shown.

**Acceptance Scenarios**:
1. Player scored 18, 12, 15 in round 3 across three Mexicano events → round-3 bar = 15.0 average.
2. Only two events contributed a round 4 → round-4 bar averages only those two.
3. No finished events → "No data yet" empty state.
4. Y-axis fixed 0–24 regardless of actual scores.

---

### User Story 3 — Score-24 modes: match win/draw/loss doughnut (Priority: P1)

Per individual match: team score > 12 = win, < 12 = loss, = 12 = draw. Doughnut with legend showing raw counts.

**Acceptance Scenarios**:
1. 10 wins, 3 draws, 5 losses → doughnut renders three segments proportionally + legend.
2. Score exactly 12 → classified as draw.
3. All wins → full teal ring, 0 draws, 0 losses.
4. No matches → "No data yet" empty state.

---

### User Story 4 — Score-24 modes: average court per round (Priority: P2)

Chart of mean court number per round number. Plus a single text stat "Avg court: X.X".

**Acceptance Scenarios**:
1. Player on court 6 in round 2 of one event and court 4 in round 2 of another → round-2 avg = 5.0.
2. Y-axis min = 1, max = highest court seen across all events for this player/mode.
3. Single summary stat "Avg court: X.X" shown.

---

### User Story 5 — Ranked Box: proportional stacked bar per round (Priority: P1)

Three bars (R1 / R2 / R3). Each bar sums to 100%. Win = teal, Draw = amber, Loss = red. Legend shows raw counts.

**Acceptance Scenarios**:
1. Round-1: 6W / 1D / 1L (8 total) → bar shows 75% / 12.5% / 12.5%.
2. Round-2: 4W / 0D / 4L → exactly 50% / 0% / 50%.
3. No RB events → "No data yet".
4. Round with 0 results → bar omitted (no divide-by-zero crash).

---

### User Story 6 — Winners Court: proportional stacked bar per round (Priority: P2)

Same proportional stacked bar chart but only Win / Loss (no draws, no amber). One bar per round up to the max round played.

**Acceptance Scenarios**:
1. Round-1: 7W / 3L (10 total) → bar shows 70% / 30%.
2. No draw segment rendered.
3. No WC events → "No data yet".

---

### User Story 7 — Ranked Box: RB score "elo" line chart (Priority: P2)

Cumulative RB score after each finished RB event plotted against the real event date. Minimalistic: thin line, small dot per point, no fill. Single event shows as isolated dot.

**Acceptance Scenarios**:
1. Three RB events with results +25 / −15 / +5 → cumulative points 25 / 10 / 15 at the respective dates.
2. One RB event → single dot at correct date and score.
3. No RB events → "No data yet" (elo chart omitted, not the whole tab).
4. X-axis shows short date format (e.g. "15 Mar").
5. No filled area under the line.

---

### Edge Cases

- Player removed from an event — historical match data still included.
- Single finished event → single-point charts render without crashing.
- 20+ finished events → charts remain readable (horizontal scroll for large round counts).
- All match scores = 12 (all draws) → doughnut shows 100% draw.
- RB event with early finish (only 2 rounds) → only rounds 1–2 appear in per-round chart.

---

## Data — New Backend Endpoint

`GET /players/{player_id}/stats/deep-dive`

Computed live from `matches` + `rounds` + `events`. No new DB migration.

### Response shape

```json
{
  "mexicano": {
    "avg_score_per_round": [{ "round": 1, "avg_score": 15.3, "sample_count": 6 }],
    "avg_court_per_round": [{ "round": 1, "avg_court": 5.2, "sample_count": 6 }],
    "avg_court_overall": 5.1,
    "match_wdl": { "wins": 34, "draws": 8, "losses": 12 }
  },
  "americano": { "/* same shape as mexicano */" },
  "team_mexicano": { "/* same shape as mexicano */" },
  "ranked_box": {
    "per_round_wdl": [
      { "round": 1, "wins": 8, "draws": 2, "losses": 3 }
    ],
    "elo_timeline": [
      { "event_date": "2025-09-10", "cumulative_score": 25 }
    ]
  },
  "winners_court": {
    "per_round_wdl": [
      { "round": 1, "wins": 10, "draws": 0, "losses": 3 }
    ]
  }
}
```

### Computation

- **avg_score_per_round**: all completed Score24 matches for player, grouped by round_number, mean of player's team score.
- **match_wdl**: per match, player's score > 12 = win, < 12 = loss, = 12 = draw.
- **avg_court_per_round**: same grouping by round_number, mean of court_number.
- **per_round_wdl (RB/WC)**: completed matches grouped by round_number, count win/draw/loss per round.
- **elo_timeline**: finished RB events in date order, accumulate rb score delta (+25/−15/+5) per event.
- Team Mexicano uses Score24 matches from events where `is_team_mexicano = true`.

---

## Architecture

### Backend

| Layer | File | Change |
|---|---|---|
| Schema | `backend/app/api/schemas/stats.py` | Add `PlayerDeepDiveResponse` with typed sub-models |
| Service | `backend/app/services/player_stats_service.py` | Add `get_player_deep_dive(player_id)` |
| Repository | `backend/app/repositories/player_stats_repo.py` | Add `get_deep_dive_matches(player_id)` |
| SQL | `backend/app/repositories/sql/player_stats/get_deep_dive_matches.sql` | New query |
| Router | `backend/app/api/routers/players.py` | Add `GET /players/{player_id}/stats/deep-dive` |

### Frontend

| Layer | File | Change |
|---|---|---|
| Types | `frontend/src/lib/types.ts` | Add `PlayerDeepDive` type tree |
| API | `frontend/src/lib/api.ts` | Add `getPlayerDeepDive(playerId)` |
| Chart helpers | `frontend/src/features/player-stats/chartData.ts` | Add `buildBarSegments`, `buildStackedBars`, `buildLinePoints` |
| Page | `frontend/src/pages/PlayerStats.tsx` | Add `DeepDivePanel` with tab state and chart sub-components |

---

## Out of Scope

- Overview strip unchanged (four stat cards).
- No changes to leaderboard or monthly stats endpoints.
- No changes to write path (stats accumulation on event finish).
- No new DB migration.
- No external charting library.
- No real-time updates — fetched once on page load.
