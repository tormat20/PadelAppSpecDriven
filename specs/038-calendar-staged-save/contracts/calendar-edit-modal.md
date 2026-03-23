# Contract: In-Place Calendar Edit Modal

## Purpose

Define behavior for opening and using event editing as an overlay modal within calendar context.

## Trigger Contract

1. Hovering event name shows edit affordance (underline + pointer cursor).
2. Clicking event name opens edit modal overlay above calendar.

## Modal Behavior Contract

1. Modal reuses existing event setup/edit capabilities.
2. Modal includes close (`X`), cancel, and save interactions.
3. Closing/canceling keeps user on `/calendar` and preserves context.
4. Saving updates staged calendar state; final persistence happens on Save Changes action.

## Interaction Separation Contract

1. Name-click edit mode must not trigger move or resize mode.
2. Move and resize gestures remain unaffected by modal triggers.
