# Quickstart: Resumable Ongoing Events and Run-State UX

## 1) Validate run-state transition to ongoing

1. Create a ready event with complete setup.
2. Start the event.
3. Confirm event state updates to `ongoing` immediately after start.

## 2) Validate resume behavior after leaving run page

1. While event is ongoing, leave run page and return to main menu.
2. Open the same event from Event Slots or Preview.
3. Confirm `Resume Event` is shown and resume opens in-progress state.
4. Confirm current round, completed results, and pending matches are restored.

## 3) Validate action gating rules

1. For `planned` events, confirm no start/resume execution action is available.
2. For `ready` events, confirm only `Start Event` is available.
3. For `ongoing` events, confirm only `Resume Event` is available.

## 4) Validate Event Slots status labels

1. Populate events in planned, ready, and ongoing states.
2. Open Home > Event Slots.
3. Confirm all three labels render correctly per event state.

## 5) Validate preview schedule line and errors

1. Open Preview Event with configured date/time and confirm combined display (example: `2026-03-10 19:00`).
2. Trigger a resume/load failure condition (for example unavailable event or transient fetch failure).
3. Confirm UI shows actionable recovery guidance rather than only generic network text.

## 6) Regression checks

1. Validate create-slot flow remains unchanged.
2. Validate strict-create gating remains unchanged.
3. Validate edit-save behavior remains unchanged.

## 7) Run verification commands

```bash
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend
npm run lint
npm run test

cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend
PYTHONPATH=. uv run pytest tests/contract tests/integration
```
