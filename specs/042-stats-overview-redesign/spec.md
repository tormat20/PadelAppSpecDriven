# Feature Specification: Player Stats Overview Redesign

**Feature Branch**: `042-stats-overview-redesign`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Player stats overview redesign with tabbed panel, grouped bar charts, and americano score split"

---

## Overview

Redesign the player stats page (`/players/:id/stats`) with four coordinated improvements:

1. Replace the flat 4-card overview strip with a **tabbed Overview panel** — an "All Stats" tab showing five summary cards, plus one tab per event mode showing win/draw/loss breakdowns.
2. **Remove** the two standalone WinnersCourt and Ranked Box summary sections; their content moves into the Overview tabs and the existing Deep Dive panel.
3. Replace the proportional stacked bar charts in the Ranked Box and Winners Court deep-dive tabs with **grouped side-by-side bar charts** where bar height represents absolute match count.
4. **Split Americano score tracking** from the shared Mexicano score field; Americano events accumulate into a new dedicated total.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tabbed Overview panel (Priority: P1)

As a player viewing my stats page, I see an Overview panel with tab pills. The default "All Stats" tab shows five summary cards. Clicking a mode tab shows win/draw/loss breakdowns for that mode.

**Why this priority**: This is the primary visual change and the anchor for all other improvements. Everything else flows from or around it.

**Independent Test**: Navigate to `/players/:id/stats`. Verify five tab pills render ("All Stats", "Mexicano", "Americano", "Team Mexicano"). Default tab shows five stat cards. Clicking "Mexicano" shows WDL cards. Clicking "All Stats" returns to the five summary cards.

**Acceptance Scenarios**:

1. **Given** a player has stats data, **When** the page loads, **Then** the Overview panel renders with the "All Stats" tab active showing five StatCards: Events Attended, Event Wins, Mexicano Total, Americano Total, RB Score.
2. **Given** the Overview panel is visible, **When** the user clicks the "Mexicano" tab, **Then** four StatCards appear: Matches Played, Wins, Draws, Losses — sourced from Mexicano deep-dive data.
3. **Given** the Overview panel is visible, **When** the user clicks "Americano", "Team Mexicano" tabs, **Then** equivalent WDL cards appear for the respective mode.
4. **Given** deep-dive data is still loading, **When** the user clicks a mode tab, **Then** a "Loading…" placeholder is shown (not a crash).
5. **Given** a player has no Americano events, **When** the user views the Americano tab, **Then** all four WDL cards show zero — no empty-state crash.

---

### User Story 2 — Remove standalone WinnersCourt and Ranked Box summary sections (Priority: P1)

As a player, I no longer see two redundant summary boxes (WinnersCourt and Ranked Box standalone sections) below the Overview panel. Their data is now accessible via the Overview tabs and the Deep Dive panel.

**Why this priority**: Removing clutter is required to give the new Overview panel room and avoid data duplication.

**Independent Test**: Navigate to `/players/:id/stats`. Confirm no standalone WinnersCourt section and no standalone Ranked Box section appear in the page layout. Confirm all previously shown data remains accessible via Overview tabs and Deep Dive tabs.

**Acceptance Scenarios**:

1. **Given** the stats page loads, **When** inspecting the layout, **Then** no standalone WinnersCourt section element exists below the Overview panel.
2. **Given** the stats page loads, **When** inspecting the layout, **Then** no standalone Ranked Box section element exists below the Overview panel.
3. **Given** the Deep Dive panel is present, **When** the user opens the "Winners Court" deep-dive tab, **Then** WC summary stats (wins, losses, matches played) are accessible there.
4. **Given** the Deep Dive panel is present, **When** the user opens the "Ranked Box" deep-dive tab, **Then** RB summary stats and charts are accessible there.

---

### User Story 3 — Grouped side-by-side bar charts for Ranked Box and Winners Court (Priority: P2)

As a player, the per-round charts in the Ranked Box and Winners Court deep-dive tabs show grouped bars (one bar per outcome per round) with height equal to absolute match count, instead of proportional stacked bars.

**Why this priority**: Absolute counts give a clearer picture of volume. The stacked proportional bars hide whether a round had 1 match or 20.

**Independent Test**: Open the Ranked Box deep-dive tab. For a round with known data, verify three adjacent bars (Win / Draw / Loss) are rendered side by side, each bar's height proportional to its count relative to the global maximum, growing upward from a shared baseline. Open Winners Court deep-dive tab; verify two bars (Win / Loss) per round.

**Acceptance Scenarios**:

1. **Given** a player has RB data, **When** viewing the Ranked Box deep-dive tab, **Then** each round shows three adjacent bars (Win amber-teal, Draw amber, Loss red) growing upward from a shared zero baseline.
2. **Given** a player has WC data, **When** viewing the Winners Court deep-dive tab, **Then** each round shows two adjacent bars (Win, Loss) — no Draw bar rendered.
3. **Given** round data exists across multiple rounds, **When** viewing either chart, **Then** all bars share the same Y-axis scale, anchored to the global maximum count across all rounds and outcomes.
4. **Given** a round has zero matches for one outcome (e.g. zero draws), **When** viewing that round, **Then** the zero-count bar is omitted entirely from the group.
5. **Given** only one round of data exists, **When** viewing the chart, **Then** a single group of bars renders without error.

---

### User Story 4 — Americano score split (Priority: P2)

As a player, my Americano event scores accumulate into a separate "Americano Total" stat, distinct from Mexicano events. Previously both event types accumulated into the same field.

**Why this priority**: Mexicano and Americano are different game modes; conflating their scores makes both totals meaningless.

**Independent Test**: Finish one Americano event for a player. Verify `americano_score_total` increases on the stats API response and `mexicano_score_total` does not change. Finish one Mexicano event; verify the reverse.

**Acceptance Scenarios**:

1. **Given** a player plays a Mexicano event, **When** the event is finished, **Then** `mexicano_score_total` increases by the player's score delta and `americano_score_total` is unchanged.
2. **Given** a player plays an Americano event, **When** the event is finished, **Then** `americano_score_total` increases by the player's score delta and `mexicano_score_total` is unchanged.
3. **Given** the stats API is called, **When** inspecting the response, **Then** both `mexicano_score_total` and `americano_score_total` are present as separate fields.
4. **Given** the Overview "All Stats" tab is shown, **When** viewing the five StatCards, **Then** "Mexicano Total" reflects `mexicano_score_total` and "Americano Total" reflects `americano_score_total`.

---

### Edge Cases

- Player with no events in a mode — mode tab shows zeroed WDL cards (not a crash or blank screen).
- Deep-dive data not yet loaded when user clicks a mode tab — show "Loading…" placeholder.
- Player with very large number of rounds — grouped bar chart scrolls horizontally, bars remain readable.
- Round with all three outcomes zero — group omitted entirely.
- Existing players with historical Americano scores in `mexicano_score_total` — field is not retroactively migrated; existing total remains in `mexicano_score_total` as-is.
- `buildStackedBars` function in `chartData.ts` must not be deleted (may be used elsewhere or in tests).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Overview panel MUST display tab pills: "All Stats", "Mexicano", "Americano", "Team Mexicano".
- **FR-002**: The "All Stats" tab MUST show five StatCards: Events Attended, Event Wins, Mexicano Total, Americano Total, RB Score.
- **FR-003**: Each mode tab ("Mexicano", "Americano", "Team Mexicano") MUST show four StatCards: Matches Played, Wins, Draws, Losses — sourced from the deep-dive endpoint.
- **FR-004**: When deep-dive data is loading and a mode tab is active, the system MUST show a "Loading…" placeholder and MUST NOT crash.
- **FR-005**: The standalone WinnersCourt summary section MUST be removed from the page layout.
- **FR-006**: The standalone Ranked Box summary section MUST be removed from the page layout.
- **FR-007**: The Ranked Box deep-dive tab MUST render grouped side-by-side bars (Win / Draw / Loss) per round with height = absolute count.
- **FR-008**: The Winners Court deep-dive tab MUST render grouped side-by-side bars (Win / Loss, no Draw) per round with height = absolute count.
- **FR-009**: All bars within a grouped chart MUST share a single Y-axis scale based on the global maximum count across all rounds and outcomes.
- **FR-010**: Bars with a count of zero MUST be omitted from their group.
- **FR-011**: `buildStackedBars` in `frontend/src/features/player-stats/chartData.ts` MUST NOT be deleted.
- **FR-012**: The backend MUST track `americano_score_total` as a separate column from `mexicano_score_total` in the player stats table.
- **FR-013**: Finishing an Americano event MUST increment `americano_score_total`; finishing a Mexicano event MUST increment `mexicano_score_total`.
- **FR-014**: The player stats API response MUST include both `mexicano_score_total` and `americano_score_total` as separate fields.
- **FR-015**: The frontend `PlayerStats` type and `getPlayerStats()` mapper MUST expose `americanoScoreTotal` separately from `mexicanoScoreTotal`.

### Key Entities

- **PlayerStats**: Per-player lifetime aggregates. Gains `americano_score_total` column. `mexicano_score_total` no longer accumulates Americano event scores going forward.
- **Overview panel**: UI component replacing the flat 4-card strip. Contains tab pills and conditionally renders either the 5-card "All Stats" view or a 4-card WDL view per mode.
- **Grouped bar chart**: New chart geometry for RB and WC deep-dive tabs — side-by-side bars per round, absolute counts, shared Y scale.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Overview panel renders with correct tab pills and "All Stats" content on every player stats page load.
- **SC-002**: Switching between Overview tabs never triggers a page reload or API refetch.
- **SC-003**: No standalone WinnersCourt or Ranked Box section elements exist in the rendered DOM.
- **SC-004**: The Ranked Box deep-dive chart renders grouped bars (3 per round) and Winners Court renders grouped bars (2 per round) with shared Y scale.
- **SC-005**: After an Americano event finishes, `americano_score_total` in the DB increments and `mexicano_score_total` does not.
- **SC-006**: Frontend lint (`npm run lint`) and all targeted tests pass with no new failures.
- **SC-007**: Backend pytest suite passes with no new failures.
