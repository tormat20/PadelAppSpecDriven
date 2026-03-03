# Feature Specification: Event State and Restart Iteration

**Feature Branch**: `016-event-state-restart`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Iterate event-state UX and resume reliability with explicit statuses and corrected actions. Fix Edit Event duplicate-slot warning so an event does not flag itself as a duplicate when editing unchanged name/date/time; warning should only appear for other matching events. In Preview Event, display schedule as combined date and time (example: `2026-03-10 19:00`). Introduce and consistently display four event states in Home > Event Slots and Preview access points: `planned`, `ready`, `ongoing`, and `finished`. State definitions: planned = planning fields only (name/mode/date/time) and not runnable; ready = required courts and exact players assigned per mode and runnable but not started; ongoing = started and in progress; finished = completed event. Ensure ongoing events are resumable after leaving the run view and after page reload, restoring persisted progress (current round, matches, completed results, pending matches) from backend persistence. For action gating: planned shows no run action; ready shows `Start Event`; ongoing shows `Resume Event` and additionally `Restart Event`; finished shows no start/resume action. `Restart Event` is allowed only for ongoing events, requires explicit confirmation, resets run progress (rounds/matches/results) while preserving configured setup (name/mode/date/time/courts/players), and returns event to ready state. In Preview Event add summary rows for Event Mode, Date/Time, Setup Status, Players Assigned, and Courts Assigned so organizers can quickly assess run readiness. Replace generic network errors in resume/load paths with actionable user guidance. Preserve existing create-slot, strict-create, and edit-save semantics with no regressions."

## Clarifications

### Session 2026-03-01

- Q: What should be the primary action for finished events? → A: Show `View Summary` as the primary action.
- Q: When should an event move from `ongoing` to `finished`? → A: Automatically when all required rounds/matches are completed.
- Q: After `Restart Event`, where should the organizer land? → A: Return to Preview Event in `ready` state with `Start Event` available.
- Q: What should happen to previous run results on restart? → A: Clear previous run progress/results for that event and start fresh from ready setup state.

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

### User Story 1 - Reliable Ongoing and Resume Flow (Priority: P1)

As an organizer, I can resume ongoing events reliably after leaving the run flow so active events can continue without losing progress.

**Why this priority**: Reliable continuity for live events is the core operational need and prevents loss of event control.

**Independent Test**: Start a ready event, leave run view, reload, then resume and verify current round, completed results, and pending matches are restored.

**Acceptance Scenarios**:

1. **Given** a ready event, **When** I start it, **Then** its visible state becomes `ongoing` and it is no longer treated as `ready`.
2. **Given** an ongoing event, **When** I return later from Event Slots or preview, **Then** I can resume from persisted progress.
3. **Given** an ongoing event, **When** I choose `Restart Event` and confirm, **Then** run progress resets and the event returns to `ready` while setup data remains unchanged.

---

### User Story 2 - Correct State Labels and Actions (Priority: P2)

As an organizer, I can clearly see `planned`, `ready`, `ongoing`, and `finished` states and receive correct action options for each state.

**Why this priority**: Correct labels and action gating reduce user error and keep event operation predictable.

**Independent Test**: Prepare one event in each state and verify Home and Preview show correct labels and action choices with no invalid action enabled.

**Acceptance Scenarios**:

1. **Given** events in planned, ready, ongoing, and finished states, **When** I view Event Slots, **Then** each event shows the correct state label.
2. **Given** a planned event, **When** I open preview, **Then** no run execution action is available.
3. **Given** a ready event, **When** I open preview, **Then** only `Start Event` is available.
4. **Given** an ongoing event, **When** I open preview, **Then** `Resume Event` and `Restart Event` are available.
5. **Given** a finished event, **When** I open preview, **Then** no start/resume action is available and `View Summary` is shown as the primary action.
6. **Given** an ongoing event reaches completion of all required rounds/matches, **When** completion is recorded, **Then** the event automatically transitions to `finished`.
7. **Given** an organizer confirms `Restart Event`, **When** restart completes, **Then** the organizer is returned to Preview Event in `ready` state with `Start Event` available.
8. **Given** an organizer confirms `Restart Event`, **When** restart executes, **Then** previous round/match run progress for that event is cleared before the next start.

---

### User Story 3 - Clear Preview Context and Errors (Priority: P3)

As an organizer, I can see complete setup context in Preview and receive actionable load/resume errors so I can recover quickly.

**Why this priority**: Better context and clearer errors reduce confusion, lower support burden, and improve confidence.

**Independent Test**: Open preview to verify date-time and setup rows, then trigger resume/load failure and verify actionable guidance appears instead of generic network text.

**Acceptance Scenarios**:

1. **Given** an event with date and time, **When** I view preview, **Then** schedule is shown as a combined date-time string.
2. **Given** preview is opened, **When** I inspect summary rows, **Then** I see Event Mode, Date/Time, Setup Status, Players Assigned, and Courts Assigned.
3. **Given** resume/load fails, **When** error is shown, **Then** the message explains corrective next steps and is not only `Network error`.

---

### Edge Cases

- Editing an event without changing name/date/time must not show duplicate warning for itself.
- Restart confirmation is declined: event remains ongoing and progress is preserved.
- Restart confirmation is accepted after partial progress: previous run progress/results are cleared and not reused.
- Resume is attempted for an event that became finished in another session: resume is blocked with clear guidance.
- Ongoing event has partially completed matches: resume must preserve completed and pending distinctions.
- Temporary connectivity loss during resume/load must show retry guidance and alternate navigation option.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display four event states in organizer-facing state surfaces: `planned`, `ready`, `ongoing`, and `finished`.
- **FR-002**: System MUST transition an event from ready to ongoing immediately after a successful start action.
- **FR-003**: System MUST allow resume of ongoing events after navigation away and page reload using persisted event progress.
- **FR-004**: System MUST restore current round, matches, completed results, and pending matches when resuming an ongoing event.
- **FR-005**: System MUST apply action gating by state: planned -> no run action, ready -> `Start Event`, ongoing -> `Resume Event` plus `Restart Event`, finished -> no start/resume action.
- **FR-006**: System MUST require explicit confirmation before restart proceeds.
- **FR-007**: System MUST reset run progress on confirmed restart while preserving existing setup data and return event to ready state.
- **FR-008**: System MUST prevent duplicate-slot warning from matching the event currently being edited when unchanged schedule/name is saved.
- **FR-009**: System MUST show preview schedule as combined date-time when time exists.
- **FR-010**: System MUST include preview summary rows for Event Mode, Date/Time, Setup Status, Players Assigned, and Courts Assigned.
- **FR-011**: System MUST present actionable guidance for resume/load failures and MUST NOT surface only a generic `Network error` message.
- **FR-012**: System MUST preserve existing create-slot, strict-create, and edit-save behavior without regression.
- **FR-013**: System MUST show `View Summary` as the primary action for finished events in preview/event access points.
- **FR-014**: System MUST automatically transition an event from `ongoing` to `finished` when all required rounds/matches for the event are completed.
- **FR-015**: System MUST return organizers to Preview Event after confirmed restart with the event in `ready` state and `Start Event` available.
- **FR-016**: System MUST clear prior run progress/results for the restarted event upon confirmed restart while preserving setup configuration.

### Key Entities *(include if feature involves data)*

- **Event State Classification**: Organizer-visible state label (`planned`, `ready`, `ongoing`, `finished`) derived from persisted setup and runtime lifecycle.
- **Restart Confirmation Action**: Confirmed user intent to reset run progress while retaining event setup metadata.
- **Persisted Run Progress Snapshot**: Stored in-progress context including current round and per-match completion/result status for resume.
- **Preview Readiness Summary**: Presentation model combining schedule and setup context rows used to decide start/resume readiness.

## Assumptions

- Existing event, round, match, and result persistence remains the source of truth for resume and restart behavior.
- Restart is available only for ongoing events and does not alter setup configuration.
- Finished events remain viewable in Event Slots and preview surfaces even when not startable/resumable.

## Dependencies

- Existing run lifecycle operations (start, progress, finish).
- Existing event list and preview surfaces.
- Existing duplicate warning behavior in create/edit flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful start actions change visible event state from ready to ongoing.
- **SC-002**: 100% of resumed ongoing events restore persisted in-progress state after leaving run flow and reloading.
- **SC-003**: 100% of state-action combinations match defined gating rules across Home and Preview.
- **SC-004**: Duplicate warning false positives for self-edits are reduced to 0 in regression scenarios.
- **SC-005**: At least 95% of tested resume/load failures present actionable recovery guidance instead of generic network text.
