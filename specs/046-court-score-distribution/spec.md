# Feature Specification: Normalized Court Score and Score Distribution Histograms

**Feature Branch**: `046-court-score-distribution`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "Normalized court score replacing avg court per round; score distribution bar charts by court in the Deep Dive panel"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Meaningful Court Performance Trend (Priority: P1)

A player opens their statistics page and navigates to the Deep Dive panel. Instead of seeing a raw court number average per round (which gives misleading results when events use a non-standard court range like 2–6 or 1–3), the player sees an "Avg court-score per round" line chart. The score is normalized 0–10, where 0 means the lowest court available in that event and 10 means the highest court available. If courts 2–6 were used, playing on court 2 yields a score of 0 and court 6 yields a score of 10 — regardless of the absolute court numbers used in other events.

**Why this priority**: This is the core correction to an existing misleading statistic. Without normalization, a player who consistently plays on the top court of a 5-court event (max court 5) appears lower-ranked than a player who plays on court 6 in a 7-court event, even if both are performing identically relative to their events.

**Independent Test**: Can be fully tested by creating two events with different court ranges, recording matches at the top court in each event, and verifying that both produce a court-score of 10.

**Acceptance Scenarios**:

1. **Given** an event using courts 2, 3, 4, 5, 6, **When** a player played on court 4 (middle court), **Then** their court-score for that match is 5.0 out of 10.
2. **Given** an event using courts 1, 3, 4, 5, 7 (non-contiguous), **When** a player played on court 3 (second lowest), **Then** their court-score for that match is 2.5 — equal steps between each rank position.
3. **Given** an event using a single court (only court 4), **When** the player played on court 4, **Then** their court-score is 10 (sole court equals the highest court).
4. **Given** multiple events with different court ranges, **When** a player views the "Avg court-score per round" chart, **Then** each round's value is normalized relative to the court range of each contributing event, not a global 1–7 scale.
5. **Given** the Deep Dive panel is open on the Mexicano tab, **When** the player looks at the former "Avg court per round" chart, **Then** the chart is now labeled "Avg court-score per round" and the Y-axis shows 0–10 instead of 1–7.

---

### User Story 2 - Explore Score Distribution Across All Courts (Priority: P2)

A player wants to understand the typical score pattern in Score24 matches (Mexicano, Americano, Team Mexicano). They open the Deep Dive panel and see a new bar chart titled "Score distribution — All courts". The X-axis spans 0–24 (every possible Score24 value). Each bar represents how many times that score has appeared in any completed match across all courts. Both team scores from every match contribute: if team A scores 7 and team B scores 17, both 7 and 17 are counted as separate data points. Over time, users expect to see a symmetry around 12 (since scores always sum to 24 in Score24 matches) forming a distribution.

**Why this priority**: This is a brand-new analytical view that helps players understand macro patterns in scoring. It complements the per-court view (Story 3) and grows more meaningful as more matches are recorded.

**Independent Test**: Can be fully tested by recording a set of matches with known scores and verifying that each score value (0–24) appears in the bar chart at the correct frequency across all courts.

**Acceptance Scenarios**:

1. **Given** a completed match where team A scored 7 and team B scored 17, **When** the player views the "All courts" distribution chart, **Then** bar at position 7 increments by 1 and bar at position 17 increments by 1.
2. **Given** no completed Score24 matches exist, **When** the player views the distribution chart, **Then** an empty-state message is shown and no bars are rendered.
3. **Given** many matches have been played, **When** the player views the distribution, **Then** the chart shows a roughly symmetric pattern around score value 12 (since team scores always sum to 24).
4. **Given** the distribution chart is displayed, **When** the player inspects it, **Then** the X-axis is fixed at 0–24 and each bar corresponds to a single score value.

---

### User Story 3 - Compare Score Distributions Per Court (Priority: P3)

A player wants to see if higher courts tend to produce higher or lower scores, or different distributions. Below the "All courts" distribution chart, a separate chart appears for each court that has recorded matches. Each per-court chart uses the same 0–24 X-axis scale as the all-courts chart, enabling direct visual comparison. Courts with no recorded match data do not appear.

**Why this priority**: This is purely analytical/exploratory. It answers the question "do scores differ by court?" and becomes useful only once enough matches are recorded per court. It does not block any core workflow.

**Independent Test**: Can be fully tested by recording matches on specific courts (e.g., court 3 and court 6) and verifying that only those two courts appear as separate distribution charts, each showing the correct score frequencies.

**Acceptance Scenarios**:

1. **Given** matches have been played on courts 3 and 5 only, **When** the player views the per-court distribution section, **Then** exactly two charts appear: one labeled "Court 3" and one labeled "Court 5".
2. **Given** court 7 has no recorded matches, **When** the player views the per-court section, **Then** no "Court 7" chart is shown.
3. **Given** a match on court 2 where team A scored 10 and team B scored 14, **When** the player views the "Court 2" distribution, **Then** bar at 10 and bar at 14 each increment by 1.
4. **Given** the per-court distribution charts are displayed, **When** a new match on an existing court is recorded and confirmed, **Then** that court's distribution chart updates to include the new scores without requiring a manual page reload beyond normal data refresh.

---

### Edge Cases

- What happens when an event has only one court? The single court receives court-score 10 (sole court = highest court).
- What happens when two events use different court sets with overlapping numbers? Each event's court set is treated independently for normalization — court 3 in a {1,3,5} event maps differently than court 3 in a {3,4,5,6,7} event.
- What happens when a match uses a result type other than Score24 (e.g., WinLoss)? No score values are contributed to the distribution charts; normalized court-score still applies to the court trend line if a court number is recorded.
- What happens when the Deep Dive panel has no Score24 matches for a given mode? The distribution section shows an empty-state message consistent with existing empty-state patterns.
- What happens on very small screens where 25 bars (0–24) would be crowded? The chart area must be horizontally scrollable, matching the existing scroll behavior for other charts in the Deep Dive panel.
- What happens if a score outside 0–24 is somehow recorded? The distribution chart clamps to the 0–24 range and ignores out-of-range values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Avg court per round" chart in the Deep Dive panel MUST be replaced with an "Avg court-score per round" chart displaying normalized values on a fixed 0–10 scale.
- **FR-002**: Court-score normalization MUST be computed per event: the lowest court number in that event maps to 0 and the highest court number maps to 10, with equal step intervals between ranked positions regardless of gaps in court number values.
- **FR-003**: When an event uses only a single court, that court MUST receive a court-score of 10.
- **FR-004**: The overall average court-score summary stat displayed alongside the chart MUST use the same normalized 0–10 values.
- **FR-005**: A "Score distribution — All courts" bar chart MUST be added to the Deep Dive panel for each Score24 game mode (Mexicano, Americano, Team Mexicano), showing the frequency of each score value from 0 to 24 inclusive.
- **FR-006**: Both team scores from every completed Score24 match MUST be independently counted and contributed to the distribution charts (each score value is a separate data point).
- **FR-007**: The score distribution X-axis MUST be fixed at 0–24, covering all possible Score24 values, even if not all values have been observed.
- **FR-008**: Per-court distribution charts MUST appear below the all-courts chart, one chart per court that has at least one recorded match; courts with no data MUST NOT be shown.
- **FR-009**: Each per-court chart MUST use the same 0–24 X-axis scale as the all-courts chart to enable direct visual comparison.
- **FR-010**: Distribution charts MUST reflect only the current player's matches, consistent with all other Deep Dive statistics.
- **FR-011**: Score distribution data MUST include new matches when the player's stats are next loaded or refreshed; no stale data may persist after a new match is saved.

### Key Entities

- **Court-Score**: A normalized 0–10 value derived from a player's raw court number within the specific event's court set. Represents relative court position rather than absolute court number.
- **Score Distribution Entry**: A recorded score value (0–24) from a completed Score24 match, tagged with the court number where it was played. Both teams' scores from a match produce independent entries.
- **Event Court Set**: The ordered, deduplicated set of court numbers active in a given event, used as the normalization reference for all matches in that event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player who consistently plays on the top court of any event (regardless of the total number of courts in that event) always sees a court-score of 10 for those matches in the trend chart.
- **SC-002**: A player can identify the most frequently occurring score value in their match history by inspecting the all-courts distribution bar chart in under 10 seconds.
- **SC-003**: After a new match is saved, the score distribution charts reflect the updated data within the same page load cycle as all other Deep Dive statistics.
- **SC-004**: For any event using non-contiguous courts (e.g., 1, 3, 5, 7), the court-score step between each adjacent pair of courts is equal, verifiable by comparing normalized values.
- **SC-005**: Per-court distribution charts appear only for courts with recorded data; zero phantom charts appear for courts that have never been played.
- **SC-006**: All distribution charts are horizontally scrollable when the full 0–24 axis exceeds the visible panel width, consistent with the existing scroll behavior for other charts in the panel.

## Assumptions

- Court-score normalization is scoped **per event**: the court set is determined by the courts assigned to that specific event (`event_courts` table), not by the courts actually active in a given round.
- Score distribution data is **player-scoped**: only matches in which the viewing player participated contribute to their distribution charts.
- The score distribution feature applies only to **Score24 result type** matches; WinLoss and WinLossDraw matches have no numeric score values to distribute.
- The distribution charts are **all-time only** with no time-window filter (unlike the avg-score-per-round chart which offers last-7-days / last-30-days / all-time variants); the distribution is treated as a lifetime statistical view.
- The existing "Avg court per round" line chart is **replaced** (not supplemented) by the normalized court-score chart; the raw court number view is removed to avoid confusion.
- Per-court distribution charts are ordered by court number ascending.
