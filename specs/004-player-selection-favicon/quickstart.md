# Quickstart: Player Selection and Favicon Improvements

## Prerequisites

- Node.js 20+
- npm installed
- Backend API running for player/event endpoints

## 1) Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

## 2) Validate player setup flow

1. Open create event flow.
2. With empty catalog, add a new player and verify immediate assignment in the event draft list.
3. Add a player name with casing variation of an existing name and verify duplicate reuse behavior.
4. Type one-character prefix (for example `A`) and verify matching suggestions appear.
5. Remove an assigned player using left-side minus action and verify removal only affects draft assignment.
6. Refresh and return to same draft; verify assigned-player list restores.

## 3) Validate favicon behavior

1. Open app in browser and verify tab icon uses Molndal logo.
2. Validate fallback behavior where needed by compatibility checks.
3. If icon appears stale, hard-refresh browser cache and verify again.
4. Confirm both `/icons/molndal-padel-favicon.svg` (primary) and `/icons/molndal-padel-favicon.png` (fallback) are reachable.

## 4) Run automated checks

```bash
cd frontend
npm run lint
npm run test
```

## 5) Regression checks

- Event creation submission constraints remain unchanged.
- Player assignment changes do not delete global player records.
- Existing route structure and event outcomes remain unchanged.
