# UI Rendering Contracts: Run Event UI Polish (043)

**Branch**: `043-run-event-ui-polish` | **Date**: 2026-03-31

---

## Contract A-1: RunEvent page panel structure

### Scope

`frontend/src/pages/RunEvent.tsx` — the rendered JSX when `eventData` and `roundData` are loaded (non-error, non-loading path).

### Before

```
page-shell
  ├── header.page-header.panel          ← PANEL 1 (standalone header)
  │   ├── h2.page-title                 "Run Event - Round N"
  │   ├── p.page-subtitle               "Submit each result to unlock the next round."
  │   └── [Stepper?]                    (only for non-Mexicano events)
  ├── section.panel.run-grid            ← PANEL 2
  │   └── CourtGrid
  ├── ResultModal
  ├── section.panel.grid-columns-2      ← PANEL 3 (action buttons)
  │   └── div.run-action-panel
  │       ├── div.run-action-row        (Previous / Next)
  │       └── div.run-action-row        (View Summary / Finish Event)
  └── ...
```

### After

```
page-shell
  ├── section.panel.run-grid            ← PANEL 1 (court grid, now contains round header)
  │   ├── div.run-grid__round-header    ← NEW wrapper
  │   │   ├── h2.page-title             "Run Event - Round N"
  │   │   └── [Stepper?]               (only for non-Mexicano events)
  │   └── CourtGrid
  ├── ResultModal
  ├── section.panel.grid-columns-2      ← PANEL 2 (action buttons, was PANEL 3)
  │   └── div.run-action-panel
  │       ├── div.run-action-row        (Previous / Next)
  │       └── div.run-action-row        (View Summary / Finish Event)
  └── ...
```

### Contract Rules

| Rule | Condition | Expected |
|------|-----------|----------|
| Panel count above action buttons | Always | 1 (was 2) |
| `header.page-header.panel` | Always | Absent from RunEvent JSX |
| `p.page-subtitle` with subtitle text | Always | Absent from RunEvent JSX |
| `div.run-grid__round-header` | Always | Present as first child of `.run-grid` |
| `h2.page-title` with round number | Always | Present inside `.run-grid__round-header` |
| `Stepper` component | Non-Mexicano event only | Present inside `.run-grid__round-header` |
| `Stepper` component | Mexicano event | Absent (no empty space) |

### Interface Contract for Branch 045

Branch 045 expects `div.run-grid__round-header` to exist inside `section.panel.run-grid`. It will add a child button and a `.run-grid__round-header-left` sub-wrapper. The 043 state with a plain column-flex `run-grid__round-header` is the correct starting point.

---

## Contract A-2: EventBlock moment slot content

### Scope

`frontend/src/components/calendar/EventBlock.tsx` — the `span.calendar-event-block__moment` element rendered for every calendar event block.

### Before

```
calendar-event-block
  ├── button.calendar-event-block__name      "Mexicano" (event type label)
  ├── span.calendar-event-block__moment      "Wednesday Afternoon"   ← time-of-day label
  ├── span.calendar-event-block__time-range  "10:00 - 12:00"
  └── [span.calendar-event-block__duration]  (only for ≥120 min events)
```

### After

```
calendar-event-block
  ├── button.calendar-event-block__name      "Mexicano" (event type label)
  ├── span.calendar-event-block__moment      "Planned" / "Ongoing" / "Finished"   ← status label
  ├── span.calendar-event-block__time-range  "10:00 - 12:00"
  └── [span.calendar-event-block__duration]  (only for ≥120 min events)
```

### Status Mapping Contract

| `event.status` value | Displayed text |
|---|---|
| `"Lobby"` | `"Planned"` |
| `"Running"` | `"Ongoing"` |
| `"Finished"` | `"Finished"` |
| Any unknown / missing | `"Planned"` (safe default) |

### Invariants

- `span.calendar-event-block__moment` is **always present** (the status label always has a value).
- `span.calendar-event-block__time-range` is **unchanged** — still renders the time range string.
- The `calendar-event-block__moment` CSS class is **unchanged** — no visual style changes.
- `formatEventMomentLabel` is **not called** during rendering after this change.
- `formatEventMomentLabel` **remains exported** from `EventBlock.tsx` — all existing unit tests pass.

---

## Contract A-3: CourtLineChart Y-axis and dimensions

### Scope

`frontend/src/pages/PlayerStats.tsx` — the `CourtLineChart` SVG component.

### Before

```
SVG dimensions:   width=340  height=180
Y-axis ticks:     courts 1 … max(player's highest court, 1) [rounded up]
Example (max=3):  ticks = [1, 2, 3]
Example (max=5):  ticks = [1, 2, 3, 4, 5]
Example (max=7):  ticks = [1, 2, 3, 4, 5, 6, 7]
```

### After

```
SVG dimensions:   width=420  height=240
Y-axis ticks:     courts 1 … max(player's highest court rounded up, 7)
Example (max=3):  ticks = [1, 2, 3, 4, 5, 6, 7]   ← floored to 7
Example (max=5):  ticks = [1, 2, 3, 4, 5, 6, 7]   ← floored to 7
Example (max=7):  ticks = [1, 2, 3, 4, 5, 6, 7]   ← natural
Example (max=8):  ticks = [1, 2, 3, 4, 5, 6, 7, 8] ← natural extension
```

### Invariants

- When `data.length === 0`, `CourtLineChart` returns `null` — **no regression** (guard unchanged at line 275).
- `viewBox`, `width`, and `height` SVG attributes are all driven by `COURT_W`/`COURT_H` constants — they update automatically.
- The `avgCourtOverall` inline stat continues to render when non-null.
- No other chart components (`AvgScoreLineChart`, `EloLineChart`, etc.) are affected.
