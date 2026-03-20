# Feature Specification: Previous Round Correction Flow

**Feature Branch**: `035-previous-round-correction`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Allow going back to previous round in ongoing events to correct prior scores, remove separate recorded-scores edit list, keep summary table view, and adjust run-page action button layout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Go Back and Correct Previous Round Before Reassignment (Priority: P1)

As an event host, I can go back one round from an ongoing event, correct wrong scores from that previous round, and then advance again so court assignments are recalculated from corrected results.

**Why this priority**: This is the core operational need. Incorrect score entry currently forces bad reassignment and breaks trust in ongoing event management.

**Independent Test**: Complete Round N, advance to Round N+1, go back to Round N, change one score, then advance again and verify Round N+1 assignments reflect corrected ranking/ordering.

**Acceptance Scenarios**:

1. **Given** an ongoing event has advanced to Round N+1, **When** the host clicks "Previous Round", **Then** the app loads Round N match setup with editable saved scores.
2. **Given** Round N scores are corrected after going back, **When** the host clicks "Next Match", **Then** Round N+1 is rebuilt from corrected Round N outcomes.
3. **Given** Round N+1 had already been generated before the correction, **When** previous-round correction is applied, **Then** outdated Round N+1 assignments are discarded and replaced by corrected assignments.

---

### User Story 2 - Keep Summary View Clean and Table-Centric (Priority: P2)

As an event host, I can use the inline summary table without a separate "Recorded Scores" list under it, so the screen stays focused and less cluttered.

**Why this priority**: The host confirmed current summary table is correct and wants to remove duplicate score-edit UI that is confusing.

**Independent Test**: Open View Summary during an ongoing event and verify no separate "Recorded Scores" section appears beneath the table.

**Acceptance Scenarios**:

1. **Given** inline summary is opened, **When** the panel renders, **Then** only the main summary table and related controls are shown, without the separate recorded-scores list.
2. **Given** score correction capability remains available through previous-round flow, **When** host needs correction, **Then** host uses Previous Round and not a secondary score list under summary.

---

### User Story 3 - Reorder Ongoing Event Action Buttons for Clear Back/Forward Flow (Priority: P3)

As an event host, I see primary run controls arranged as left-to-right navigation (Previous Round on the left, Next Match on the right), with View Summary and Finish Event grouped below in the same action section.

**Why this priority**: Better action placement reduces mistakes during live operations and matches host mental model of back/forward navigation.

**Independent Test**: Open run page during ongoing event and verify top action row order is Previous Round (left) and Next Match (right), with View Summary and Finish Event directly below in the same panel.

**Acceptance Scenarios**:

1. **Given** ongoing event run page is visible, **When** host views top action row, **Then** left button is "Previous Round" and right button is "Next Match".
2. **Given** the same action section, **When** host looks below top row, **Then** both "View Summary" and "Finish Event" are present in a second row within the same panel.
3. **Given** event is not at final round, **When** host sees Finish Event action, **Then** it is clearly disabled or unavailable until finish conditions are met.

### Edge Cases

- If host is already on Round 1, "Previous Round" must be unavailable.
- If a host goes back and opens corrections but makes no changes, advancing forward should preserve consistent assignments (no unintended reshuffle).
- If multiple rounds were already generated, correcting an older round must invalidate downstream generated rounds and rebuild from the correction point.
- If correction input is invalid, no reassignment should occur and current saved data must remain unchanged.
- If two admins attempt conflicting corrections concurrently, system must reject stale updates and require refresh/retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Previous Round" action in ongoing events when current round number is greater than 1.
- **FR-002**: The "Previous Round" action MUST load the immediately prior round state and its saved results for correction.
- **FR-003**: The system MUST allow editing saved scores in the previous round context using existing validation rules per event mode.
- **FR-004**: After a previous-round correction is saved, the system MUST recompute rankings/order inputs and regenerate the next round from corrected data.
- **FR-005**: If a later round was already generated before correction, the system MUST replace that round with a regenerated version based on corrected inputs.
- **FR-006**: The system MUST preserve auditability of corrections, including what changed and when.
- **FR-007**: The inline summary panel MUST remove the separate "Recorded Scores" list beneath the main table.
- **FR-008**: The run-page primary action row MUST show "Previous Round" on the left and "Next Match" on the right.
- **FR-009**: The run-page secondary action row (same panel section) MUST include both "View Summary" and "Finish Event".
- **FR-010**: "Finish Event" availability MUST continue to respect existing round-completion rules.
- **FR-011**: The system MUST prevent previous-round navigation when no previous round exists.
- **FR-012**: The system MUST return clear user-facing feedback when a correction cannot be applied (validation or concurrency conflict).

### Assumptions

- Previous-round correction is intended for authorized host/admin users only, matching existing result-edit permission boundaries.
- Back navigation is limited to one round step at a time (from Round N to Round N-1).
- Existing scoring models and tie-breaking behavior remain unchanged; only correction flow and navigation behavior are added.

### Dependencies

- Existing ongoing-event round generation and result submission pipeline.
- Existing summary table rendering in run-event inline summary.
- Existing permission and conflict-handling behavior for score updates.

### Key Entities *(include if feature involves data)*

- **Round Navigation State**: Current round pointer and availability rules for moving backward/forward in an ongoing event.
- **Round Result Snapshot**: Persisted score outcomes for a specific round used as source-of-truth for reassignment.
- **Correction Rebuild Window**: The range of generated rounds invalidated and regenerated after a prior-round score correction.
- **Run Action Layout Model**: Structured placement of navigation controls (previous/next) and utility controls (summary/finish) in the run-event action section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In live-host validation, at least 95% of score-entry mistakes discovered after advancing can be corrected by going back one round and re-advancing without restarting the event.
- **SC-002**: In controlled correction tests, 100% of corrected prior-round submissions produce regenerated next-round assignments consistent with corrected results.
- **SC-003**: In UX validation, at least 90% of hosts identify the back/forward navigation controls correctly on first use.
- **SC-004**: In run-event summary usage checks, 100% of ongoing-event summary panels render without the separate recorded-scores section.
