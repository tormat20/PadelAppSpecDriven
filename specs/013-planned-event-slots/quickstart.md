# Quickstart: Planned Event Slots with Deferred Setup Validation

## 1) Create a planned slot with minimum planning fields

1. Open the create-event flow.
2. Enter event name, mode, date, and time only.
3. Save without selecting courts or players.
4. Confirm event is created in `planned` status and appears in event overview after reload.

## 2) Validate warning behavior

1. Create or edit an event using a past date/time and confirm save is allowed.
2. Confirm a visible warning appears for past schedule values.
3. Create another planned event with same normalized name/date/time.
4. Confirm duplicate warning appears and both events remain distinguishable in list/detail views.

## 3) Validate deferred readiness transitions

1. Open a planned event and add setup data incrementally.
2. Confirm status remains `planned` until mode-specific court/player requirements are fully met.
3. Complete all required setup and confirm status transitions to `ready`.
4. Modify setup to violate requirements and confirm status reverts to `planned`.

## 4) Validate run/start protection

1. Attempt to start a `planned` event.
2. Confirm action is blocked with a clear list of missing requirements.
3. Start a `ready` event and confirm existing run flow still works.

## 5) Validate concurrent edit protection

1. Open the same planned event in two browser sessions.
2. Save a change in session A.
3. Save a stale change in session B.
4. Confirm stale save is rejected with conflict guidance to refresh/retry.

## 6) Run automated checks

```bash
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend
npm run lint
npm run test

cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend
PYTHONPATH=. uv run pytest tests/contract tests/integration
```
