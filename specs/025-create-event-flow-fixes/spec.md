# Feature Specification: Create Event Flow Fixes & UX Improvements

**Feature Branch**: `025-create-event-flow-fixes`  
**Created**: 2026-03-07  
**Status**: Draft  
**Input**: User description covering three bug fixes (Event Already Started error on valid ready events, player UUIDs shown in Assign Teams step, Failed to fetch red-herring), plus five UX improvements (Team Mexicano auto-suffix in event name, auto-name updates in edit mode, Create Event Slot button on Setup step, step navigation guardrails, global toast notification system).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Starting a Ready Event Never Throws "Already Started" (Priority: P1)

A session organiser opens the Create Event stepper for an event that is in "ready" state (status `Lobby` in the DB, players assigned, no round started). When they click "Start Event", the event starts cleanly and the running event view opens in a new window. Under no circumstances does the organiser see an "Event already started" error on an event they have not started.

**Why this priority**: Completely blocks event start for several real events currently in the database. The organiser has no workaround other than deleting the event.

**Independent Test**: Apply the DB migration to the four corrupt events, then attempt to start each one via the stepper — each must either start cleanly or navigate to the existing running view with no error.

**Acceptance Scenarios**:

1. **Given** an event with `status='Lobby'` and no existing round, **When** "Start Event" is clicked, **Then** the event starts, status becomes `Running`, and the running view opens in a new window.
2. **Given** an event with `status='Lobby'` but an existing round (corrupt state), **When** "Start Event" is clicked, **Then** the backend detects the orphaned round, updates `status` to `Running`, and returns the existing round data — no error is thrown.
3. **Given** the frontend detects `lifecycleStatus === "ongoing"` before calling `startEvent()`, **When** "Start Event" is clicked, **Then** it skips the API call and opens the running event view directly.
4. **Given** the DB migration `010_fix_corrupt_event_status.sql` is applied, **When** querying events, **Then** all four previously-corrupt events now have `status='Running'`.

---

### User Story 2 — Assign Teams Step Shows Player Display Names (Priority: P1)

When a user navigates to the Assign Teams step in a Team Mexicano event, every player card shows a human-readable display name (e.g. "Alice Johansson") — never a raw UUID string. This applies both in fresh creation flows and when returning to edit a saved draft.

**Why this priority**: Showing raw UUIDs makes the Assign Teams step completely unusable. Users cannot identify who is who.

**Independent Test**: Clear localStorage, create a Team Mexicano event in the stepper, add players from the catalog, navigate forward to Assign Teams — all player cards must display names.  
Then simulate stale draft data (localStorage entry with only `id`, no `displayName`) and reload — stale entries must be stripped, not displayed as UUIDs.

**Acceptance Scenarios**:

1. **Given** a fresh draft with players added from the catalog, **When** the Assign Teams step loads, **Then** every player shows their `displayName` from the catalog.
2. **Given** localStorage contains a stale draft entry with `{ id: "uuid-..." }` (no `displayName`), **When** the stepper mounts, **Then** that entry is removed from the draft and never displayed.
3. **Given** edit mode loads an existing event, **When** the player list is initialized, **Then** the catalog lookup is always used to populate `displayName`, overriding any cached value.

---

### User Story 3 — Team Mexicano Auto-Suffix in Event Name (Priority: P2)

When creating a Mexicano event, toggling on "Team Mexicano" automatically appends ` (Teams)` to the event name if the name contains "Mexicano" and doesn't already end with ` (Teams)`. Toggling it off removes the suffix. The organiser can override the name manually at any time, and manual edits are never overwritten by the auto-suffix logic.

**Why this priority**: Every Team Mexicano event created so far has needed the suffix added manually — this is a minor but consistent friction point.

**Independent Test**: In the stepper, set event name to "Saturday Mexicano - 20:00", enable Team Mexicano toggle — name becomes "Saturday Mexicano - 20:00 (Teams)". Disable toggle — suffix is removed. Then manually type a name, toggle on/off — name is not changed.

**Acceptance Scenarios**:

1. **Given** name is "Saturday Mexicano - 20:00" and Team Mexicano is toggled ON, **When** the toggle fires, **Then** name updates to "Saturday Mexicano - 20:00 (Teams)".
2. **Given** name is "Saturday Mexicano - 20:00 (Teams)" and Team Mexicano is toggled OFF, **When** the toggle fires, **Then** name updates to "Saturday Mexicano - 20:00".
3. **Given** the name already ends with ` (Teams)` and Team Mexicano is toggled ON again, **When** the toggle fires, **Then** the name is unchanged (no double-suffix).
4. **Given** the organiser has manually typed in the name field, **When** the Team Mexicano toggle is changed, **Then** the name is NOT modified.
5. **Given** the event type is not Mexicano, **When** the Team Mexicano toggle is irrelevant, **Then** no auto-suffix logic runs.

---

### User Story 4 — Auto-Name Updates in Edit Mode (Priority: P2)

When editing an existing event whose status is "planned" or "ready" (not yet ongoing/finished), the event name auto-updates when date, time, or mode changes — just as it does for new events. The current guard `if (isEditMode) return` is removed. If the organiser has manually edited the name, auto-updates do not overwrite the manual value.

**Why this priority**: Editing an event's time or mode currently leaves the name stale, requiring a manual name correction every time.

**Independent Test**: Edit a planned event, change the time from 20:00 to 21:00 — confirm the name updates from "Saturday Mexicano - 20:00" to "Saturday Mexicano - 21:00".  
Then manually type a custom name, change the time again — confirm the custom name is not touched.

**Acceptance Scenarios**:

1. **Given** editing a "planned" event with an auto-generated name, **When** the organiser changes the event time, **Then** the name updates to reflect the new time.
2. **Given** editing a "ready" event, **When** the organiser changes the event mode, **Then** the name updates to reflect the new mode.
3. **Given** editing an "ongoing" or "finished" event, **When** the organiser changes date/time/mode, **Then** the name is NOT auto-updated (event has already started).
4. **Given** the organiser has manually typed a custom name in edit mode, **When** any field changes, **Then** the custom name is preserved.

---

### User Story 5 — "Create Event Slot" Button on Setup Step (Priority: P2)

On the Setup step of the stepper, there is a secondary "Create Event Slot" button below the primary "Next" button and above the "Main Menu" link (separated by a divider). Clicking it saves the event configuration (creating or updating the event record) and immediately navigates to the main menu — without advancing to the Roster step. A toast notification confirms "Event slot created".

**Why this priority**: Organisers regularly want to pre-create event slots on a schedule without immediately assigning players. Today they must complete the full stepper flow or navigate away and lose their setup data.

**Independent Test**: Fill in the Setup step, click "Create Event Slot" — the event is saved to the backend, the user is on the main menu, and a "Event slot created" toast appears. Confirm the saved event appears in the event list as a planned/slot event.

**Acceptance Scenarios**:

1. **Given** a completed Setup step form, **When** "Create Event Slot" is clicked, **Then** `createEvent` (or `updateEvent` in edit mode) is called and on success the user is navigated to "/".
2. **Given** the save succeeds, **When** the user lands on the main menu, **Then** a toast notification reading "Event slot created" is visible.
3. **Given** the save fails (network error), **When** "Create Event Slot" is clicked, **Then** an inline error message is shown and the user stays on the Setup step.
4. **Given** edit mode with an already-saved event, **When** "Create Event Slot" is clicked, **Then** `updateEvent` is called (not `createEvent`).

---

### User Story 6 — Step Navigation Guardrails (Priority: P2)

Back navigation in the stepper always works (Previous button and clicking completed step circles) until the event is started. All form state is preserved when navigating backwards. Once an event is "ongoing", navigating back to the stepper shows a read-only summary and an "Open Running Event" button instead of editable fields.

**Why this priority**: Organisers navigating back to fix a detail during setup currently risk losing form state; and arriving at an editable stepper for a running event creates confusion.

**Independent Test**: In the stepper, fill all steps, go back to Step 1, confirm values are preserved. Start the event, then navigate back to the stepper URL — confirm read-only summary is shown, no editable fields.

**Acceptance Scenarios**:

1. **Given** the user is on the Roster step, **When** they click "Previous", **Then** they return to the Setup step with all previously entered values intact.
2. **Given** completed step circles are visible, **When** the user clicks a completed step circle, **Then** they navigate back to that step with values intact.
3. **Given** the event is "ongoing", **When** the user navigates to the stepper URL for that event, **Then** a read-only summary is displayed with an "Open Running Event" button and no editable form fields.
4. **Given** the event is "finished", **When** the user navigates to the stepper URL, **Then** the same read-only summary and "View Summary" button are shown.

---

### User Story 7 — Global Toast Notification System (Priority: P2)

A lightweight in-app toast notification system is available globally. Toasts auto-dismiss after 4 seconds and appear in the bottom-right corner above all other content. Three categories exist: success (green), error (red), and info (neutral). Key actions in the Create Event flow fire toasts: new player created, event slot created, event ready to start, event started.

**Why this priority**: Currently there is no feedback confirmation after key actions (player added, event saved) — users are left wondering if the action succeeded.

**Independent Test**: Add a new player from the PlayerSelector — a green "Player [name] added" toast appears and auto-dismisses in ~4 seconds. Create an event slot — "Event slot created" toast appears. Save roster with ready-status event — "Event is ready to start" toast appears. Start an event — "Event started" toast appears.

**Acceptance Scenarios**:

1. **Given** a new player is created via PlayerSelector, **When** the creation succeeds, **Then** a success toast "Player [name] added" appears in the bottom-right and dismisses after 4 seconds.
2. **Given** the "Create Event Slot" button is clicked and the save succeeds, **When** the user lands on the main menu, **Then** a success toast "Event slot created" is visible.
3. **Given** the Roster step is saved and the event `lifecycleStatus` is `"ready"`, **When** save completes, **Then** a success toast "Event is ready to start" appears.
4. **Given** "Start Event" is clicked and the event starts successfully, **When** the running event window opens, **Then** a success toast "Event started" appears in the originating window.
5. **Given** any toast is showing, **When** 4 seconds pass, **Then** it disappears automatically.
6. **Given** multiple toasts are triggered in quick succession, **When** they are displayed, **Then** they stack vertically without overlapping.
7. **Given** zero new npm packages constraint, **When** the toast system is reviewed, **Then** it uses only React context, React state, and CSS — no third-party libraries.

---

### Edge Cases

- What if localStorage draft has a mix of valid and invalid player entries (some with `displayName`, some without)?
- What if the corrupt DB event has multiple orphaned rounds (not just one)?
- What if `window.open()` returns a reference but the popup is blocked silently (Chrome behavior)?
- What if the event name does NOT contain "Mexicano" — should the ` (Teams)` suffix still be appended?
- What if the organiser clears the name field entirely — does clearing count as a manual edit?
- What if the "Create Event Slot" save is clicked multiple times quickly (double-submit)?
- What if a toast is triggered while another toast is already auto-dismissing?
- What if the user navigates away from the stepper during an in-flight "Create Event Slot" save?

---

## Requirements *(mandatory)*

### Functional Requirements

**BUG-1: Event Already Started**

- **FR-001**: The DB migration `010_fix_corrupt_event_status.sql` MUST set `status='Running'` for any event where `status='Lobby'` AND at least one row exists in the `rounds` table for that `event_id`.
- **FR-002**: `start_event()` in `event_service.py` MUST detect the case where `lifecycle_status == "ready"` but `current_round` is already populated, and MUST update `status` to `Running` and return the existing round data instead of raising `EVENT_ALREADY_STARTED`.
- **FR-003**: The frontend `handleStartEvent()` in `CreateEvent.tsx` MUST call `getEvent(id)` first; if `lifecycleStatus === "ongoing"`, it MUST skip `startEvent()` and navigate directly to the running event view in a new window.
- **FR-004**: A backend integration test MUST verify that calling `start_event()` on an event with `status=Lobby` + an existing round returns the existing round without error.

**BUG-2: Player UUIDs in Assign Teams**

- **FR-005**: After `loadDraftPlayers()` initialisation, a `useEffect` MUST validate that every player object has a non-empty `displayName`; any invalid entries MUST be removed from the draft and re-saved to localStorage.
- **FR-006**: In edit mode, the player list initialisation MUST always prefer the catalog lookup over any cached localStorage value when populating `displayName`.

**FEATURE-1: Team Mexicano Auto-Suffix**

- **FR-007**: A `useEffect` watching `[isTeamMexicano, eventType]` MUST append ` (Teams)` to the event name when Team Mexicano is toggled ON, if the name contains "Mexicano" and does not already end with ` (Teams)`.
- **FR-008**: The same `useEffect` MUST remove the ` (Teams)` suffix when Team Mexicano is toggled OFF, if the suffix is present.
- **FR-009**: Auto-suffix logic MUST NOT fire if the organiser has manually edited the name field. This MUST be tracked with a `useRef<boolean>` named `manuallyEditedName` (NOT `useState`). The ref MUST be set to `true` on every `onChange` of the event name input.
- **FR-010**: Auto-suffix logic MUST NOT fire if the event type is not Mexicano.

**FEATURE-2: Auto-Name Updates in Edit Mode**

- **FR-011**: The `if (isEditMode) return` guard in the auto-name `useEffect` MUST be removed.
- **FR-012**: Auto-name updates MUST be suppressed when `lifecycleStatus` is `"ongoing"` or `"finished"`.
- **FR-013**: Auto-name updates MUST be suppressed when `manuallyEditedName.current === true`.

**FEATURE-3: Create Event Slot Button**

- **FR-014**: The Setup step MUST include a "Create Event Slot" button rendered between the primary "Next" button and the `<hr className="stepper-divider">` separator, using the secondary button style.
- **FR-015**: Clicking "Create Event Slot" MUST trigger the same save logic as "Next" (calling `createEvent` or `updateEvent`).
- **FR-016**: On successful save, the handler MUST call `navigate("/")` immediately and fire a "Event slot created" success toast.
- **FR-017**: On save failure, the handler MUST display an inline error message and keep the user on the Setup step.
- **FR-018**: The "Create Event Slot" button MUST be disabled while a save is in flight (to prevent double-submit).

**FEATURE-4: Step Navigation Guardrails**

- **FR-019**: The "Previous" button MUST be available on every step except Step 1, until the event is "ongoing".
- **FR-020**: Clicking a completed step indicator circle MUST navigate back to that step with all form state intact.
- **FR-021**: When the stepper loads for an event with `lifecycleStatus === "ongoing"` or `"finished"`, it MUST display a read-only summary mode with no editable input fields.
- **FR-022**: The read-only summary for an "ongoing" event MUST include an "Open Running Event" button that opens the running event view.
- **FR-023**: The read-only summary for a "finished" event MUST include a "View Summary" button linking to the event summary page.

**FEATURE-5: Global Toast System**

- **FR-024**: A `ToastProvider` component MUST be created at `frontend/src/components/toast/ToastProvider.tsx` that manages a toast queue and exposes a `useToast()` hook.
- **FR-025**: `useToast()` MUST expose `toast.success(message)`, `toast.error(message)`, and `toast.info(message)` methods.
- **FR-026**: Toasts MUST auto-dismiss after exactly 4 seconds.
- **FR-027**: Toasts MUST appear in the bottom-right corner of the viewport at `z-index: 9999`.
- **FR-028**: Success toasts MUST use a green visual treatment; error toasts red; info toasts neutral/grey.
- **FR-029**: Multiple toasts MUST stack vertically without overlapping.
- **FR-030**: `ToastProvider` MUST be wired into `frontend/src/app/AppShell.tsx` (or the router root).
- **FR-031**: The toast system MUST use zero npm packages — pure React context + CSS only.
- **FR-032**: A success toast "Player [name] added" MUST be fired in `PlayerSelector.tsx` after a player is successfully created.
- **FR-033**: A success toast "Event slot created" MUST fire after a successful "Create Event Slot" save.
- **FR-034**: A success toast "Event is ready to start" MUST fire after a successful Roster save when `lifecycleStatus === "ready"`.
- **FR-035**: A success toast "Event started" MUST fire after `startEvent()` succeeds.

### Key Entities

- **Draft Player Entry**: Object persisted in localStorage as part of the Create Event draft. Must always contain a non-empty `displayName` field alongside `id`. Invalid entries (missing `displayName`) are purged on mount.
- **Toast**: An ephemeral in-memory message object with fields: `id` (unique), `type` (`"success" | "error" | "info"`), `message` (string), `createdAt` (timestamp). Auto-removed after 4 seconds.
- **`manuallyEditedName` Ref**: A `React.MutableRefObject<boolean>` in `CreateEvent.tsx`. Starts `false`; set to `true` on any user keystroke in the event name input. Never reset to `false` within a session (the auto-suffix logic is permanently disabled once the user manually edits the name).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four previously-corrupt events (`9039fdeb`, `637cd938`, `8823b0b1`, `38a1eb1b`) can be started (or opened if already running) with zero errors after applying the migration and code fix.
- **SC-002**: The Assign Teams step in Team Mexicano mode shows zero raw UUIDs under any circumstance — always displays human-readable names.
- **SC-003**: Toggling Team Mexicano on/off in a Mexicano event with an auto-generated name correctly appends/removes ` (Teams)` in 100% of cases where the name was not manually edited.
- **SC-004**: Editing a planned or ready event and changing time or mode causes the event name to auto-update, matching the same auto-name logic used for new events.
- **SC-005**: Clicking "Create Event Slot" on a completed Setup step saves the event and lands the user on the main menu within the normal API response time; the event appears in the event list as a planned slot.
- **SC-006**: Back-navigation within the stepper preserves all form state with no data loss, across all steps.
- **SC-007**: Navigating to the stepper for an ongoing or finished event shows read-only mode — no editable fields are present, no accidental mutation is possible.
- **SC-008**: All four toast triggers (player added, event slot created, event ready, event started) produce a visible notification in the bottom-right that auto-dismisses after 4 seconds.
- **SC-009**: All existing 291 frontend tests and 81 backend tests continue to pass after all changes are applied.
- **SC-010**: Zero new npm packages are introduced by this feature.

---

## Assumptions

- The four corrupt DB events are the only ones affected by BUG-1; the migration targets only the `status='Lobby'` + existing-round condition and does not risk touching legitimately-planned events.
- Clearing the event name field entirely (empty string) counts as a manual edit — `manuallyEditedName` is set to `true` on any `onChange` event, regardless of the resulting value.
- The ` (Teams)` auto-suffix only fires when the event name contains the substring "Mexicano" (case-sensitive match on "Mexicano") — it does not fire for arbitrarily-named Team Mexicano events.
- "Create Event Slot" save uses the identical validation path as the current "Next" button on Setup; if validation fails, the same inline errors are shown.
- The read-only stepper summary (FEATURE-4) does not require a new route — it is rendered conditionally within the existing `CreateEvent.tsx` when `lifecycleStatus` is `"ongoing"` or `"finished"` on mount.
- The `ToastProvider` wraps the app at the `AppShell` level, meaning toasts are available on every page (not just the Create Event flow).
- BUG-3 ("Failed to fetch") was diagnosed as the backend not running — not a code bug. No code change is required.
