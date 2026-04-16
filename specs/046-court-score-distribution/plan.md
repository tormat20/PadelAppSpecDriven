# Implementation Plan: Normalized Court Score and Score Distribution Histograms

**Branch**: `046-court-score-distribution` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/046-court-score-distribution/spec.md`

## Summary

Replace the raw "Avg court per round" line chart in the Deep Dive panel with a normalized
"Avg court-score per round" chart (0–10 scale, rank-based per-event normalization). Add two
new chart sections: an "All courts" score distribution histogram and per-court breakdown
histograms, both fixed on a 0–24 X-axis for Score24 match scores.

All computation is server-side (Python service layer). The frontend receives new fields in the
existing `Score24ModeStats` payload and renders the new charts using the existing
`buildBarSegments` SVG helper.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript 5.x / React 18.3 (frontend)
**Primary Dependencies**: FastAPI, Pydantic v2, DuckDB (backend); React, Vite 5, Vitest 2 (frontend)
**Storage**: DuckDB — `event_courts` table (existing, no schema change required)
**Testing**: pytest (backend contract + unit), Vitest (frontend unit)
**Target Platform**: Linux server (backend) + modern browser SPA (frontend)
**Project Type**: web-service + frontend SPA
**Performance Goals**: No new latency requirements; deep-dive endpoint is already O(matches); court-set lookups add one query per distinct event_id (typically 5–30 per player)
**Constraints**: No DB schema changes; no new API endpoints; field rename (avg_court_per_round → avg_court_score_per_round) is a clean rename done in one PR
**Scale/Scope**: Player-scoped query; typical player has fewer than 500 deep-dive match rows

## Constitution Check

The constitution file (`.specify/memory/constitution.md`) is a blank template with no
project-specific rules set. No gates to evaluate — no violations possible.

*Post-design re-check*: design adds no new projects, no new storage layers, no novel patterns.
All changes fit naturally into the existing service/schema/component layers. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/046-court-score-distribution/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── deep-dive-endpoint.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── routers/players.py                      # No change — endpoint URL unchanged
│   │   └── schemas/stats.py                        # Rename RoundAvgCourt; add RoundAvgCourtScore,
│   │                                               #   ScoreDistEntry, ScoreDistPerCourt;
│   │                                               #   update Score24ModeStats (2 new fields + rename)
│   ├── services/
│   │   └── player_stats_service.py                 # _compute_score24_stats() gets court_score_map param;
│   │                                               #   adds normalization + distribution logic;
│   │                                               #   _compute_deep_dive() builds map via events_repo
│   └── repositories/
│       ├── player_stats_repo.py                    # No change — already returns event_id per row
│       ├── events_repo.py                          # No change — list_courts() already exists
│       └── sql/
│           ├── player_stats/get_deep_dive_matches.sql  # No change
│           └── events/list_courts.sql                  # No change
└── tests/
    ├── contract/
    │   └── test_player_stats_deep_dive_api.py      # NEW — API contract tests
    └── unit/
        └── test_court_score_normalization.py       # NEW — unit tests for normalization + distribution

frontend/
├── src/
│   ├── pages/
│   │   └── PlayerStats.tsx                         # Replace CourtLineChart; add ScoreDistChart component
│   ├── features/
│   │   └── player-stats/
│   │       └── chartData.ts                        # No change — buildBarSegments already exists
│   └── lib/
│       └── types.ts                                # Rename RoundAvgCourt → RoundAvgCourtScore;
│                                                   #   add ScoreDistEntry, ScoreDistPerCourt;
│                                                   #   update Score24ModeStats
└── tests/
    └── player-stats-chart-data.test.ts             # Extend with buildBarSegments distribution tests
```

**Structure Decision**: Web application (Option 2). Backend and frontend are separate trees.
The feature touches both stacks but requires no new source files — only new test files and
extensions to existing source files.

## Complexity Tracking

> No constitution violations. This section is intentionally empty.
