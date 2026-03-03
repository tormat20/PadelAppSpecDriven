# Feature Specification: Planned Event Slots with Deferred Setup Validation

**Feature Branch**: `013-planned-event-slots`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Add planned event slots with deferred setup validation"

## Clarifications

### Session 2026-03-01

- Q: What exact rule should determine when a planned event becomes ready? → A: Ready only when full mode rules are satisfied, including required courts and exact player-count rules for that mode.
- Q: Should planned slots be allowed for past date/time values? → A: Allowed, but the system shows a warning.
- Q: How should duplicate planned slots (same name + date + time) be handled? → A: Allow duplicates, but show a duplicate warning and clear disambiguation in event list and detail views.
- Q: What should happen if organizer changes event mode after players/courts are already set? → A: Allow mode change, immediately re-validate setup, and revert status to planned if new mode rules are not met.
- Q: If two organizers edit the same planned event at the same time, which save rule should apply? → A: Detect version conflict, block overwrite, and require refresh/retry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Planned Event Slot (Priority: P1)

As an event organizer, I can create an event slot in advance using only event name, mode, date, and start time so I can reserve and communicate a schedule before attendance is known.

**Why this priority**: Planning ahead is the main business value and removes the current blocker that requires full player setup at creation time.

**Independent Test**: Can be fully tested by creating a new event with only planning fields and confirming it is saved and visible without players or court assignments.

**Acceptance Scenarios**:

1. **Given** I am creating a new event, **When** I enter event name, mode, date, and start time and save, **Then** the system creates the event as a planned slot without requiring player count, player list, or court count.
2. **Given** I attempt to create a planned slot with missing required planning fields, **When** I save, **Then** the system blocks save and clearly indicates which planning fields are missing.

---

### User Story 2 - Distinguish Planned vs Ready Events (Priority: P2)

As an event organizer, I can view planned slots separately from fully configured events so I can quickly see which events still need setup.

**Why this priority**: Once slot creation exists, organizers need immediate visibility into setup progress to avoid confusion and missed preparation.

**Independent Test**: Can be tested by creating both planned and fully configured events, then verifying list and detail views show their status clearly and consistently.

**Acceptance Scenarios**:

1. **Given** planned and fully configured events exist, **When** I open the event overview, **Then** each event shows a clear setup status that differentiates planned slots from ready events.
2. **Given** I open a planned slot, **When** I view event details, **Then** I see which setup items are still pending before the event is ready to run.

---

### User Story 3 - Complete Setup Later (Priority: P3)

As an event organizer, I can return to a planned slot later, add courts and players, and then run the event once setup requirements are met.

**Why this priority**: Deferred setup is only useful if organizers can finish preparation in steps and safely transition from planning to execution.

**Independent Test**: Can be tested by creating a planned slot, adding missing setup data in a later session, and confirming run actions remain disabled until all required setup is complete.

**Acceptance Scenarios**:

1. **Given** an event is in planned status, **When** I add required setup data over time, **Then** the event remains planned until all readiness requirements are satisfied.
2. **Given** an event is still missing required setup data, **When** I attempt to start or run it, **Then** the system blocks the action and shows what remains incomplete.
3. **Given** all mode-specific setup requirements are completed, **When** I view the event, **Then** the event is marked ready and can proceed to normal run flow.

### Edge Cases

- Organizer creates or edits a slot to a past date/time; system allows it but must display a clear warning.
- Organizer edits event mode after players/courts are already configured; system re-validates immediately and reverts status to planned if the updated setup no longer meets mode rules.
- Organizer deletes all players or reduces courts after previously reaching ready status; status must revert from ready to planned if requirements become incomplete.
- Two planned slots use identical name/date/time; system allows both, shows a duplicate warning, and keeps entries clearly distinguishable.
- Organizer opens an old planned slot with no updates for a long time; status and pending setup indicators must remain accurate.
- Two organizers save conflicting edits to the same planned slot concurrently; system must detect conflict and prevent silent overwrite.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow creation of an event in planned status with only event name, event mode, date, and start time.
- **FR-002**: System MUST NOT require courts, players, or participant count at planned-slot creation time.
- **FR-003**: System MUST validate required planning fields at creation time and block save when any required planning field is missing.
- **FR-011**: System MUST allow planned slots with past date/time values but display a clear warning during creation and editing.
- **FR-012**: System MUST allow multiple planned events with identical name/date/time but provide duplicate warning feedback and clear disambiguation in overview and detail surfaces.
- **FR-013**: System MUST allow event mode changes after setup data exists, immediately re-validate readiness against the new mode, and revert status to planned when constraints are no longer satisfied.
- **FR-014**: System MUST detect concurrent update conflicts, reject stale saves, and require organizers to refresh/retry before reapplying edits.
- **FR-004**: System MUST persist planned events so they appear in event overviews and remain available across sessions.
- **FR-005**: System MUST expose and display a setup status for each event indicating whether it is planned (incomplete) or ready (complete).
- **FR-006**: System MUST allow organizers to add or modify setup details for a planned event after creation.
- **FR-007**: System MUST evaluate readiness using the existing mode-specific setup rules and only mark an event ready when required courts and exact player-count rules for that mode are fully satisfied.
- **FR-008**: System MUST block event run/start actions while an event is still planned and provide a clear list of missing setup requirements.
- **FR-009**: System MUST re-evaluate status whenever setup data changes and revert ready events back to planned if required setup becomes incomplete.
- **FR-010**: System MUST preserve existing behavior for events created with complete setup data so current workflows continue unchanged.

### Key Entities *(include if feature involves data)*

- **Planned Event Slot**: A scheduled event record defined by name, mode, date, and start time that may initially have incomplete setup.
- **Setup Readiness State**: A status indicator and related unmet-requirements list that communicates whether an event is planned or ready.
- **Event Setup Data**: Courts, participants, and other setup attributes that can be added incrementally and determine readiness.

## Assumptions

- This feature scope focuses on creating and managing planned slots and deferred setup validation only.
- Calendar grid views, drag-and-drop scheduling, and image-based player import are separate follow-up features.
- Existing user roles and permissions remain unchanged.

## Dependencies

- Existing event overview and event detail surfaces where planned status and pending setup indicators will be shown.
- Existing event run flow that enforces readiness before match generation or progression.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of organizers can create a planned event slot in under 30 seconds using only planning fields.
- **SC-002**: 100% of planned events appear in event overview screens immediately after creation and remain visible after reload.
- **SC-003**: 100% of run/start attempts for incomplete events are blocked with clear missing-setup guidance.
- **SC-004**: At least 90% of organizers can identify whether an event is planned or ready within 5 seconds of viewing the event overview.
