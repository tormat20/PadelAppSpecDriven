# Phase 0 Research - Calendar Drag-and-Drop POC on EventRecord

## Decision 1: Team Mexicano representation

- **Decision**: Represent Team Mexicano as `eventType = "Mexicano"` with `isTeamMexicano = true`, and render the label "Team Mexicano" in calendar UI when the flag is true.
- **Rationale**: This preserves compatibility with existing EventRecord semantics and avoids introducing a new event-type enum variant that could ripple through backend, validation, and existing UI assumptions.
- **Alternatives considered**:
  - Add a new explicit `eventType = "TeamMexicano"`: rejected for POC because it expands type contracts and increases migration risk.
  - Keep only "Mexicano" label everywhere: rejected because it fails the user requirement to distinguish Team Mexicano in calendar cards.

## Decision 2: Duration source-of-truth for POC

- **Decision**: Use a calendar-local derived field `durationMinutes` constrained to `60 | 90 | 120` for rendering and interactions, while keeping original EventRecord fields intact.
- **Rationale**: Existing data often derives duration from round metadata. A local duration field enables safe interactive editing in POC scope without backend persistence or schema changes.
- **Alternatives considered**:
  - Directly mutate `totalRounds` and `roundDurationMinutes`: rejected because reverse-mapping from allowed UI durations can be lossy and introduces unintended business-logic coupling.
  - Add persistent duration immediately in backend: rejected because phase 1 explicitly excludes backend write persistence.

## Decision 3: Drag/drop integration strategy

- **Decision**: Reuse the existing app calendar drag/drop structure as the base and extract only minimal interaction patterns from the Figma prototype where needed.
- **Rationale**: The repository already has tested calendar helper logic and route integration points. Reusing this minimizes risk and dependency churn while still delivering a working drag-and-drop POC.
- **Alternatives considered**:
  - Mount full Figma app and import wholesale components: rejected due to dependency bloat and design-system mismatch.
  - Rebuild from scratch without any Figma reference: rejected because user specifically wants Figma-derived behavior integrated.

## Decision 4: Styling and Tailwind strategy

- **Decision**: Do not introduce global Tailwind pipeline for this POC; style integrated calendar with existing theme tokens/classes and scoped additions only.
- **Rationale**: Global resets from a new styling stack risk regressions across existing pages. The POC requires safe integration and visual consistency with current app theme.
- **Alternatives considered**:
  - Full Tailwind v4 integration from Figma export: rejected for phase 1 due to global style and dependency impact.
  - Raw copied Figma class names without style pipeline: rejected because output quality and maintainability are poor.

## Decision 5: POC persistence boundary

- **Decision**: Persist no drag/drop or duration edits to backend in this phase; all edits remain in local in-memory calendar state after initial load.
- **Rationale**: Keeps scope focused on proving interaction viability and EventRecord mapping under `/calendar` before introducing concurrency and backend update semantics.
- **Alternatives considered**:
  - Immediate backend PATCH persistence: rejected for phase 1 scope and risk.
  - LocalStorage persistence: rejected to avoid creating implicit persistence behavior that conflicts with stated non-goals.
