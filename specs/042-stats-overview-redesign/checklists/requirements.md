# Requirements Checklist: Player Stats Overview Redesign

**Purpose**: Verify all functional requirements from spec.md are satisfied before merging.
**Created**: 2026-03-30
**Feature**: `specs/042-stats-overview-redesign/spec.md`

## Overview Panel

- [ ] CHK001 Overview panel renders with tab pills: "All Stats", "Mexicano", "Americano", "Team Mexicano"
- [ ] CHK002 "All Stats" tab is active by default on page load
- [ ] CHK003 "All Stats" tab shows five StatCards: Events Attended, Event Wins, Mexicano Total, Americano Total, RB Score
- [ ] CHK004 "Mexicano" tab shows four StatCards: Matches Played, Wins, Draws, Losses
- [ ] CHK005 "Americano" tab shows four StatCards: Matches Played, Wins, Draws, Losses
- [ ] CHK006 "Team Mexicano" tab shows four StatCards: Matches Played, Wins, Draws, Losses
- [ ] CHK007 WDL cards source data from `deepDive` (not `stats`)
- [ ] CHK008 "Loading…" placeholder shown when `deepDive` is null and a mode tab is active — no crash
- [ ] CHK009 Tab switching does not trigger any API refetch or page reload

## Removed Sections

- [ ] CHK010 No standalone WinnersCourt `<section>` element in rendered DOM
- [ ] CHK011 No standalone Ranked Box `<section>` element in rendered DOM
- [ ] CHK012 WC summary data (wins, losses, matches played) accessible via WC deep-dive tab
- [ ] CHK013 RB summary data accessible via RB deep-dive tab

## Grouped Bar Charts

- [ ] CHK014 Ranked Box deep-dive tab renders grouped bars (3 per round: Win / Draw / Loss)
- [ ] CHK015 Winners Court deep-dive tab renders grouped bars (2 per round: Win / Loss — no Draw bar)
- [ ] CHK016 All bars within each chart share a single Y-axis scale based on global maximum count
- [ ] CHK017 Zero-count bars are omitted from their group (not rendered as invisible/zero-height bars)
- [ ] CHK018 Bars grow upward from a shared baseline
- [ ] CHK019 Round labels are centred below each group
- [ ] CHK020 `buildStackedBars` remains exported from `frontend/src/features/player-stats/chartData.ts`

## Americano Score Split

- [ ] CHK021 Migration `019_americano_score_split.sql` creates `americano_score_total` column with `DEFAULT 0`
- [ ] CHK022 `GET /players/{id}/stats` response includes `americano_score_total` as a separate field
- [ ] CHK023 Finishing an Americano event increments `americano_score_total` only
- [ ] CHK024 Finishing a Mexicano event increments `mexicano_score_total` only (does not touch Americano)
- [ ] CHK025 `PlayerStats` TypeScript type includes `americanoScoreTotal: number`
- [ ] CHK026 `getPlayerStats()` maps `americano_score_total` → `americanoScoreTotal`
- [ ] CHK027 "Americano Total" StatCard in "All Stats" tab shows `americanoScoreTotal`
- [ ] CHK028 "Mexicano Total" StatCard in "All Stats" tab shows `mexicanoScoreTotal` (unchanged)

## Quality Gates

- [ ] CHK029 `cd frontend && npm run lint` passes with no new errors
- [ ] CHK030 `cd frontend && npm test -- --run tests/player-stats-chart-data.test.ts` passes
- [ ] CHK031 `cd frontend && npm test` full suite passes with no regressions
- [ ] CHK032 `cd backend && PYTHONPATH=. pytest` full suite passes

## Notes

- Check items off as completed: `[x]`
- CHK020 is a hard constraint — failure here blocks merge
- CHK008 prevents a runtime crash that would occur if a mode tab is clicked before deep-dive data loads
