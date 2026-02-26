# Data Model: Event Progress UX Improvements

## Overview

This feature extends UI/interaction behavior and summary-view semantics while preserving existing event progression and scoring outcomes.

## Entities

### 1) PlayerSuggestionOption
- **Purpose**: Represents one selectable suggestion in the setup listbox.
- **Fields**:
  - `playerId`: unique player identifier
  - `displayName`: player name shown in listbox
  - `matchReason`: derived prefix-match justification
- **Validation rules**:
  - Included only when case-insensitive prefix match succeeds.
  - List starts after first typed character.

### 2) EventScheduleInput
- **Purpose**: Captures scheduling values in create-event flow.
- **Fields**:
  - `eventDate`: selected calendar date
  - `eventTime24h`: selected time in 24-hour format
- **Validation rules**:
  - Time must be in 00:00-23:59 range.
  - Combined schedule must be present for valid submission.

### 3) CourtMatchCardView
- **Purpose**: Visual representation of one court match in run-event flow.
- **Fields**:
  - `courtNumber`: court identifier
  - `courtImageRef`: fixed asset reference (`images/courts/court-bg-removed.png`)
  - `teamSides`: two positional clickable side zones rendered on court image
  - `teamDisplayNames`: mapped player display names per side
  - `hoveredSide`: currently hovered side for highlight rendering
  - `selectedSide`: side selected to open modal and apply result semantics
- **Validation rules**:
  - Image fallback behavior must preserve readable and clickable controls.
  - Team-side overlays must show display names (not raw IDs) when names are available.
  - Hover highlight applies only to the active side under pointer focus.

### 4) ResultModalContext
- **Purpose**: Encapsulates result entry state after host clicks a side on a court card.
- **Fields**:
  - `matchId`: selected match identifier
  - `mode`: event mode (`Americano`, `BeatTheBox`, `Mexicano`)
  - `selectedSide`: clicked side (`team1` or `team2`)
  - `isOpen`: modal visibility state
  - `availableOptions`: mode-specific option set shown to host
- **Validation rules**:
  - Modal opens only from team-side click.
  - Submitted result interpretation is side-relative.
  - Modal close/cancel does not mutate result state.

### 5) MexicanoModalOptionSet
- **Purpose**: Represents selectable Mexicano score alternatives in modal.
- **Fields**:
  - `selectedSideScore`: integer score assigned to clicked side
  - `opposingSideScore`: derived score (`24 - selectedSideScore`)
  - `optionKey`: unique key used for selectable option button
- **Validation rules**:
  - Exactly 24 clickable options are rendered.
  - Every option enforces score-pair complement rule (`selected + opposing = 24`).

### 6) ProgressSummaryMatrix
- **Purpose**: In-progress read-only summary for ongoing events.
- **Fields**:
  - `playerRows`: list of players
  - `roundColumns`: ordered rounds or match slots
  - `cellValue`: played result or `-` for unplayed
  - `isFinal`: false for progress summary
- **Validation rules**:
  - Every player row renders all relevant columns.
  - Unplayed entries render as `-` consistently.

### 7) FinalSummaryView
- **Purpose**: Existing completed-event summary for finished events.
- **Fields**:
  - `playerStandings`: completed summary rows
  - `matchHistory`: final match outcomes
  - `isFinal`: true
- **Validation rules**:
  - Existing completed-event behavior remains unchanged.

## Relationships

- `PlayerSuggestionOption.playerId` maps to existing player catalog entries.
- `CourtMatchCardView.teamDisplayNames` derive from existing player catalog/event context mapping.
- `ResultModalContext.matchId` and `selectedSide` drive `WinnerSelectionState` updates and payload construction.
- `MexicanoModalOptionSet` is consumed inside `ResultModalContext.availableOptions` for Mexicano mode.
- `ProgressSummaryMatrix` and `FinalSummaryView` share base event/round data but differ in completion-state semantics.

## State Transitions

### WinnerSelectionState lifecycle
1. `unselected`
2. `side_hovered`
3. `side_selected`
4. `modal_open`
5. `submitted`
6. reset for next match context

### ResultModal lifecycle
1. `closed`
2. `open` (initiated from side click)
3. `option_selected`
4. `submitted` (result persisted)
5. `closed` (or canceled without mutation)

### Summary view mode lifecycle
1. `in_progress` -> progress summary matrix available
2. `completed` -> final summary view available
3. transition determined by event completion state, not by manual view action
