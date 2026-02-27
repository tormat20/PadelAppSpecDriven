# Feature Specification: Event Progress UX Improvements

**Feature Branch**: `001-event-progress-ux`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Improve event setup search UX, event scheduling input, run-event court presentation, winner selection clarity, and summary behavior for in-progress events."

## Clarifications

### Session 2026-02-26

- Q: What should happen when a host clicks a team side on a court card? → A: Clicking a team side opens a mode-specific result modal for that selected side.
- Q: How many Mexicano options must be available in the modal? → A: Exactly 24 clickable alternatives must be shown.
- Q: How should Mexicano opposing score be handled? → A: If the selected side chooses score `X`, the opposing side is automatically assigned `24 - X`.
- Q: What is the scope of Magic Bento-inspired effects? → A: Apply to interactive cards/buttons in event flows now, and document as default repo guidance for future components.
- Q: How are modal outcomes interpreted after clicking a team side? → A: Modal choices are side-relative and apply to the clicked side.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete event setup with faster search and proper scheduling (Priority: P1)

As a host creating an event, I can search players from a dropdown/listbox that narrows as I type and enter both date and 24-hour time so setup is fast and accurate.

**Why this priority**: Event setup is the entry point to every event and currently causes immediate friction.

**Independent Test**: In create event, type one character and confirm listbox suggestions appear; continue typing to narrow matches; set date and time in 24-hour format; submit valid setup with unchanged rule checks.

**Acceptance Scenarios**:

1. **Given** a player catalog with multiple names sharing a first letter, **When** the host types the first character, **Then** all case-insensitive prefix matches appear in the suggestion listbox.
2. **Given** the host continues typing, **When** prefix becomes more specific, **Then** suggestion results narrow accordingly and remain keyboard/mouse selectable.
3. **Given** the host sets event schedule, **When** they choose date and time, **Then** the form accepts 24-hour time values from 00:00 to 23:59.

---

### User Story 2 - Run matches with clear court context and unambiguous winner choice (Priority: P2)

As a host running matches, I can view each match on a court image card with clear team-side overlays, click a side, and submit results through a side-relative modal so scoring is fast and unambiguous.

**Why this priority**: During live operation, unclear visualization or winner state can cause scoring errors.

**Independent Test**: In run event view, verify each court card shows the configured court image with display names (not IDs), hover-highlight a team side, click it to open a mode-specific modal, submit a valid side-relative result, and confirm match progression remains correct.

**Acceptance Scenarios**:

1. **Given** round matches are displayed, **When** the host views a court card, **Then** the configured court image is shown with team-side overlays that display player names.
2. **Given** the host hovers one team side, **When** pointer focus is on that side, **Then** only that side visibly highlights.
3. **Given** the host clicks a team side, **When** the modal opens, **Then** available result options match event mode and apply to the clicked side.
4. **Given** event mode is Mexicano, **When** the host selects score `X` for the clicked side, **Then** the opposing side score is automatically set to `24 - X`.

---

### User Story 3 - View progress summary before event completion (Priority: P3)

As a host, I can open a progress summary before final round completion to review each player's round-by-round status and return to continue the event.

**Why this priority**: Hosts need progress visibility mid-event and should not be blocked by finalization-only summary logic.

**Independent Test**: From an in-progress event, open summary/progress view, confirm rows by player and round/match values with `-` for unplayed items, then use Back to return to run event and continue.

**Acceptance Scenarios**:

1. **Given** an event is not finished, **When** the host opens summary, **Then** a progress summary is shown instead of a finalization error.
2. **Given** some rounds are unplayed, **When** progress summary renders, **Then** unplayed cells show `-`.
3. **Given** the host is on progress summary, **When** they choose Back, **Then** they return to run event context without losing progress.

---

### Edge Cases

- No suggestion matches for typed prefix should show an explicit empty-result state while preserving input focus.
- Duplicate names with different casing should still follow existing duplicate handling behavior without creating ambiguous suggestions.
- Invalid or missing time values should prevent submission with clear guidance.
- Court image load failure should degrade gracefully while preserving clickable player grouping controls.
- Progress summary for an event with zero completed matches should still render full player rows with all `-` entries.
- Closing or canceling the result modal should not record or alter match state.
- Team overlays must render display names even when round payload contains player identifiers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render player search suggestions as an inline dropdown/listbox positioned beneath the player input.
- **FR-002**: Suggestion results MUST start at the first typed character and narrow using case-insensitive prefix matching as input changes.
- **FR-003**: Suggestion listbox interactions MUST support both keyboard and mouse selection.
- **FR-004**: Event setup MUST capture both date and time, with time input constrained to 24-hour format from 00:00 to 23:59.
- **FR-005**: Run event court cards MUST display the provided court image asset for each match context.
- **FR-006**: Team overlays on each court card MUST display player display names (not raw player identifiers) and remain clearly readable over the court image.
- **FR-007**: Team-side zones on each court card MUST be clickable and side-specific hover highlighting MUST be shown.
- **FR-008**: Clicking a team-side zone MUST open a result modal bound to that selected side.
- **FR-009**: Modal options MUST be mode-specific: Americano = Win/Loss, BeatTheBox = Win/Loss/Draw, Mexicano = exactly 24 clickable alternatives.
- **FR-010**: For Mexicano modal selections, choosing score `X` for the selected side MUST automatically assign `24 - X` to the opposing side.
- **FR-011**: Modal result semantics MUST be side-relative (the chosen outcome applies to the clicked side).
- **FR-012**: Magic Bento-inspired hover/effect behavior MUST be applied to interactive cards/buttons in event flows and documented as the default style guidance for future components.
- **FR-013**: Hosts MUST be able to open a summary-style view for in-progress events without triggering a final-round-only error.
- **FR-014**: The summary experience MUST distinguish between progress summary (in-progress) and final summary (completed event).
- **FR-015**: Progress summary MUST render players as rows and round/match status as columns/cells, using `-` for unplayed entries.
- **FR-016**: Progress summary MUST provide a Back navigation action that returns the host to run event flow.
- **FR-017**: Existing event creation constraints, round progression rules, and scoring behavior MUST remain unchanged by this feature.
- **FR-018**: If progress summary requires API changes, any updated contract MUST preserve backward compatibility for existing completed-summary consumers.

### Key Entities *(include if feature involves data)*

- **Player Suggestion Listbox**: Dynamic case-insensitive prefix-filtered options anchored to the player input.
- **Event Schedule Input**: Combined event date and 24-hour time entry used during setup.
- **Court Match Card**: Visual match container with court image background and clickable team/player grouping elements.
- **Winner Selection State**: Per-match selected winner control state retained until change or submission.
- **Progress Summary Matrix**: In-progress event grid with player rows and round/match cells including `-` placeholders for unplayed entries.
- **Final Summary View**: Completed-event summary representation preserved for finished events.

### Dependencies & Assumptions

- Existing route structure remains intact, with behavior updates applied within current flow destinations.
- Existing duplicate-player handling remains in force and is not redefined by this feature.
- Provided court image asset path remains available for frontend usage.
- Progress summary is read-only and does not finalize or mutate event state.
- Run-event view resolves player identifiers to display names in the frontend without requiring a backend contract change.
- Event-flow interactive cards/buttons follow Magic Bento-inspired hover/effect guidance as the baseline UX language.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In setup usability checks, hosts can retrieve expected player suggestions from first-character input in at least 95% of test attempts.
- **SC-002**: In setup validation checks, valid date+time values in 24-hour format are accepted and invalid time values are rejected in 100% of tested cases.
- **SC-003**: In run-event interaction checks, hovered team-side highlighting and side-relative modal behavior are correct in 100% of tested matches.
- **SC-004**: In in-progress events, summary access succeeds without finalization error in 100% of tested scenarios.
- **SC-005**: In progress summary checks, unplayed cells render as `-` and Back navigation returns to run event flow in 100% of tested scenarios.
- **SC-006**: Regression checks confirm no change to existing event creation constraints, round progression rules, or scoring outcomes.
