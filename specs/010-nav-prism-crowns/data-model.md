# Data Model: Navigation Shell, Prism Background, and Final Winner Crowns

## Entities

### 1) TopNavShell
- **Purpose**: Persistent app-level top container spanning full viewport width.
- **Fields**:
  - `isGlobal`: always true for app routes
  - `isFullWidth`: true when rendered edge-to-edge
  - `placeholderSlots`: reserved region(s) for future controls
  - `zLayer`: stacking priority above background and below modal overlays
- **Validation rules**:
  - Must render on every route within app shell.
  - Must not constrain or distort existing main content layout.

### 2) LogoHomeButton
- **Purpose**: Branded home-navigation control inside top nav shell.
- **Fields**:
  - `assetPath`: `/images/logos/Molndal-padel-bg-removed.png`
  - `shape`: circular
  - `textVisible`: false for this feature
  - `centerAligned`: true when logo center matches button center on both axes
  - `isFocusable`: keyboard-focus enabled
  - `action`: navigate home
- **Validation rules**:
  - Button remains operable and focus-visible.
  - Logo image renders centered regardless of viewport size.
  - Text labels are not rendered in the button presentation.

### 3) PrismBackgroundLayer
- **Purpose**: Global decorative animated background behind interactive content.
- **Fields**:
  - `animationType`: configured per provided prism behavior
  - `timeScale`, `height`, `baseWidth`, `scale`, `hueShift`, `colorFrequency`, `noise`, `glow`
  - `isInteractive`: false (non-blocking for UI interaction)
  - `reducedMotionMode`: animation reduced/disabled with stable visual fallback
- **Validation rules**:
  - Visible across routes in app shell.
  - Never intercepts pointer/keyboard interaction for foreground controls.
  - Honors reduced-motion preference.

### 4) FinalSummaryCrownResolution
- **Purpose**: Represents deterministic crown assignment results for final summaries.
- **Fields**:
  - `eventId`: summary event identifier
  - `mode`: `Mexicano` | `Americano` | `BeatTheBox`
  - `crownedPlayerIds`: ordered list of player IDs to mark with crown icon
  - `resolutionSource`: `mexicano-top-score` | `americano-final-highest-court` | `none`
- **Validation rules**:
  - Progress summaries must have empty `crownedPlayerIds`.
  - Mexicano final summaries include all top-score ties.
  - Americano final summaries include exactly two players from winning team of final-round highest-court match when determinable.
  - BeatTheBox summaries include no crowns.

### 5) FinalSummaryResponseExtension
- **Purpose**: API response extension carrying crown assignment for frontend rendering.
- **Fields**:
  - Existing final summary payload fields
  - `crownedPlayerIds: string[]`
- **Validation rules**:
  - Field appears for final summary responses.
  - Field defaults to empty array when no crowns apply.

## Relationships

- `TopNavShell` contains `LogoHomeButton`.
- `PrismBackgroundLayer` is rendered by app shell behind `TopNavShell` and main page content.
- `FinalSummaryResponseExtension` serializes `FinalSummaryCrownResolution` for frontend summary table rendering.

## State Transitions

### Summary mode and crown visibility
1. `progress-summary` -> `crownedPlayerIds = []`
2. `final-summary-loaded` -> compute crown resolution by mode
3. `final-summary-rendered` -> apply crown icon to rows where `playerId` in `crownedPlayerIds`

### Background motion preference
1. `default-motion` -> animated prism enabled
2. `reduced-motion-detected` -> animation reduced/disabled
3. `render-stable-background` -> static coherent visual retained
