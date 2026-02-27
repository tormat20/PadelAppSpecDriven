# Feature Specification: Summary Rank Column and Mode-Specific Ordering Rules

**Feature Branch**: `011-summary-rank-ordering`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Add explicit rank column and mode-specific summary ordering/ranking rules."

## Clarifications

### Session 2026-02-27

- Q: In Americano, how should players be ordered within each court outcome pair when assigning ranks? → A: Order alphabetically by display name within winners and within losers.
- Q: For BeatTheBox, what determines court-group priority for summary ordering? → A: Use global carry-over score progression across events.
- Q: How should progress-summary ranking be computed across modes? → A: Rank by current accumulated points/score descending for all modes.
- Q: Which Mexicano tie-ranking style should be used for displayed ranks? → A: Use competition ranking (1, 1, 3, 4...).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Final Results Show Deterministic Rank Order (Priority: P1)

As an event host, I want the final summary table to include rank and deterministic ordering rules per mode so I can announce results correctly without manual interpretation.

**Why this priority**: Final-result clarity is core to event completion and directly affects winner announcements.

**Independent Test**: Complete events for Mexicano, Americano, and BeatTheBox and verify rank column values and row order exactly match mode-specific ranking rules.

**Acceptance Scenarios**:

1. **Given** a final Mexicano summary, **When** the table is shown, **Then** rank and row order are descending by total score with highest on top.
2. **Given** a final Americano summary, **When** the table is shown, **Then** rank and row order follow final-round court-priority outcome ordering from highest court to lowest.
3. **Given** a final BeatTheBox summary, **When** the table is shown, **Then** round values show numeric points, rows are grouped by court trajectory priority (highest group first), and ranked by table order.

---

### User Story 2 - Summary Matrix Structure Is Consistent and Readable (Priority: P2)

As a host, I want a consistent summary table structure with rank first so the table is faster to scan during and after rounds.

**Why this priority**: Consistent structure reduces cognitive load and improves speed of use during live event operations.

**Independent Test**: Open progress and final summaries and verify the leftmost column is Rank, followed by Player and round/total columns.

**Acceptance Scenarios**:

1. **Given** any progress summary, **When** the matrix loads, **Then** the first column is Rank and values are deterministic.
2. **Given** any final summary, **When** the matrix loads, **Then** the first column is Rank and the column order is Rank, Player, R1..Rn, Total.

---

### User Story 3 - Existing Winner Highlighting and Event Flow Stay Intact (Priority: P3)

As a host, I want crown highlighting and existing event progression to keep working while ranking behavior changes.

**Why this priority**: Ranking enhancements must not break existing completion or winner-highlight behavior.

**Independent Test**: Run existing event flow and confirm crowns still follow current mode rules while new ranking/order rules are applied.

**Acceptance Scenarios**:

1. **Given** a final Mexicano summary with top-score ties, **When** ranking is shown, **Then** crown display still follows existing tie crown policy.
2. **Given** a final Americano summary, **When** ranking is shown, **Then** crowns still mark highest-court final-match winners.
3. **Given** existing run/start/finish flows, **When** this feature is enabled, **Then** those flows complete without regression.

---

### Edge Cases

- When final-round match data is incomplete for Americano court-priority ordering, summary remains available and applies deterministic fallback ordering without crashing.
- When totals are equal in Mexicano, ranking display uses competition ranking (1, 1, 3, 4...) and remains stable across reloads.
- When BeatTheBox players have equal totals within a court group, deterministic tie ordering remains stable.
- When events have varying court counts, Americano and BeatTheBox ordering still applies correctly from highest court group to lowest.
- When summary is progress mode and round data is partial, rank column still renders with deterministic ordering.

### Assumptions

- Mexicano tie ranks use competition ranking (1, 1, 3, 4...).
- Americano intra-pair player order uses alphabetical display-name ordering.
- BeatTheBox court trajectory grouping can be derived from existing round/match history or added payload metadata without changing scheduling logic.
- Crown logic remains unchanged from current feature behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a Rank column as the leftmost column in both progress and final summary matrices.
- **FR-002**: System MUST render summary column order as Rank, Player, round columns, then Total.
- **FR-003**: System MUST provide deterministic rank values for every summary row in every mode.
- **FR-003a**: System MUST compute progress-summary rank values by current accumulated points/score in descending order for all modes.
- **FR-004**: System MUST rank and order Mexicano final summaries by total score descending.
- **FR-005**: System MUST apply competition ranking for Mexicano tied totals (for example: 1, 1, 3, 4...).
- **FR-006**: System MUST rank and order Americano final summaries by final-round court priority outcomes: highest-court winners first, then highest-court losers, continuing court-by-court in descending court number.
- **FR-006a**: System MUST order players alphabetically by display name within each Americano winners pair and within each Americano losers pair for deterministic ranking.
- **FR-007**: System MUST keep Americano row order exactly aligned with displayed rank order.
- **FR-008**: System MUST render BeatTheBox round cells as numeric points gained per round.
- **FR-009**: System MUST compute and render BeatTheBox Total as the sum of displayed round points.
- **FR-010**: System MUST group BeatTheBox final summary rows by court-group priority derived from global carry-over score progression, ordered from highest court group to lowest.
- **FR-011**: System MUST sort players within each BeatTheBox court group by Total descending.
- **FR-012**: System MUST assign BeatTheBox rank values by final displayed row order.
- **FR-013**: System MUST expose summary payload data sufficient for deterministic frontend rank/order rendering for all modes.
- **FR-014**: System MUST preserve existing crown-display rules while applying new ranking and ordering rules.
- **FR-015**: System MUST preserve current event flow behavior (start, run, next, finish, summary) without regression.
- **FR-016**: System MUST include automated backend and frontend tests covering rank column, mode-specific ordering, and per-mode rank outcomes.

### Key Entities *(include if feature involves data)*

- **Summary Row Rank**: Displayed rank value associated with each player row in summary matrix.
- **Mode Ordering Rule**: Deterministic ruleset for row order and rank assignment by event mode (Mexicano, Americano, BeatTheBox).
- **Americano Court Outcome Group**: Ordered set derived from final-round matches where each court contributes winner and loser rank slots in descending court priority.
- **BeatTheBox Court Group Priority**: Group of players bucketed by global carry-over score progression used to segment and order final rows from highest to lowest court group.
- **Summary Payload Ordering Metadata**: API response fields needed to produce deterministic row order and rank values in frontend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested summaries, Rank appears as the leftmost matrix column and column order is consistent with specification.
- **SC-002**: In 100% of Mexicano final-summary fixtures, rows appear in descending total score order and tied totals use competition ranking (1, 1, 3, 4...).
- **SC-003**: In 100% of Americano final-summary fixtures, row order and displayed ranks match the final-round highest-to-lowest-court winner/loser sequence.
- **SC-004**: In 100% of BeatTheBox final-summary fixtures, round cells display numeric points, totals equal round-point sums, and ordering follows court-group then descending total rules.
- **SC-005**: Existing winner crown behavior and event completion flow tests remain green after ranking changes.
