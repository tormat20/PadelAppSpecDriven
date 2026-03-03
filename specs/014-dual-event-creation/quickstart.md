# Quickstart: Dual Event Creation Flows and Editable Preview

## 1) Validate dual create actions

1. Open Create Event.
2. Enter planning fields only (name, mode, date, time), with no courts/players.
3. Confirm `Create Event` is disabled.
4. Confirm `Create Event Slot` is enabled.
5. Save via `Create Event Slot` and confirm resulting event status is `planned`.
6. Confirm courts/players selected in the form are not applied by slot create.

## 2) Validate strict create behavior remains intact

1. On Create Event, select courts and assign players until exact mode-specific requirements are met.
2. Confirm `Create Event` becomes enabled only when requirements are fully satisfied.
3. Save via `Create Event` and confirm resulting event is `ready` and can be started without extra setup.

## 3) Validate edit flow from preview

1. Open Preview Event for a planned event.
2. Select `Edit Event` and confirm navigation to the existing create surface in edit mode with prefilled values.
3. Confirm only `Save Changes` is shown as the primary save action.
4. Save with incomplete setup and confirm status remains `planned`.
5. Save again with complete setup and confirm status becomes `ready`.

## 4) Validate start gating

1. Attempt Start Event while status is `planned`; confirm action is blocked.
2. Attempt Start Event while status is `ready`; confirm action proceeds.

## 5) Validate Event Slots layout consistency

1. Create multiple events with short and long names.
2. Open Home > Event Slots.
3. Confirm planned/ready indicators remain centered in a fixed aligned status column for all rows.

## 6) Validate warnings stay non-blocking

1. Use past date/time and duplicate slot values in create/edit.
2. Confirm warnings are visible but do not block save.

## 7) Run validation commands

```bash
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend
npm run lint
npm run test

cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend
PYTHONPATH=. uv run pytest tests/contract tests/integration
```
