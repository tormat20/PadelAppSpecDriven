# Behavior Contract: Staged + Immediate-Save Reconciliation

## Scope

Defines how staged quick edits and popup immediate-save edits coexist safely.

## Rules

1. Popup save success establishes source-of-truth for the edited event.
2. Staged entries for that same event are removed or replaced with canonical persisted state.
3. Staged entries for other events remain untouched.
4. Redo Changes only resets unsaved staged changes and must not revert popup-persisted updates.
5. Save Changes submits only currently staged edits after reconciliation.

## Required Outcomes

- No stale staged update for event can overwrite a newer popup save.
- User can continue staged editing on other events without losing progress.
- Calendar UI reflects persisted popup result without ambiguous dirty state.

## Failure Handling

- If popup save fails, staged reconciliation does not occur.
- If conflict occurs, keep local edit context and surface retry guidance.
