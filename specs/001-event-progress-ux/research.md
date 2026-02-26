# Phase 0 Research: Event Progress UX Improvements

## Decision 1: Search suggestions should be rendered as an interactive listbox anchored to input
- **Decision**: Use an inline suggestion listbox directly under the player input, updating from first character with case-insensitive prefix filtering.
- **Rationale**: This aligns with host expectations for quick lookup and supports progressive narrowing without extra button clicks.
- **Alternatives considered**:
  - Explicit search-button-only flow.
  - Suggestion rendering in a separate side panel.

## Decision 2: Use explicit 24-hour date-time capture in setup flow
- **Decision**: Capture date and time together in setup, constrained to 00:00-23:59 semantics.
- **Rationale**: Hosts need exact scheduling intent and current date-only input is insufficient.
- **Alternatives considered**:
  - Date-only input with implicit default time.
  - 12-hour AM/PM input model.

## Decision 3: Court cards should include visual court context without removing click affordances
- **Decision**: Use `images/courts/court-bg-removed.png` as the run-event court-card background and render team overlays directly on court sides with readable contrast.
- **Rationale**: Visual context improves comprehension during live scoring; clickability remains required for interaction clarity.
- **Alternatives considered**:
  - Keep plain text-only court cards.
  - Continue previous court image asset path.

## Decision 4: Team-side click should launch side-relative modal result entry
- **Decision**: Clicking a court side opens a mode-specific result modal, and submitted outcomes are interpreted relative to the clicked side.
- **Rationale**: Hosts act from court position context; side-relative semantics reduce accidental opposite-team submissions.
- **Alternatives considered**:
  - Side click only highlights, with separate control for submission.
  - Absolute Team 1/Team 2 result controls detached from clicked side.

## Decision 5: Mexicano scoring options should be fixed and directly clickable
- **Decision**: Present exactly 24 clickable score alternatives in the modal for Mexicano; choosing score `X` on selected side auto-assigns `24 - X` to the opposing side.
- **Rationale**: Fixed, non-scroll options speed host entry and encode score-pair validity without manual arithmetic.
- **Alternatives considered**:
  - Smaller curated option subset.
  - Free-form numeric input for both teams.

## Decision 6: Introduce in-progress read-only progress summary separate from finalization behavior
- **Decision**: Support progress summary access for in-progress events; preserve final summary behavior for completed events.
- **Rationale**: Hosts need mid-event visibility without triggering finish-only constraints.
- **Alternatives considered**:
  - Keep summary route blocked until final round completion.
  - Force event finalization before any summary view.

## Decision 7: Preserve backward compatibility for summary API consumers
- **Decision**: If backend contract changes are required, add compatibility-safe behavior rather than breaking existing completed-summary consumers.
- **Rationale**: Existing flows and integrations must continue to work unchanged.
- **Alternatives considered**:
  - Replace summary response shape globally.
  - Introduce breaking route semantics without fallback.

## Decision 8: Keep run-event name resolution in frontend without backend contract expansion
- **Decision**: Resolve player identifiers to display names in frontend run-event view using existing event/player data rather than adding name fields to round payload contracts.
- **Rationale**: Avoids backend schema churn and protects existing round payload consumers while meeting overlay readability requirements.
- **Alternatives considered**:
  - Add display-name fields to round endpoint response.
  - Hybrid response with optional extra naming fields.

## Decision 9: Apply Magic Bento-inspired interactions at event-flow scope now
- **Decision**: Apply Magic Bento-inspired hover/click interaction language to interactive cards/buttons in event flows and codify it in repo agent guidance for future component work.
- **Rationale**: Provides consistent visual feedback across host-critical flows without forcing immediate app-wide redesign.
- **Alternatives considered**:
  - Restrict effects only to run-event court cards.
  - Apply effects app-wide in a single pass.
