# Contract: Staged Calendar Save Workflow

## Purpose

Define behavior for staging calendar edits and committing them with an explicit Save Changes action.

## Staging Contract

1. Move, resize, template-create, and modal edit actions update local calendar state immediately.
2. Any staged change sets calendar `dirty` state to true.
3. Save Changes control appears only while dirty state is true.

## Save Contract

1. Save Changes persists all staged operations to backend event data.
2. Save must prevent duplicate submissions while in progress.
3. On success, dirty state is cleared and save status reflects completion.
4. On failure, staged state is retained and user receives clear retry feedback.

## Navigation Guard Contract

1. Attempting to leave calendar with unsaved staged changes prompts a confirmation.
2. User can choose to continue editing, discard, or leave according to app guard behavior.

## Drag Preview Contract

1. Drag preview height always reflects active event duration footprint.
2. Duration-based preview works consistently for legacy and newly created events.
