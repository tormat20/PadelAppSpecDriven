# Contract: Account Settings Event Management

## Purpose

Define destructive event administration behavior from `/account-settings`.

## Section Contract

1. Account Settings includes an "Event Management" section in addition to existing player management tools.
2. Section includes "Remove all events" action.

## Confirmation Contract

1. Remove-all action requires explicit confirmation before execution.
2. If user cancels, no event data is changed.

## Execution Contract

1. On confirmation, all admin-scoped events are deleted.
2. Calendar and account-related views refresh to reflect empty event state.
3. Any errors are surfaced to user with actionable retry feedback.
