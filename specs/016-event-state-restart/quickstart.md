# Quickstart: Event State and Restart Iteration

## 1) Validate four-state labeling and action gating

1. Prepare events in `planned`, `ready`, `ongoing`, and `finished` states.
2. Open Home > Event Slots and verify each event shows the correct label.
3. Open Preview for each state and verify action availability:
   - planned: no run action
   - ready: `Start Event`
   - ongoing: `Resume Event` + `Restart Event`
   - finished: `View Summary`

## 2) Validate ongoing transition and resume restoration

1. Start a ready event.
2. Confirm event state becomes `ongoing` immediately.
3. Leave run flow, reload, and reopen event.
4. Confirm resume restores current round, completed results, and pending matches.

## 3) Validate restart behavior

1. Open an ongoing event and choose `Restart Event`.
2. Confirm explicit confirmation is required.
3. Confirmed restart should clear prior run progress/results.
4. Confirm event returns to `ready` and lands on Preview with `Start Event` available.

## 4) Validate self-duplicate warning fix

1. Open an existing event in edit mode without changing name/date/time.
2. Confirm duplicate warning does not appear for the same event.
3. Introduce another event with matching schedule/name and confirm warning appears for true duplicates.

## 5) Validate preview context and error guidance

1. Verify preview shows combined date-time (for example `2026-03-10 19:00`).
2. Verify preview rows include Event Mode, Date/Time, Setup Status, Players Assigned, and Courts Assigned.
3. Trigger resume/load error and verify actionable guidance appears (not only generic network text).

## 6) Regression checks

1. Validate create-slot behavior remains unchanged.
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
