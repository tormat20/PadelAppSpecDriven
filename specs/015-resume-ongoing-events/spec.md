# Feature Specification: Resumable Ongoing Events and Run-State UX

**Feature Branch**: `015-resume-ongoing-events`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Improve event run-state UX with resumable ongoing events. In Home > Event Slots (all events), add a third status label: `ongoing`, alongside `planned` and `ready`. When an event is started, its status must immediately change to `ongoing` (not remain `ready`). If a user leaves the run page and returns to main menu, ongoing events must be resumable from Event Slots and from Resume Event flow. For ongoing events, replace `Start Event` with `Resume Event` in Preview/Event access points, while keeping `Start Event` only for ready events and unavailable for planned events. Persist and restore ongoing event progress without relying on browser-only session state: event status, current round, created matches, completed match results, and pending matches must remain recoverable after navigation and page reload. Improve failure handling so resume/load paths show clear actionable errors instead of generic `Network error`. In Preview Event, display schedule as date plus time in one line (example: `2026-03-10 19:00`). Preserve existing create-slot, strict-create, and edit-save behavior with no regressions."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Resume Ongoing Events (Priority: P1)

As an organizer, I can resume an event that is already in progress after leaving the run screen so I do not lose operational continuity.

**Why this priority**: Event resumption is critical for live operations; without it, active event management can be interrupted and unreliable.

**Independent Test**: Start an event, leave to the main menu, return to that event, and confirm progress is restored with a `Resume Event` action.

**Acceptance Scenarios**:

1. **Given** an event has been started, **When** start processing completes, **Then** the event status is `ongoing` immediately.
2. **Given** an event is `ongoing`, **When** I open its preview/access point, **Then** I am shown `Resume Event` instead of `Start Event`.
3. **Given** an event is `ongoing`, **When** I resume it, **Then** I return to the in-progress state with current round, played matches, and pending matches restored.

---

### User Story 2 - Clear Run-State Signals (Priority: P2)

As an organizer, I can clearly distinguish `planned`, `ready`, and `ongoing` events in Event Slots and preview screens so I know the correct next action.

**Why this priority**: Clear state labeling prevents action mistakes and improves speed of operation during active sessions.

**Independent Test**: Create representative events in each status and verify labels and action buttons match expected state-specific behavior.

**Acceptance Scenarios**:

1. **Given** events in `planned`, `ready`, and `ongoing` states, **When** I view Event Slots, **Then** all three labels are displayed correctly.
2. **Given** an event is `ready`, **When** I open preview, **Then** I see `Start Event`.
3. **Given** an event is `planned`, **When** I open preview, **Then** start/resume execution action is unavailable.
4. **Given** an event is `ongoing`, **When** I open preview, **Then** I see `Resume Event`.

---

### User Story 3 - Better Preview and Error Feedback (Priority: P3)

As an organizer, I can see complete schedule details and receive actionable resume/load errors so I can recover quickly from interruptions.

**Why this priority**: Better context and clearer errors reduce confusion and support burden without altering core event logic.

**Independent Test**: Verify preview shows date and time together and that resume/load failures show clear corrective guidance instead of generic network errors.

**Acceptance Scenarios**:

1. **Given** an event has date and time configured, **When** I view preview, **Then** schedule appears in combined format (for example `2026-03-10 19:00`).
2. **Given** a resume/load failure occurs, **When** the UI handles the error, **Then** I see an actionable message describing how to recover.

---

### Edge Cases

- Organizer attempts to resume an event that has already been finished; system must block resume and explain the event is no longer ongoing.
- Organizer opens an ongoing event with partially completed round results; resume must preserve completed and pending match separation correctly.
- Two organizers open the same ongoing event around the same time; resumed view must reflect latest saved progress.
- Temporary connectivity issue occurs during resume/load; user must see actionable recovery guidance rather than an unqualified network failure.
- Event has no configured time but has a date; preview must still present schedule consistently without breaking layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three visible event run-state labels: `planned`, `ready`, and `ongoing`.
- **FR-002**: System MUST set event status to `ongoing` immediately after a successful start action.
- **FR-003**: System MUST preserve `ongoing` progress data across navigation and page reload without relying on browser-only transient state.
- **FR-004**: System MUST restore ongoing event context on resume, including current round, created matches, completed results, and pending matches.
- **FR-005**: System MUST provide `Resume Event` action for ongoing events in preview and event access points.
- **FR-006**: System MUST provide `Start Event` action only for ready events.
- **FR-007**: System MUST keep start/resume execution action unavailable for planned events.
- **FR-008**: System MUST show `planned`, `ready`, and `ongoing` status labels in Home > Event Slots.
- **FR-009**: System MUST display schedule in preview as date and time on one line when time is available.
- **FR-010**: System MUST show actionable resume/load failure feedback and MUST NOT surface only a generic `Network error` message.
- **FR-011**: System MUST preserve existing create-slot, strict-create, and edit-save behavior with no regressions.
- **FR-012**: System MUST keep event status and execution actions synchronized so UI actions always match the latest persisted run-state.

### Key Entities *(include if feature involves data)*

- **Event Run-State**: Current execution state of an event (`planned`, `ready`, `ongoing`) used for action gating and list visibility.
- **Ongoing Session Snapshot**: Persisted in-progress event context containing current round, created matches, completed match results, and pending matches.
- **Run Action Availability**: State-derived action model that determines whether `Start Event` or `Resume Event` is shown.
- **Preview Schedule View**: Combined date-time display representation used in event preview.

## Assumptions

- Existing persistence for event, round, and match data is the source of truth for resumable progress.
- Resume behavior targets organizer workflows already authorized to start/run events.
- Existing create/edit validation behavior from prior features remains unchanged unless explicitly required by this feature.

## Dependencies

- Existing event start/run lifecycle flow and run page navigation.
- Existing event, round, match, and result persistence model.
- Existing Home Event Slots and Preview Event UI surfaces.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully started events transition to `ongoing` state immediately.
- **SC-002**: 100% of resumed ongoing events restore persisted round and match progress after navigation away and reload.
- **SC-003**: 100% of preview/action points show `Start Event` only for ready events and `Resume Event` for ongoing events.
- **SC-004**: At least 95% of organizers can identify correct next action for an event state within 5 seconds in usability checks.
- **SC-005**: Resume/load failure feedback includes actionable guidance in 100% of error cases tested.
