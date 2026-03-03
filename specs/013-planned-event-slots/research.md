# Phase 0 Research: Planned Event Slots with Deferred Setup Validation

## Decision: Model setup readiness separately from runtime lifecycle
- **Decision**: Keep existing runtime lifecycle (`Lobby`, `Running`, `Finished`) and add a separate setup-readiness concept with values `planned` and `ready`.
- **Rationale**: Existing run/finish logic already depends on runtime status; separating setup readiness avoids regressions while enabling deferred setup.
- **Alternatives considered**:
  - Replace runtime status enum with `planned/ready/running/finished`.
  - Derive readiness only on frontend without backend persistence.

## Decision: Use mode-specific readiness validation as the single source of truth
- **Decision**: Readiness is computed using existing mode/courts/player-count rules and exposed with a missing-requirements list.
- **Rationale**: Spec clarification requires exact mode rules; central validation prevents frontend/backend drift.
- **Alternatives considered**:
  - Use minimal setup threshold (any court + 4 players).
  - Allow manual organizer override to mark ready.

## Decision: Allow planned-slot creation with planning fields only
- **Decision**: Event creation accepts name, mode, date, and start time, without requiring courts/players at creation.
- **Rationale**: Core business need is advance scheduling before attendance is known.
- **Alternatives considered**:
  - Keep current strict create validation and add separate placeholder object.
  - Require partial setup at creation (for example at least one court).

## Decision: Add warning-based behavior for past date/time and duplicates
- **Decision**: Past date/time values and duplicate name+date+time values are allowed but produce explicit warnings and clear disambiguation in list/detail views.
- **Rationale**: Matches clarified UX decisions and supports legitimate operational cases without hard blocking.
- **Alternatives considered**:
  - Block past values and duplicates entirely.
  - Allow both silently.

## Decision: Use optimistic concurrency with explicit version conflict
- **Decision**: Add an event version token and reject stale updates with conflict feedback requiring refresh/retry.
- **Rationale**: Repository has no conflict protection today; explicit version checks prevent silent overwrite and align with clarified FR-014.
- **Alternatives considered**:
  - Last write wins.
  - `updated_at` compare check only.
  - HTTP `ETag`/`If-Match` flow.

## Decision: Preserve existing start/run guardrails and expand error clarity
- **Decision**: Keep backend blocking of run/start when setup is incomplete and return actionable missing requirements.
- **Rationale**: Maintains current safety model and improves operator guidance.
- **Alternatives considered**:
  - Allow start and fail later during scheduling.
  - Frontend-only blocking with no backend enforcement.
