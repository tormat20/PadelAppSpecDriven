# UI Contract: Calendar Popup Editor

## Trigger Contract

- Trigger element: calendar event name text in event block.
- Trigger interaction: click (pointer) and keyboard activate.
- Expected result: centered popup modal opens above current calendar context.

## Modal Structure Contract

- Dialog semantics present (`role=dialog`, accessible label/title linkage).
- Header contains:
  - popup title
  - close button (`X`) top-right
- Body contains create-style edit flow sections:
  - mode selector
  - date/time
  - duration
  - event name
  - courts/players progression
- Footer contains context actions only:
  - save progression
  - delete
  - cancel/close

## Behavior Contract

- Escape closes modal.
- Close `X` closes modal.
- Cancel closes modal.
- Save initiates immediate persistence and resolves with success/error UI feedback.
- On success, modal closes (or remains with success state based on UX decision), and calendar reflects persisted event state.

## Non-Goals

- No route redirect to separate create page.
- No main-menu action in popup.
