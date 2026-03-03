# Data Model: Event State and Restart Iteration

## Entities

### 1) EventLifecycleState
- **Purpose**: Canonical organizer-visible event state classification.
- **Fields**:
  - `eventId` (uuid)
  - `setupStatus` (`planned` | `ready`)
  - `runtimeStatus` (`ongoing` | `finished` | `idle`)
  - `displayState` (`planned` | `ready` | `ongoing` | `finished`)
- **Validation rules**:
  - Start success sets runtime status to `ongoing`.
  - Completion of required rounds/matches sets runtime status to `finished`.
  - Display state must map deterministically from persisted setup/runtime fields.

### 2) RunProgressSnapshot
- **Purpose**: Persisted progress model used for resume and restart reset.
- **Fields**:
  - `eventId`
  - `currentRoundNumber`
  - `matches` (list)
  - `completedResults` (subset)
  - `pendingMatches` (subset)
- **Validation rules**:
  - Snapshot must be recoverable after navigation/reload.
  - Restart clears run progress/results for this event before next start.

### 3) RestartCommand
- **Purpose**: Confirmed organizer command to reset ongoing run while preserving setup.
- **Fields**:
  - `eventId`
  - `confirmed` (boolean)
  - `resultingSetupStatus` (expected: `ready`)
  - `resultingRuntimeStatus` (expected: non-ongoing idle)
- **Validation rules**:
  - Allowed only when current display state is `ongoing`.
  - Requires explicit confirmation.
  - After execution, event returns to ready and preview is the target surface.

### 4) DuplicateWarningContext
- **Purpose**: Duplicate-slot warning decision model for create/edit flows.
- **Fields**:
  - `eventName`
  - `eventDate`
  - `eventTime`
  - `currentEventId` (optional in edit mode)
  - `matchingEventIds`
- **Validation rules**:
  - In edit mode, duplicate check excludes `currentEventId`.
  - Warning appears only when other matching events exist.

### 5) PreviewOperationalSummary
- **Purpose**: Preview context rows used for readiness and action decisions.
- **Fields**:
  - `eventMode`
  - `dateTimeLine`
  - `setupStatus`
  - `playersAssignedCount`
  - `courtsAssignedCount`
- **Validation rules**:
  - Date/time shown in single combined line when time exists.
  - Counts and status reflect latest persisted values.

### 6) ResumeLoadErrorGuide
- **Purpose**: Actionable failure guidance for resume/load paths.
- **Fields**:
  - `code`
  - `message`
  - `nextAction`
  - `retryable`
- **Validation rules**:
  - Must provide actionable guidance.
  - Must not degrade to only generic network text.

## Relationships

- `EventLifecycleState` governs action gating and list labels.
- `RunProgressSnapshot` feeds resume restoration and is affected by `RestartCommand`.
- `DuplicateWarningContext` influences edit/create warning rendering.
- `PreviewOperationalSummary` is derived from event/setup persistence and lifecycle state.
- `ResumeLoadErrorGuide` can be produced by any resume/load retrieval failure.

## State Transitions

1. `ready -> ongoing` on successful start.
2. `ongoing -> finished` automatically when required rounds/matches complete.
3. `ongoing -> ready` on confirmed restart after run-progress reset.
4. `planned -> planned` when execution actions are blocked.
