# Spec 029 — Summary Screen & OCR Panel Fixes

**Feature Branch**: `029-summary-screen-bugs`
**Created**: 2026-03-09
**Status**: Draft
**Input**: Summary screen fixes and OCR panel improvements — fixing wrong leaderboard sort and crown placement for Americano, missing podium/crowns/confetti for Mexicano and Team Mexicano on final summary, wrong page title for Mexicano/Americano final summary, missing individual remove buttons in OCR paste panel, and event type checkboxes defaulting to unchecked in the event filter dropdown.

## Clarifications

### Session 2026-03-09

- Q: For Team Mexicano, who gets crowned — individual top scorer or winning team pair? → A: Both players of the top-scoring team are crowned (same as WinnersCourt pair logic). Ties share the crown.
- Q: Should removed names in the OCR panel be permanently gone or just deselected (re-selectable)? → A: Deselected only — name remains visible but unchecked; user can re-select by clicking the name row again.
- Q: Should the event type checkboxes default be "all checked" only on first visit or always when no stored state exists? → A: Any time no stored filter state is found (first visit or after clearing state), all checkboxes default to checked.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Americano Final Summary: Correct Sort Order, Crown, and Podium (Priority: P1)

As an organiser who has just finished an Americano event, I open the final summary screen and see players ranked from highest to lowest total score. The player with the most points appears at the top, has the crown icon next to their name, and occupies the centre (1st place) position on the podium.

**Why this priority**: This is a correctness bug on the primary outcome screen — the wrong player is displayed as the winner. It directly undermines trust in the result.

**Independent Test**: Finish an Americano event where players have different total scores. Open the summary. The player with the highest total score must appear in row 1, have the crown, and be in the 1st place podium slot. A player with fewer points must not have the crown.

**Acceptance Scenarios**:

1. **Given** a finished Americano event where Player A has 104 pts and Player B has 84 pts, **When** the summary screen loads, **Then** Player A appears in row 1 and Player B appears in row 2.
2. **Given** a finished Americano event, **When** the summary screen loads, **Then** the crown icon appears next to the player with the highest total score, not the player who happens to be at row 1 under the old (incorrect) ordering.
3. **Given** a finished Americano event, **When** the podium renders, **Then** the player with the highest total score occupies the centre 1st place slot.
4. **Given** two Americano players with equal total scores, **When** the summary screen loads, **Then** both share rank 1, both appear at the top of the table, and both show the crown icon.
5. **Given** a finished Americano event, **When** the confetti animation fires, **Then** it fires once on the final summary screen (same as all other non-RankedBox event types).

---

### User Story 2 — Mexicano and Team Mexicano Final Summary: Podium, Crowns, and Confetti (Priority: P1)

As an organiser who has finished a Mexicano or Team Mexicano event by pressing the Finish button, I see the full celebration screen — including the podium, crown icons on the winners, and the confetti/fireworks animation — identical to the WinnersCourt experience.

**Why this priority**: This is a high-visibility missing feature on the most important screen of the event. The celebration moment is the payoff for the entire session.

**Independent Test**: Finish a Mexicano event (press Finish after at least one completed round). Navigate to the summary screen. The page must show: a podium section with 1st/2nd/3rd slots, a crown icon next to the top scorer in the table, and a confetti animation that plays once on load.

**Acceptance Scenarios**:

1. **Given** a finished Mexicano event, **When** the final summary screen loads, **Then** a podium section is rendered showing the top 3 players in 1st/2nd/3rd positions.
2. **Given** a finished Mexicano event, **When** the final summary screen loads, **Then** the player with the highest total score has a crown icon next to their name in the table.
3. **Given** a finished Mexicano event, **When** the final summary screen loads, **Then** confetti/fireworks animation fires once.
4. **Given** a finished Team Mexicano event, **When** the final summary screen loads, **Then** a podium section renders, crowns appear on the top-scoring team's player entries, and confetti fires.
5. **Given** two Mexicano players with equal total scores, **When** the summary screen loads, **Then** both share rank 1 and both show crown icons.
6. **Given** a Mexicano event that is still in progress (not yet finished), **When** the progress summary screen is viewed, **Then** no podium, no crowns, and no confetti are shown — the progress view is unchanged.

---

### User Story 3 — Mexicano and Americano Final Summary: Correct Page Title (Priority: P2)

As an organiser viewing the final summary of a finished Mexicano or Americano event, I see the page title "Summary" — not "Progress Summary". The title "Progress Summary" correctly describes an in-progress view and must not appear on the final screen.

**Why this priority**: Low-severity visual inconsistency but erodes confidence in whether the event was actually finished.

**Independent Test**: Finish a Mexicano event. Open the summary. The page heading must read "Summary". Navigate to an in-progress event's summary. The page heading must read "Progress Summary".

**Acceptance Scenarios**:

1. **Given** a finished Mexicano event, **When** the summary screen loads, **Then** the page title reads "Summary".
2. **Given** a finished Americano event, **When** the summary screen loads, **Then** the page title reads "Summary".
3. **Given** an in-progress (not yet finished) Mexicano or Americano event, **When** the progress summary is viewed, **Then** the page title reads "Progress Summary".
4. **Given** a finished WinnersCourt event, **When** the summary screen loads, **Then** the page title continues to read "Summary" (no regression).

---

### User Story 4 — OCR Paste Panel: Remove Individual Names from Either Column (Priority: P2)

As an organiser using the OCR/paste import tool to build the player roster, I can remove individual names from both the left column (players already in the system) and the right column (new/unmatched names) without having to clear the entire panel. Removed names are deselected from the confirm action but remain visible so I can re-add them if I change my mind.

**Why this priority**: Currently the only way to exclude a wrongly-detected name is to clear the whole panel and paste again. This is a friction point in the primary player setup flow.

**Independent Test**: Paste a list of 4+ player names. In the results panel, click the remove button on one left-column name and one right-column name. Verify both are deselected (visually deselected, not counted in the confirm button). Verify clicking the name row again re-selects it.

**Acceptance Scenarios**:

1. **Given** OCR results are displayed, **When** the organiser views the left column (in-system players), **Then** each name row has a visible remove/deselect button.
2. **Given** OCR results are displayed, **When** the organiser views the right column (new players), **Then** each name row has a visible remove/deselect button.
3. **Given** an in-system name is showing in the left column, **When** the organiser clicks its remove button, **Then** the name is deselected (visually indicated as unchecked) and will not be included when "Add to Roster" is confirmed.
4. **Given** a new player name is showing in the right column, **When** the organiser clicks its remove button, **Then** the name is deselected and will not be included in any confirm action.
5. **Given** a name has been deselected via the remove button, **When** the organiser clicks the name row again, **Then** the name is re-selected.
6. **Given** a name is deselected, **When** the organiser confirms the roster, **Then** the deselected name is NOT added to the roster below.
7. **Given** a name is deselected via the remove button, **When** the roster list below is inspected, **Then** no player is removed from the roster (the roster is unaffected by deselection).

---

### User Story 5 — Event Filter: All Event Types Checked by Default (Priority: P3)

As an organiser opening the event filter dropdown for the first time, all event type checkboxes are visually checked, correctly reflecting that all event types are currently being shown.

**Why this priority**: Low-severity visual bug — the filter functions correctly (shows all events) but the checkboxes appear empty, creating confusion about whether filtering is active.

**Independent Test**: Clear any stored filter state. Open the Events page. Open the filter dropdown. Expand the "Event types" section. All checkboxes (WinnersCourt, Mexicano, Americano, RankedBox and the Team Mexicano sub-filter) must appear visually checked.

**Acceptance Scenarios**:

1. **Given** no stored event filter state exists, **When** the organiser opens the filter dropdown and expands "Event types", **Then** all event type checkboxes are visually checked.
2. **Given** all event types are selected (default state), **When** the organiser expands "Event types", **Then** all checkboxes show a checked visual state — not empty/indeterminate.
3. **Given** the organiser unchecks one event type, closes the dropdown, and reopens it, **Then** the unchecked type remains unchecked (persistence is not broken by this fix).
4. **Given** a previously stored filter state with all types selected, **When** the dropdown is opened, **Then** all checkboxes render as checked.

---

### Edge Cases

- Americano event with all players tied on total score: all players share rank 1 and all show crown icons; podium 1st slot shows all tied players.
- Mexicano event finished after only 1 round: podium and crowns still render based on that 1 round's scores.
- Empty `crownedPlayerIds` returned from the backend for any event type: podium renders without crown icons; no crash.
- OCR panel in "register" mode (not roster mode): remove buttons must NOT appear on already-registered (disabled) entries in the left column, consistent with their non-interactive state.
- OCR panel with all names individually deselected: the "Add to Roster" confirm button becomes disabled (0 players selected).
- Event filter with only some event types stored in state: those stored types remain checked; missing types default to checked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The final summary screen for Americano events MUST display player rows sorted by total score in descending order (highest score = rank 1 at top of table).
- **FR-002**: The final summary screen for Americano events MUST assign competition ranks: tied players share the same rank number; the next rank after a tie group skips the appropriate count.
- **FR-003**: The final summary screen for Americano events MUST place the crown icon on the player(s) with the highest total score.
- **FR-004**: The final summary screen for Americano events MUST display the podium with the highest-scoring player in the 1st place (centre) slot.
- **FR-005**: The final summary screen for Mexicano events MUST display a podium section with 1st, 2nd, and 3rd place slots populated from the final standings.
- **FR-006**: The final summary screen for Mexicano events MUST display crown icons on the highest-scoring player(s) — both in the table and on the podium.
- **FR-007**: The final summary screen for Team Mexicano events MUST display a podium, crown icons on both players of the top-scoring team, and confetti — matching Mexicano final behaviour.
- **FR-008**: Confetti/fireworks animation MUST fire once on load for all non-RankedBox event types on the final summary screen (WinnersCourt, Mexicano, Team Mexicano, Americano).
- **FR-009**: The progress summary screen (in-progress events) MUST NOT show podium, crowns, or confetti — this view remains unchanged.
- **FR-010**: The final summary screen for Mexicano and Americano events MUST display the page title "Summary", not "Progress Summary".
- **FR-011**: The progress summary screen for all event types MUST continue to display the page title "Progress Summary".
- **FR-012**: The OCR import panel MUST display an individual remove/deselect button on each name row in the left column (matched/in-system players) when in roster mode.
- **FR-013**: The OCR import panel MUST display an individual remove/deselect button on each name row in the right column (new/unmatched players).
- **FR-014**: Clicking a remove button in the OCR panel MUST deselect that name entry so it is excluded from the confirm action; it MUST NOT remove any player from the roster list below.
- **FR-015**: A deselected name in the OCR panel MUST be re-selectable by clicking the name row again.
- **FR-016**: The event type checkboxes in the event filter dropdown MUST render as visually checked whenever all event types are active (including on first load with no stored state).
- **FR-017**: The Team Mexicano sub-filter checkbox MUST persist its state across page loads (default: checked when no stored state exists).

### Key Entities

- **Final Summary**: The post-finish view of an event showing the definitive ordered leaderboard, podium, crowns, and confetti. Only accessible after the organiser presses Finish.
- **Progress Summary**: The mid-event view showing the current standings matrix. Accessible at any point during an ongoing event. Never shows podium, crowns, or confetti.
- **Crowned Players**: The player(s) who won the event. For score-based modes (Mexicano, Americano): the player(s) with the highest total score. For WinnersCourt: the two players who won the final match on the highest court. For Team Mexicano: both players of the top-scoring team.
- **OCR Results Panel**: The two-column panel that appears after pasting player names. Left column = names matched to existing players. Right column = names not found in the system. Both columns are part of the confirm flow.
- **Event Type Filter**: The set of checkboxes in the filter dropdown controlling which event modes are shown in the event list. Defaults to all types selected.

## Assumptions

- The backend already correctly returns `crownedPlayerIds` for Mexicano events (verified in `summary_service.py` — `_crowned_players_for_mexicano` exists and groups Americano with Mexicano). The primary fix for Mexicano is on the frontend rendering path.
- The Americano sort order bug originates in the backend's `order_final_rows` function, which does not yet have an explicit Americano branch. The frontend receives already-ordered rows and trusts the backend rank.
- RankedBox events intentionally do NOT show a podium, crown, or confetti. This is existing correct behaviour and must not change.
- The OCR panel remove button is styled consistently with the existing red "−" remove button used in the roster list below the panel.
- "Team Mexicano" is not a separate `EventType` value in the backend — it is a Mexicano event with `isTeamMexicano: true`. Crowning logic for Team Mexicano must account for this flag to crown both members of the winning team pair.

## Dependencies

- Existing `crownedPlayerIds` field in the final summary API response (already present).
- Existing confetti scheduler utility (already present, already fires for WinnersCourt).
- Existing podium component (already present, already renders for WinnersCourt and Americano).
- Existing OCR panel `checked` state and `toggleChecked` function.
- Existing event filter `modeFilters` state and `parseSavedModeFilters` function.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On any finished Americano event, the player with the highest total score occupies rank 1, has the crown icon, and is in the 1st place podium slot in 100% of tested cases.
- **SC-002**: On any finished Mexicano or Team Mexicano event, the final summary screen shows a podium, at least one crowned player, and confetti fires — verified for 100% of finished events tested.
- **SC-003**: The page title "Summary" appears on 100% of finished-event summary screens for Mexicano, Americano, and WinnersCourt. "Progress Summary" appears on 100% of in-progress summary screens.
- **SC-004**: Using the OCR panel, an organiser can individually deselect any name from either column and confirm the roster without that name in under 5 seconds of interaction — verified across left and right column entries.
- **SC-005**: On first load with no stored filter state, 100% of event type checkboxes in the filter dropdown are visually checked.
- **SC-006**: All existing backend tests continue to pass with no regressions.
- **SC-007**: All existing frontend tests continue to pass with no regressions.
- **SC-008**: New tests cover: Americano final ordering, Mexicano crown/podium rendering, OCR remove button deselection, and event filter default checked state.
