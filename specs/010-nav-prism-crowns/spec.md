# Feature Specification: Navigation Shell, Prism Background, and Final Winner Crowns

**Feature Branch**: `010-nav-prism-crowns`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Add full-width top navigation shell, logo-only header button, final-summary winner crowns, and global prism background refresh."

## Clarifications

### Session 2026-02-27

- Q: Should prism background implementation use the exact provided ReactBits/OGL approach or allow equivalent alternatives? → A: Use the exact provided implementation and dependency behavior.
- Q: How should Mexicano ties at top score be crowned on final summary? → A: Crown all tied top-score players.
- Q: How should Americano final-highest-court draws be handled for crown assignment? → A: Not applicable; Americano winner inputs do not include draws.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognize final winners instantly (Priority: P1)

As an event host, I want winner crowns shown next to winning player names on the final summary so I can announce winners quickly and confidently.

**Why this priority**: Final-winner recognition is the core event outcome and directly affects host workflow at event close.

**Independent Test**: Complete an event and open final summary; verify crown visibility follows mode-specific winner rules and never appears on progress summary.

**Acceptance Scenarios**:

1. **Given** a completed Mexicano event final summary, **When** standings are shown, **Then** all top-score tied winners include crown icons.
2. **Given** a completed Americano event final summary, **When** standings are shown, **Then** both players from the winning team of the highest-court match in the final round include crown icons.
3. **Given** an in-progress event summary, **When** summary rows are shown, **Then** no crown icons are displayed.
4. **Given** a completed Americano event where highest-court winner cannot be determined, **When** final summary loads, **Then** no crown icons are shown and summary remains usable.

---

### User Story 2 - Use a cleaner branded header shell (Priority: P2)

As a host, I want a full-width top navigation shell with a centered branded logo button so the app looks intentional and ready for future controls.

**Why this priority**: Shell structure and branding improve orientation and prepares the app for upcoming navigation/actions.

**Independent Test**: Load any route and verify full-width nav appears at top, logo button remains operable, and image-only logo remains centered in the circular button.

**Acceptance Scenarios**:

1. **Given** any app page, **When** it renders, **Then** a full-width top nav container spans the viewport width above main content.
2. **Given** the header logo button, **When** it renders, **Then** it shows only the Molndal logo image with no text label.
3. **Given** keyboard and pointer users, **When** interacting with the logo button, **Then** focus and activation behavior remain accessible and unchanged.

---

### User Story 3 - Experience a consistent global background refresh (Priority: P3)

As a user, I want a dynamic prism-style background across the app that feels modern but does not reduce readability or accessibility.

**Why this priority**: Visual polish is valuable but secondary to winner recognition and shell structure.

**Independent Test**: Visit multiple routes and reduced-motion environments; confirm prism background appears globally, stays behind content, and degrades gracefully for reduced motion.

**Acceptance Scenarios**:

1. **Given** any route in the app, **When** page content loads, **Then** the prism background is visible behind content and does not block interactions.
2. **Given** a reduced-motion preference, **When** the app loads, **Then** background animation is reduced or disabled while visual coherence is retained.

---

### Edge Cases

- When summary data is final but winner-resolution inputs are incomplete or inconsistent, crown rendering falls back to no crowns without breaking summary display.
- When multiple players share top total score in Mexicano, all tied top-score players receive crowns.
- When logo asset fails to load, the button remains visible and usable with fallback branding treatment.
- When viewport size changes rapidly (mobile rotation), top nav and logo alignment remain stable and readable.
- When background rendering is unavailable or heavy on low-power devices, background falls back to a static non-blocking visual.

### Assumptions

- The existing final summary endpoint remains the source of truth for determining winner highlights.
- Branded assets for the logo and crown remain available at their current repository paths.
- Future controls will be added into the top navigation shell without requiring this feature to define those controls now.
- Americano result inputs always resolve a winner and do not support draw outcomes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a top navigation container that spans full viewport width on every app route.
- **FR-002**: System MUST keep existing page content structure below the top navigation container.
- **FR-003**: System MUST retain the header logo button as an interactive home action.
- **FR-004**: System MUST remove header logo text and display only the Molndal logo image inside the circular logo button.
- **FR-005**: System MUST align the logo image centerpoint to the circular button centerpoint on both axes.
- **FR-006**: System MUST preserve keyboard accessibility, focus visibility, and pointer usability for the logo button after visual updates.
- **FR-007**: System MUST render winner crown icons only on final summaries and never on progress summaries.
- **FR-008**: System MUST show crowns for all Mexicano players tied at the highest final total score.
- **FR-009**: System MUST determine Americano final winners from the final-round highest-court match winner and show crowns next to both winning player names.
- **FR-010**: System MUST show no crowns when Americano winner determination cannot be completed from available final-round highest-court data.
- **FR-010a**: System MUST treat draw-handling for Americano crown assignment as not applicable because draw outcomes are outside Americano result rules.
- **FR-011**: System MUST not show crowns for BeatTheBox summaries in this feature scope.
- **FR-012**: System MUST replace the existing global static light-rays background with a prism-style background experience across routes.
- **FR-012a**: System MUST use the provided prism background implementation behavior and dependency approach as-is, rather than an alternative rendering strategy.
- **FR-013**: System MUST keep background behind interactive UI and ensure it does not intercept user interaction.
- **FR-014**: System MUST provide reduced-motion behavior for background animation that preserves visual clarity and readability.
- **FR-015**: System MUST include automated test coverage for winner crown rules and shell/background rendering behavior.

### Key Entities *(include if feature involves data)*

- **Top Navigation Shell**: Persistent UI region at the top of the viewport with full-width layout and placeholder capacity for future controls.
- **Branded Logo Button**: Interactive circular control used for home navigation, containing only a centered logo image and accessible focus/activation behavior.
- **Winner Highlight**: Final-summary display state that marks eligible player rows with a crown icon based on event mode and winner-resolution rules.
- **Winner Resolution Rule**: Deterministic rule set for deriving crowned players in final summary (all top-score ties for Mexicano; final-round highest-court winning team for Americano with no draw outcomes; none for BeatTheBox).
- **Global Background Layer**: App-wide decorative backdrop that remains visually behind content and adapts for reduced-motion users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested routes, a full-width top navigation shell is present and main content remains readable and reachable.
- **SC-002**: In 100% of tested viewports (mobile and desktop), logo button displays image-only branding with centered alignment and no clipped logo content.
- **SC-003**: In 100% of final-summary test fixtures, crown visibility matches mode rules (Mexicano: crowns on all highest-score ties; Americano: 2 crowns from highest-court final match winner; BeatTheBox/progress: 0 crowns).
- **SC-004**: In reduced-motion test conditions, background animation is reduced/disabled while page readability and interaction completion remain unaffected.
