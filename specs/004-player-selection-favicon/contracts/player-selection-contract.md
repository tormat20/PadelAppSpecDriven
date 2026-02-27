# Player Selection Contract

## Purpose

Define externally observable behavior for player creation, search suggestion, assignment management, and favicon branding within event setup.

## Interaction Contract

### Add New Player
1. Host provides player name in event setup.
2. System checks case-insensitive duplicate against existing player catalog.
3. Outcome:
   - If duplicate exists: reuse existing player record.
   - If no duplicate exists: create new player record.
4. In both outcomes, player is assigned to active event draft immediately.
5. Host sees a clear result message indicating whether player was created or reused.

### Search Suggestions
1. Suggestions begin after one typed character.
2. Matching uses case-insensitive prefix logic.
3. Empty-result state is shown when no matches exist.

### Assigned Player List
1. Assigned players are always visible for active draft.
2. Each row includes left-aligned minus action.
3. Minus action removes player from active draft assignment only.
4. Global player catalog entry remains intact.

### Draft Persistence
1. Assigned-player state persists for active draft.
2. Refreshing or returning to same draft restores assignments.

## Branding Contract

1. Browser tab uses Molndal logo SVG as primary favicon source.
2. PNG fallback is configured for compatibility.
3. Verification may require cache refresh.

## Verification Requirements

- Add-and-assign behavior passes for empty-catalog and existing-catalog scenarios.
- Duplicate-name behavior reuses existing player without creating a duplicate record.
- Prefix suggestion behavior includes expected names from first typed character.
- Minus action unassigns from draft without deleting catalog record.
- Draft assignment state restores after refresh/return.
- Favicon displays Molndal logo with fallback coverage across supported browsers.

## Verification Log

- 2026-02-26: Automated checks passed (`npm run lint`, `npm run test` in `frontend/`).
- 2026-02-26: Favicon link smoke test confirms SVG primary and PNG fallback links are configured.
- Manual quickstart checks: pending browser-run verification.
