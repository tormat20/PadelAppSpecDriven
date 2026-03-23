# API Contract: Popup Immediate Save

## Purpose

Defines expected payload/response behavior for popup-based event editing that persists immediately.

## Request Shape

- Endpoint: existing event update endpoint (no new route required unless implementation chooses to add one).
- Required fields:
  - `eventId`
  - `expectedVersion`
- Optional editable fields:
  - `eventName`
  - `eventType`
  - `eventDate`
  - `eventTime24h`
  - `eventDurationMinutes`
  - `selectedCourts`
  - `playerIds`
  - team-mexicano flag where applicable

## Success Response

- Returns canonical updated event payload with incremented version.
- Includes setup/validation projections consistent with current event response model.

## Error Response

- Validation errors return user-actionable payload.
- Version conflicts return explicit conflict code and current version.
- Unknown event returns not-found semantics.

## Consistency Rules

- Popup save is immediate persistence.
- Any local staged state for same event must reconcile to returned canonical event.
