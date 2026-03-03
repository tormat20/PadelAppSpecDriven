# Feature Specification: Dual Event Creation Flows and Editable Preview

**Feature Branch**: `014-dual-event-creation`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Improve event creation and slot management UX with dual creation flows and editable preview. On Home under Padel Host App > Event Slots, keep showing all events (planned and ready), but center the status indicator (planned/ready) in a fixed, aligned status column so it is visually consistent regardless of event name length. In Create Event, restore the original strict create validation for normal event creation: the Create Event action must only be enabled when selected courts and assigned players satisfy the existing rules (exact required players based on courts and mode constraints). Add a second action button labeled 'Create Event Slot' that allows creating an empty/planned event using only planning fields (name, mode, date, time), without requiring players or courts. Keep existing warning behavior for past date/time and duplicate slots as non-blocking. In Preview Event, add an 'Edit Event' flow so organizers can modify players, courts, mode, date/time, and setup data after creation; re-evaluate readiness immediately after edits and update status accordingly. Start Event must be available only when setup is ready, and ready events created with full setup must continue to start without regression."

## Clarifications

### Session 2026-03-01

- Q: Should `Create Event Slot` always ignore courts/players and save planned-only? → A: Yes. It always creates a planned slot from planning fields only.
- Q: Where should `Edit Event` from Preview take the organizer? → A: Navigate to the existing Create Event page in edit mode with prefilled values.
- Q: In edit mode (opened from Preview), which primary save action should be shown? → A: Show only `Save Changes`; it saves setup edits and recalculates planned/ready status.
- Q: In edit mode, should `Save Changes` allow partial/incomplete setup? → A: Yes. It allows incomplete saves and keeps status planned until requirements are met.

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

### User Story 1 - Dual Create Actions (Priority: P1)

As an organizer, I can choose between strict `Create Event` and flexible `Create Event Slot` so I can either launch a fully configured event or save a planning placeholder.

**Why this priority**: Event creation is the primary workflow; restoring strict create behavior while preserving slot creation prevents accidental incomplete live events.

**Independent Test**: Can be fully tested by opening Create Event and verifying both buttons enforce different rules and create the expected setup status.

**Acceptance Scenarios**:

1. **Given** I have not met courts/player rules, **When** I use `Create Event`, **Then** the action stays disabled until exact mode-specific setup rules are satisfied.
2. **Given** planning fields are valid, **When** I use `Create Event Slot`, **Then** the event is saved as planned from planning fields only and does not use courts/players from the current form state.
3. **Given** I meet full setup requirements, **When** I use `Create Event`, **Then** the event is created as ready and remains startable without additional setup.

---

### User Story 2 - Edit from Preview (Priority: P2)

As an organizer, I can edit event setup from Preview Event so I can correct or complete courts, players, mode, and schedule before starting.

**Why this priority**: Planned slots are only useful if organizers can finalize setup later from the same flow where start eligibility is checked.

**Independent Test**: Can be tested by creating a planned event, editing setup from preview, and verifying readiness transitions and start button behavior update correctly.

**Acceptance Scenarios**:

1. **Given** I open Preview Event, **When** I select `Edit Event`, **Then** I am taken to the existing Create Event page in edit mode with prefilled values and can modify courts, players, mode, and schedule before saving.
2. **Given** saved edits leave setup incomplete, **When** I return to Preview Event, **Then** status remains planned and Start Event is unavailable.
3. **Given** saved edits satisfy setup rules, **When** I return to Preview Event, **Then** status is ready and Start Event is available.
4. **Given** I am in edit mode, **When** I look at the primary save control, **Then** I see only `Save Changes`.

---

### User Story 3 - Event Slots Layout Consistency (Priority: P3)

As an organizer, I can scan Event Slots quickly because the planned/ready status appears centered in a fixed aligned column independent of event name length.

**Why this priority**: Visual consistency reduces scanning errors and improves usability of mixed planned/ready lists.

**Independent Test**: Can be tested by creating events with short and long names and confirming status chips remain centered in the same list column.

**Acceptance Scenarios**:

1. **Given** multiple events with varying name lengths, **When** I view Event Slots, **Then** planned/ready status indicators are centered and aligned in a consistent column.
2. **Given** both planned and ready events are displayed, **When** I review the list, **Then** status is visually clear without row misalignment.

---

### Edge Cases

- Organizer enters valid planning fields but no courts/players: `Create Event` stays disabled while `Create Event Slot` remains available.
- Organizer edits an originally ready event and removes players/courts below required thresholds: event reverts to planned and Start Event becomes unavailable.
- Organizer saves edits with incomplete setup: save succeeds and event remains planned.
- Organizer changes mode during edit causing a new player-count rule: readiness is recalculated using the new mode and displayed immediately.
- Event list contains very long and very short names: status alignment must remain fixed and centered.
- Past date/time and duplicate-slot warnings appear during create or edit: warnings inform users but do not block save.
- Organizer reopens a ready event and makes no setup changes: readiness and start behavior remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two create actions in Create Event: `Create Event` and `Create Event Slot`.
- **FR-002**: System MUST enforce strict setup validation for `Create Event` so it is enabled only when selected courts and assigned players satisfy existing mode-specific rules.
- **FR-003**: System MUST allow `Create Event Slot` when planning fields (name, mode, date, time) are valid, and MUST always create a planned event from those planning fields only without using current courts/player selections.
- **FR-004**: System MUST label the flexible action exactly as `Create Event Slot`.
- **FR-005**: System MUST continue to show past date/time and duplicate-slot warnings as non-blocking for both create and edit flows.
- **FR-006**: System MUST keep displaying both planned and ready events in Home > Event Slots.
- **FR-007**: System MUST render setup status in a fixed aligned and centered status column in Event Slots, independent of event name length.
- **FR-008**: System MUST provide an `Edit Event` action from Preview Event.
- **FR-014**: System MUST route `Edit Event` to the existing Create Event surface in edit mode with the selected event prefilled.
- **FR-015**: System MUST show `Save Changes` as the only primary save action in edit mode.
- **FR-009**: System MUST allow editing of courts, players, mode, date, and time from the edit flow.
- **FR-016**: System MUST allow `Save Changes` for incomplete setup in edit mode and set or keep status as planned until readiness rules are fully satisfied.
- **FR-010**: System MUST re-evaluate readiness immediately after event edits and update status accordingly.
- **FR-011**: System MUST allow Start Event only when setup status is ready.
- **FR-012**: System MUST preserve start behavior for fully configured ready events without introducing regressions.
- **FR-013**: System MUST preserve existing mode-specific readiness rules (including exact required players based on selected courts and mode constraints).

### Key Entities *(include if feature involves data)*

- **Create Action Type**: Organizer-selected action (`Create Event` or `Create Event Slot`) that determines validation strictness at creation.
- **Event Setup Status**: Event readiness state (`planned` or `ready`) used for list display and Start Event availability.
- **Event Slot List Row**: Event list view record containing event identity and a centered aligned status indicator.
- **Editable Event Setup**: Mutable event setup data (mode, schedule, courts, players) modified through Preview Event edit flow.

## Assumptions

- Existing event readiness rules and mode constraints remain the authoritative source for strict validation.
- Existing planned-slot warning rules (past date/time and duplicate slots) are already accepted behavior and remain unchanged.
- All organizers with access to Preview Event can use Edit Event; no role model changes are required in this feature.

## Dependencies

- Existing create-event validation logic and readiness evaluation behavior.
- Existing Home Event Slots rendering surface.
- Existing Preview Event flow and start gating behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempted `Create Event` submissions with incomplete setup remain blocked until strict rules are satisfied.
- **SC-002**: 100% of attempted `Create Event Slot` submissions with valid planning fields succeed without courts or players.
- **SC-003**: 100% of edited events re-calculate status after save, and Start Event availability matches resulting status.
- **SC-004**: In usability checks with mixed event-name lengths, at least 95% of participants identify planned vs ready status correctly within 5 seconds.
- **SC-005**: 0 regressions in start behavior for events created with complete setup under existing workflows.
