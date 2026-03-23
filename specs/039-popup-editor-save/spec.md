# Feature Specification: Calendar Popup Editor with Immediate Save

**Feature Branch**: `[039-popup-editor-save]`  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: User description: "Create a NEW follow-up spec that supersedes the current calendar edit drawer behavior in `038-calendar-staged-save`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a Real Popup Editor from Calendar (Priority: P1)

As an admin scheduler, I can click an event name in the calendar and open a centered popup editor above the calendar so editing feels clear and intentional.

**Why this priority**: This is the core UX change and unblocks the main event-edit workflow.

**Independent Test**: Click event-name text in weekly calendar, verify centered modal opens with title, close button, action footer, and proper close behavior.

**Acceptance Scenarios**:

1. **Given** weekly calendar is visible, **When** user clicks `.calendar-event-block__name`, **Then** a centered modal popup opens over the calendar.
2. **Given** popup is open, **When** user views the header, **Then** title and close `X` are visible.
3. **Given** popup is open, **When** user presses Escape, close `X`, or Cancel, **Then** popup closes and user remains on the same calendar context.
4. **Given** popup is open, **When** user navigates with keyboard, **Then** dialog focus behavior is accessible and predictable.

---

### User Story 2 - Use Create-Style Editing UI in Popup (Priority: P1)

As an admin scheduler, I can edit events in a create-event style form flow so the interaction is consistent and easy to understand.

**Why this priority**: Reusing known interaction patterns reduces friction and errors.

**Independent Test**: Open popup and verify create-style sections are present (mode, date/time, duration, name, courts/players progression) and context-appropriate actions are shown.

**Acceptance Scenarios**:

1. **Given** popup editor is open, **When** user views body layout, **Then** it follows the same design language as create-event panel/form-grid.
2. **Given** popup editor is open, **When** user views footer actions, **Then** edit-relevant actions are present and create-page-only navigation actions are absent.
3. **Given** popup editor is open, **When** user updates mode, schedule, duration, name, and setup fields, **Then** the flow supports full event editing without route redirect.
4. **Given** popup editor is open, **When** user chooses delete, **Then** delete is available from the popup flow.

---

### User Story 3 - Save Immediately from Popup (Priority: P1)

As an admin scheduler, when I save edits from popup, changes persist immediately so setup work (especially courts/players) is not lost.

**Why this priority**: Immediate persistence is required to prevent accidental redo/revert of high-effort edits.

**Independent Test**: Edit event in popup, save, refresh event data, verify changes are persisted instantly and not reverted by Redo Changes.

**Acceptance Scenarios**:

1. **Given** popup edits are ready, **When** user clicks Save, **Then** event updates are persisted immediately.
2. **Given** popup save succeeds, **When** calendar refreshes, **Then** updated values are visible in event views.
3. **Given** popup save includes courts/players edits, **When** save completes, **Then** courts/players changes are persisted in backend state.
4. **Given** popup save fails, **When** response returns, **Then** user receives clear retry guidance and no silent loss occurs.

---

### User Story 4 - Hybrid State Reconciliation (Priority: P2)

As an admin scheduler, I can use both staged quick edits and popup immediate-save edits without data conflicts.

**Why this priority**: This prevents stale staged data from overwriting newly persisted popup changes.

**Independent Test**: Stage quick edits, save popup edits on same event, then run Save Changes/Redo Changes and verify reconciliation behavior.

**Acceptance Scenarios**:

1. **Given** an event has unsaved staged changes, **When** popup save persists that event, **Then** staged data for that event is reconciled to persisted values.
2. **Given** other events still have staged changes, **When** popup save persists one event, **Then** unrelated staged changes remain intact.
3. **Given** popup save has persisted event changes, **When** user clicks Redo Changes, **Then** persisted popup changes are not reverted.
4. **Given** reconciliation has occurred, **When** user later clicks Save Changes for remaining staged edits, **Then** stale values are not re-applied.

---

### Edge Cases

- Popup save is triggered for an event that also has pending staged drag/resize changes.
- Popup delete is triggered while staged changes exist for that event.
- Popup is opened from day-court view rather than weekly view.
- Save fails due to version conflict from another organizer.
- User closes popup with unsaved popup edits after changing multiple sections.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the current calendar edit drawer interaction with a centered popup modal overlay.
- **FR-002**: System MUST open the popup editor when the calendar event name text is clicked.
- **FR-003**: Popup modal MUST include title, close `X`, body content area, and footer action area.
- **FR-004**: Popup body MUST follow create-event style form language and progression.
- **FR-005**: Popup editor MUST provide delete, close/cancel, and save actions relevant to edit context.
- **FR-006**: Popup save MUST persist event changes immediately (not staged-only).
- **FR-007**: Immediate popup save MUST persist courts/players edits.
- **FR-008**: Calendar MUST support coexistence of staged quick edits and popup immediate-save edits.
- **FR-009**: When popup immediate save affects an event with staged changes, staged data for that event MUST be reconciled to persisted state.
- **FR-010**: Redo Changes MUST NOT undo changes already persisted by popup save.
- **FR-011**: Unrelated staged changes MUST remain staged after popup save of a different event.
- **FR-012**: Popup close and keyboard interactions MUST satisfy accessible dialog expectations.
- **FR-013**: Existing admin guards, route/menu behavior, and calendar navigation context MUST remain unchanged.

### Key Entities *(include if feature involves data)*

- **Popup Edit Session**: Active modal editing state for one selected event.
- **Immediate Save Snapshot**: Persisted event state returned by popup save.
- **Staged Calendar Change Set**: Pending quick edits not yet persisted.
- **Reconciled Event State**: Resolved state after immediate popup save merges with staged calendar context.

## Assumptions

- Drag/resize quick edits remain staged unless explicitly changed by this feature.
- Popup save uses existing event permission model.
- Calendar remains the primary browsing surface; popup is in-context overlay.
- Redo Changes behavior continues to target unsaved staged edits only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of event-name clicks open the centered popup editor.
- **SC-002**: In acceptance testing, 100% of popup save actions persist event updates immediately.
- **SC-003**: In mixed-edit scenarios, 100% of popup-persisted changes remain intact after Redo Changes.
- **SC-004**: In reconciliation scenarios, 100% of unrelated staged events remain staged after popup save on another event.
- **SC-005**: In usability validation, at least 90% of admins complete popup edit-and-save flow within 45 seconds.
- **SC-006**: In accessibility validation, popup close/focus/keyboard behaviors pass all defined dialog interaction checks.
