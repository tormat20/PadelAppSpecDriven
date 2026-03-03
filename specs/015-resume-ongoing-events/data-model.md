# Data Model: Resumable Ongoing Events and Run-State UX

## Entities

### 1) EventRunState
- **Purpose**: Canonical execution state used for start/resume action gating.
- **Fields**:
  - `eventId` (uuid)
  - `setupStatus` (`planned` | `ready`)
  - `runStatus` (`ongoing` | `not_ongoing` terminal/idle mapping)
  - `currentRoundNumber` (integer | null)
- **Validation rules**:
  - Successful start transitions `runStatus` to `ongoing`.
  - Planned events cannot expose start/resume execution actions.
  - Ready events can expose start but not resume.
  - Ongoing events expose resume and not start.

### 2) OngoingSessionSnapshot
- **Purpose**: Persisted in-progress event context restored by resume.
- **Fields**:
  - `eventId`
  - `currentRound`
  - `matches` (list)
  - `completedResults` (subset of matches with results)
  - `pendingMatches` (subset with no finalized result)
- **Validation rules**:
  - Snapshot source is persisted backend state only.
  - Snapshot must be reconstructable after navigation and page reload.

### 3) ResumeActionAvailability
- **Purpose**: Derived decision model for UI action labels/buttons.
- **Fields**:
  - `eventId`
  - `primaryAction` (`start` | `resume` | `none`)
  - `reason` (optional explanatory code for disabled state)
- **Validation rules**:
  - `start` only when setup is ready and event not ongoing.
  - `resume` only when event is ongoing.
  - `none` when planned or terminal states require non-execution actions.

### 4) ResumeLoadError
- **Purpose**: User-facing actionable failure payload for resume/load flows.
- **Fields**:
  - `code` (stable identifier)
  - `message` (human-readable explanation)
  - `action` (recommended next step)
  - `retryable` (boolean)
- **Validation rules**:
  - Must provide actionable guidance.
  - Must not degrade to only generic `Network error` text.

### 5) PreviewScheduleLine
- **Purpose**: Combined date-time representation in Preview Event.
- **Fields**:
  - `eventDate`
  - `eventTime24h` (optional)
  - `displayText` (combined string when time exists)
- **Validation rules**:
  - If time exists, display one-line date-time string.
  - If time is absent, fallback remains consistent and readable.

## Relationships

- `EventRunState` references persisted event metadata and is reflected in list/preview surfaces.
- `OngoingSessionSnapshot` is derived from persisted rounds/matches/results for an `eventId`.
- `ResumeActionAvailability` is computed from `EventRunState`.
- `ResumeLoadError` can be emitted during snapshot fetch and state checks.
- `PreviewScheduleLine` derives from event schedule fields.

## State Transitions

1. `ready -> ongoing` when start succeeds.
2. `ongoing -> ongoing` when navigating away and resuming (state preserved).
3. `ongoing -> terminal` when event finishes.
4. `planned -> planned` when execution action is blocked.
