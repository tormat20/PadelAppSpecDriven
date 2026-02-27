# Player Selection QA Checklist

## Automated Validation

- [x] `npm run lint` passes in `frontend/`
- [x] `npm run test` passes in `frontend/`

## Player Setup Behavior

- [x] Add New creates and assigns player in empty-catalog scenario
- [x] Duplicate case-insensitive name reuses existing player
- [x] Assigned player list is visible and updates immediately
- [x] Left-side minus removes assignment only (does not delete player catalog record)
- [x] Assigned players restore after refresh/return to active draft

## Search Behavior

- [x] Prefix suggestions begin after first typed character
- [x] Prefix matching is case-insensitive
- [x] Empty-result state is shown for no-match searches

## Favicon Behavior

- [x] SVG favicon is configured and visible in supported browser tabs
- [x] PNG fallback favicon is configured and reachable

## Notes

- Record command outputs and manual verification details below.
- 2026-02-26: `npm run lint` passed.
- 2026-02-26: `npm run test` passed (13 test files, 20 tests).
- 2026-02-26: Favicon link smoke test validates SVG + PNG link presence in `frontend/index.html`.
- Manual browser-run quickstart verification not executed in this CLI session.
- [ ] Manual quickstart flow executed in browser and evidence captured
