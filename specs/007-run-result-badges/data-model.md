# Data Model: Event Setup Label + Run Card Transparency + Inline Team Result Badges

## Entities

### 1) TeamButtonResultDisplay
- **Purpose**: UI state rendered inside each team button in run-event cards.
- **Fields**:
  - `matchId`: associated match identifier
  - `teamSide`: left/right or team1/team2
  - `label`: player-name text for the button
  - `resultBadge`: displayed outcome value (`Win`, `Loss`, `Draw`, or numeric score)
  - `isSelected`: selected-state indicator for active choice
- **Validation rules**:
  - Badge value must reflect most recent valid selection for the match.
  - When no selection exists, `resultBadge` is absent.

### 2) MirroredOutcomePair
- **Purpose**: Deterministic two-side display result derived from one host selection.
- **Fields**:
  - `mode`: `Americano` | `BeatTheBox` | `Mexicano`
  - `selectedSide`: side where host made selection
  - `selectedSideValue`: chosen outcome/score
  - `opposingSideValue`: computed mirror value
- **Validation rules**:
  - Americano/BeatTheBox Win-Loss values must be complementary.
  - BeatTheBox draw maps to draw on both sides.
  - Mexicano values must satisfy `selected + opposing = 24`.

### 3) PlayerSetupPanelState
- **Purpose**: Presentation state for create-event player section.
- **Fields**:
  - `heading`: must be `Players`
  - `assignedPlayers`: ordered list of assigned player entries
  - `listGrowthMode`: natural/block flow expansion
- **Validation rules**:
  - Assigned list visibility should not depend on internal fixed-height clipping for normal setup usage.

### 4) CourtCardVisualLayer
- **Purpose**: Visual treatment metadata for run-event card readability.
- **Fields**:
  - `overlayOpacity`: current overlay intensity applied over court image
  - `teamButtonTint`: preserved readability tint values
  - `helperTextVisible`: boolean indicating whether redundant muted helper is shown
- **Validation rules**:
  - Overlay opacity must permit clear court recognition.
  - Team button tint must maintain readable foreground contrast.
  - Helper text visibility should be false for this feature.

## Relationships

- `MirroredOutcomePair` drives two `TeamButtonResultDisplay` instances per match.
- `CourtCardVisualLayer` influences visual rendering of `TeamButtonResultDisplay` readability.
- `PlayerSetupPanelState.assignedPlayers` is sourced from existing create-event assignment state.

## State Transitions

### Team Button Result Flow
1. `no_result`
2. `selected_result_on_one_side`
3. `mirrored_values_computed`
4. `inline_badges_rendered_on_both_sides`
5. `updated_on_next_selection`

### Player Setup List Flow
1. `empty`
2. `assigned_entries_added`
3. `list_expands_downward`
4. `entries_removed_or_updated`
