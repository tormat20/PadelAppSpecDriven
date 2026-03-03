# Data Model: Planned Event Slots with Deferred Setup Validation

## Entities

### 1) EventPlanningRecord
- **Purpose**: Persist an event that may be incompletely configured at creation time.
- **Fields**:
  - `eventId` (uuid)
  - `name` (string, required)
  - `mode` (enum, required)
  - `scheduledDate` (date, required)
  - `scheduledTime` (time, required)
  - `setupStatus` (enum: `planned` | `ready`)
  - `version` (integer, increments on write)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- **Validation rules**:
  - Creation requires `name`, `mode`, `scheduledDate`, `scheduledTime`.
  - `setupStatus` defaults to `planned` at creation.
  - `version` starts at 1 and increments after each successful update.

### 2) EventSetupState
- **Purpose**: Represent mutable setup inputs that determine readiness.
- **Fields**:
  - `courtIds` (list of integer court numbers)
  - `playerIds` (list of player IDs)
  - `participantCount` (derived integer)
  - `requiredPlayerCount` (derived integer from mode/court rules)
- **Validation rules**:
  - Court and player data may be empty while status is `planned`.
  - Readiness requires full mode-specific constraints, including required courts and exact player count.

### 3) SetupReadinessEvaluation
- **Purpose**: Explain whether event setup is complete.
- **Fields**:
  - `isReady` (boolean)
  - `missingRequirements` (list of canonical requirement keys/messages)
  - `evaluatedAt` (timestamp)
- **Validation rules**:
  - Evaluation runs after create and every setup mutation.
  - If any required item is missing, `isReady = false` and `setupStatus = planned`.
  - If no required items are missing, `isReady = true` and `setupStatus = ready`.

### 4) PlanningWarnings
- **Purpose**: Surface non-blocking advisory states during planning.
- **Fields**:
  - `pastDateTimeWarning` (boolean)
  - `duplicateSlotWarning` (boolean)
  - `duplicateGroupKey` (string: normalized name + date + time)
- **Validation rules**:
  - Warnings do not block save when planning fields are valid.
  - Duplicate warning is emitted when one or more other events share normalized name/date/time.

### 5) EventUpdateConflict
- **Purpose**: Prevent silent overwrite during concurrent edits.
- **Fields**:
  - `eventId` (uuid)
  - `expectedVersion` (integer from client)
  - `currentVersion` (integer in storage)
  - `conflictCode` (string, stable error identifier)
- **Validation rules**:
  - Update succeeds only when `expectedVersion == currentVersion`.
  - On mismatch, update is rejected and conflict response instructs refresh/retry.

## Relationships

- `EventPlanningRecord` owns one mutable `EventSetupState` and one computed `SetupReadinessEvaluation`.
- `SetupReadinessEvaluation` determines `EventPlanningRecord.setupStatus`.
- `PlanningWarnings` are derived from `EventPlanningRecord` plus sibling event records.
- `EventUpdateConflict` applies to writes on `EventPlanningRecord`.

## State Transitions

### Setup status transitions
1. `planned-created` -> event created with planning fields only.
2. `planned-updating` -> organizer adds/edits courts/players/mode/schedule.
3. `ready` -> readiness evaluation has no missing requirements.
4. `planned-regressed` -> previously ready event becomes incomplete after edit and status reverts to `planned`.

### Conflict handling transitions
1. `edit-open` -> client reads event with `version = N`.
2. `save-attempt` -> client submits update with `expectedVersion = N`.
3. `conflict` -> storage has `currentVersion != N`; write rejected with refresh/retry guidance.
4. `retry-success` -> client reloads latest event and saves with current version.
