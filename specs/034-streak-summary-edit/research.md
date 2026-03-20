# Research: Ongoing Summary and Streak Badges

## Decision 1: Compute streaks from persisted chronological match outcomes within the active event

- **Decision**: Derive streaks from each player's ordered result history in the current ongoing event only, recalculated after every result submit or correction.
- **Rationale**: The feature intent is momentum in live play; event-local streaks are understandable to hosts and resilient to edits.
- **Alternatives considered**:
  - Cross-event streaks: rejected because they obscure live event momentum.
  - Incremental-only updates: rejected because score corrections can invalidate prior streak state.

## Decision 2: Winner emphasis is per recorded match result display

- **Decision**: Underline winning score values in ongoing event score displays where a match outcome is visible.
- **Rationale**: Provides immediate visual differentiation without changing ranking math or introducing new labels.
- **Alternatives considered**:
  - Emphasize player name only: rejected as less specific than highlighting winning score.
  - Use color-only emphasis: rejected due to lower accessibility reliability.

## Decision 3: Keep recent-winner logic unchanged, change icon only

- **Decision**: Keep existing qualification logic for recent winners and replace fire with crown for that specific badge.
- **Rationale**: User explicitly requested symbol swap, not logic change.
- **Alternatives considered**:
  - Rework winner badge qualification window: rejected as out of scope.

## Decision 4: Inline summary expands/collapses within ongoing event page and never navigates away

- **Decision**: Replace "Go to Summary" with "View Summary" that toggles an in-page summary panel and preserves current event context.
- **Rationale**: Solves stated operational pain where navigation can disrupt live flow.
- **Alternatives considered**:
  - Keep separate summary route and add return shortcut: rejected because it still leaves context.
  - Open modal summary: rejected as less suitable for larger standings/score content.

## Decision 5: Inline summary score edits reuse existing result validation rules

- **Decision**: Score corrections in inline summary use same validation and recalculation pathway as regular result updates.
- **Rationale**: Prevents divergent scoring behavior and minimizes logic duplication risk.
- **Alternatives considered**:
  - Separate correction-specific rule set: rejected due to consistency and maintenance risk.

## Decision 6: Conflict handling is explicit and non-destructive

- **Decision**: If a score is modified by another host/admin before save, return a conflict outcome and require refresh/retry, without silent overwrite.
- **Rationale**: Aligns with requirement to avoid silent overwrites in concurrent live operation.
- **Alternatives considered**:
  - Last-write-wins silently: rejected because it hides data loss.
  - Hard lock per match row: rejected as heavier interaction overhead.

## Decision 7: Badge coexistence and precedence

- **Decision**: Recent-winner crown can coexist with hot/cold streak markers because they represent different concepts; hot and cold are mutually exclusive for the same player at any instant.
- **Rationale**: Prevents ambiguity while preserving requested recognition signals.
- **Alternatives considered**:
  - Force single badge only: rejected because it hides useful context.
  - Allow simultaneous hot and cold: rejected as logically contradictory.

## Decision 8: Audit trail for score correction

- **Decision**: Record correction metadata (editor, timestamp, before/after score values) in existing result history/audit-friendly persistence pathway.
- **Rationale**: Supports trust and post-event review without introducing a separate manual logging workflow.
- **Alternatives considered**:
  - No correction audit: rejected due to explicit requirement.
  - Full event snapshot per edit: rejected as unnecessarily heavy for this scope.
