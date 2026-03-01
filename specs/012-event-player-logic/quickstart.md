# Quickstart: Event Player Logic and Summary Icon/Alignment Update

## 1) Validate create-event capacity behavior

1. Open `/events/create`.
2. Select 1 court and assign fewer than 4 players -> Create Event stays disabled.
3. Assign exactly 4 players -> Create Event can become enabled (with valid schedule inputs).
4. Select 5 courts and verify required count becomes 20 and submit requires exactly 20 assigned players.

## 2) Validate create-event section clarity

1. Confirm court selector shows explicit "Courts" label.
2. Confirm Assigned header shows right-aligned `assigned / required` count.

## 3) Validate date shortcut behavior

1. Choose a time value in the native single time input.
2. Click "Today's date" shortcut below schedule row.
3. Confirm date updates to today and time value remains unchanged.

## 4) Validate summary winner display

1. Open final summary with crowned players.
2. Confirm winner icon uses colored crown path.
3. Confirm rank values are centered, names are left-aligned, and crown icon is right-aligned in name cell.
4. Simulate icon load failure and confirm fallback marker appears.

## 5) Run automated checks

```bash
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend
npm run lint
npm run test

cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend
PYTHONPATH=. uv run pytest tests/contract tests/integration
```
