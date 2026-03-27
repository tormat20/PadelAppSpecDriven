# Contract: Calendar Event Interaction Modes

## Purpose

Define observable user interaction behavior for move and resize modes on calendar event cards.

## Move Mode Contract

1. Hovering event body communicates move affordance.
2. Starting gesture from event body enters move mode.
3. While moving, landing preview remains visible.
4. On drop, only scheduling fields update (date/time), duration remains unchanged.

## Resize Mode Contract

1. Hovering bottom 4px of an event card communicates vertical resize affordance.
2. Starting gesture from bottom 4px enters resize mode.
3. Resize steps follow 30-minute granularity.
4. Resulting duration is constrained to 60, 90, or 120 minutes.
5. Duration change updates card height and displayed time range immediately.

## Conflict Prevention Contract

1. A gesture beginning in resize zone must not trigger move mode.
2. A gesture beginning in move zone must not trigger resize mode.
3. Mode selection is locked for the active pointer gesture.

## Accessibility and Visual Feedback Contract

1. Event cards expose hover/focus interactive glare aligned with existing app style.
2. Interaction feedback remains visible for both pointer and keyboard focus states.
