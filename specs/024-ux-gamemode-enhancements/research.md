# Research: UX Fixes & Game Mode Enhancements (024)

**Branch**: `024-ux-gamemode-enhancements`  
**Date**: 2026-03-06

---

## Story 1 — UserMenu Dropdown Visible Above Navigation

### Root Cause
`CardNav.css` sets `.card-nav-container { z-index: var(--z-sticky); }` where `--z-sticky = 20`.
Inside that container, `.card-nav-logo-sidebar` and `.card-nav` are `position: relative; z-index: 1`
— this forms a **stacking context** at z-index 20.

The UserMenu is rendered inside `CardNav` via the `controls` prop, which lands inside `.card-nav-end`
inside `.card-nav-top` (inside `.card-nav`). The dropdown is `position: absolute; z-index: 100` —
but `100` is scoped within the stacking context of `.card-nav-container` (z-index 20), so it still
renders below any sibling element that also forms a stacking context at the page level.

Additionally, `.card-nav` has `overflow: hidden` during GSAP animation, which clips the dropdown.

### Fix Decision
Two-part CSS-only fix (no JS changes, no HTML restructuring):
1. Remove `overflow: hidden` from `.card-nav` when the dropdown is open — achieved by adding
   `overflow: visible` to `.card-nav` after GSAP finishes (or by giving `.user-menu__dropdown`
   `position: fixed` so it escapes the overflow clip entirely).
2. Elevate `.card-nav-container` stacking context so `.user-menu__dropdown`'s `z-index: 100`
   is resolved above everything else on the page. Since `--z-sticky = 20`, the simplest fix is
   to give `.user-menu` itself `position: relative; z-index: var(--z-overlay)` (= 40) which
   **still sits within the card-nav stacking context** but...

**Better fix** (avoids the overflow clip problem entirely): Change `.user-menu__dropdown` to
`position: fixed` with a high `z-index` (e.g. 200). Use JS/CSS to align it to the pill button's
bounding rect so it still visually appears below the pill. This is the pattern used by modern
design systems to escape clipping ancestors.

**Simplest safe fix**: Since the GSAP animation sets `overflow: hidden` on `navRef.current`
(`.card-nav`), not on `.card-nav-container`, the UserMenu lives in `.card-nav-end` which is
inside `.card-nav-top` (always visible, not clipped by the height animation). The overflow clip
on `.card-nav` starts at y=60px (COLLAPSED_HEIGHT), and `.card-nav-top` is exactly 60px tall —
so the dropdown is rendered at y>60 from the `.card-nav` top, placing it just outside the clip
rect at 60px height. 

**Confirmed fix**: Add `overflow: visible` to the `.card-nav-top` rule so the top-bar strip
(which contains the controls/UserMenu) never clips its children, AND raise `.user-menu`'s
stacking order above the `.card-nav-container` using isolation. Specifically:

```css
/* In CardNav.css — allow the top strip to overflow so dropdown escapes */
.card-nav-top {
  overflow: visible;
  position: relative;
  z-index: 10; /* above card-nav-content which has z-index 1 */
}
```

And in `components.css`:
```css
.user-menu__dropdown {
  z-index: 200; /* was 100 — must exceed card-nav-container's z-index: 20 within its parent */
}
```

Since `.card-nav-top` creates a stacking context relative to `.card-nav-container`, and
`.card-nav-container` has `z-index: var(--z-sticky)` (20) at the page level, the dropdown
at z-index 200 inside `.card-nav-top` will paint above everything else within that stacking
context, and the `overflow: visible` on `.card-nav-top` ensures it is not clipped by the
height animation on `.card-nav`.

**No new JS, no new component, no new token needed.**

---

## Story 2 — Court Card Player Names Split Into Individual Rows

### Current Implementation
`CourtGrid.tsx` renders each team as a single `<button className="team-grouping">` with
a `<span>{team1.join(" + ")}</span>` inside. When team has 2 players, names are concatenated
with " + ".

### Fix Decision
Split the single `<button>` into a wrapper `<div>` that acts as the click target, containing
two individual `<span>` (or `<div>`) elements — one per player name. Both react to the same
click/hover handlers. The wrapper div keeps `role="group"` or the button moves to wrap both.

**Implementation approach**: Change the `<button>` to a `<div>` that handles the click and
has `role="button"` / `aria-pressed`, containing a flex column of individual name elements.
Each name element gets a fixed `max-width` and `overflow: hidden; text-overflow: ellipsis`.

All name boxes across all courts must have **identical width** — achieved via a CSS custom
property or a fixed percentage of the court card width, not a per-match calculation.

The selection highlight (FR-007: tapping either player selects the whole team) is preserved
because both names share the same click handler pointing to the parent team side.

**No new npm packages. Pure CSS + minimal JSX restructuring inside CourtGrid.tsx.**

---

## Story 3 — Open Running Event in New Browser Window

### Current Implementation
`PreviewEvent.tsx` → `onStart()` calls `startEvent(eventId)` then `navigate(/events/${eventId}/run)`.

### Fix Decision
Replace `navigate(...)` with `window.open(url, '_blank')`. The `startEvent()` call happens
before the navigation so the event is already started. If `window.open()` returns `null` (popup
blocked), fall back to `navigate(...)` and optionally show an info notice.

**No backend changes needed.**

```ts
const newWin = window.open(`/events/${eventId}/run`, '_blank')
if (!newWin) {
  // fallback
  navigate(`/events/${eventId}/run`)
}
```

---

## Story 4 — Team Mexicano Mode

### Design Decision
Team Mexicano is NOT a new `EventType` enum value. It is a sub-mode flag on the event:
`is_team_mexicano: bool` stored as a new column on the `events` table, defaulting to `false`.

**Rationale**: All Mexicano infrastructure (scoring, round structure, DuckDB tables, result
types, summary logic) is reused. Only the partner-assignment algorithm changes. Adding a new
`EventType` would require duplicating routing, scoring, and summary code.

A new `event_teams` table stores the fixed pairs for Team Mexicano events. Each row links
two players to one event. These pairs are used by the scheduling algorithm instead of per-round
partner rotation.

New column on `events`: `is_team_mexicano BOOLEAN DEFAULT FALSE`
New table: `event_teams (id TEXT, event_id TEXT, player1_id TEXT, player2_id TEXT)`

Frontend: A toggle in the Mexicano stepper step, and a new "Assign Teams" step after the
player selection step (rendered only when `isTeamMexicano = true`). No new npm packages.

Odd-player blocking: `evaluate_setup()` in `EventService` gains a check — if `is_team_mexicano`
and `len(player_ids) % 2 != 0`, add `"team_mexicano_odd_players"` to `missing_requirements`.

Backend scheduling: `MexicanoService.generate_next_round()` receives `fixed_teams` list as
optional arg. When provided, partner assignment is skipped — each fixed pair stays together.

---

## Story 5 — Change Event Mode Before Starting

### Current Implementation
`update_event_setup()` in `EventService` already accepts `event_type` as an optional field
in `UpdateEventSetupRequest`. The PATCH `/events/{event_id}` endpoint already handles this.

### Gap
No lifecycle guard prevents mode changes on ongoing/finished events at the service layer —
the existing code will happily update `event_type` on a running event. The spec requires that
mode changes be blocked for `ongoing` or `finished` events.

Also, there is no UI affordance for changing the mode — the Edit Event stepper in
`CreateEvent.tsx` already shows the event type picker, so this story is mostly about:
1. Adding a lifecycle guard in `update_event_setup()` — raise `DomainError` if status is
   `Running` or `Finished`
2. Clearing mode-specific data (Team Mexicano `event_teams` rows) when mode changes away from
   Team Mexicano.

**No new endpoint, no new schema. Pure backend guard + frontend UX clarification.**

---

## Story 6 — Substitute Player Mid-Event

### Design Decision
New backend endpoint: `POST /events/{event_id}/substitute`  
Payload: `{ "departing_player_id": "...", "substitute_player_id": "..." }`

New table: `event_substitutions (id TEXT, event_id TEXT, departing_player_id TEXT, substitute_player_id TEXT, effective_from_round INT)`

The effective round is `current_round_number + 1` (substitution takes effect from the next round).

Mechanism:
- The departing player is replaced in `event_players` by the substitute.
- A substitution record is written to `event_substitutions`.
- When `next_round()` generates scheduling, it uses the current `event_players` list — which
  now contains the substitute in place of the departing player.
- Stats attribution: because match results are stored with player IDs and the substitution only
  affects future rounds, historical stats are automatically correct. The summary aggregates
  per player ID, so past rounds credit the departing player and future rounds credit the substitute.

No changes needed to the summary or result-recording logic.

Frontend: A "Substitute Player" button in `RunEvent.tsx` (visible when `lifecycleStatus === 'ongoing'`). Opens a modal with a player search combobox (existing `searchPlayers` API) and an optional "Create new player" inline form.

---

## Story 7 — Unlimited Mexicano Rounds

### Root Cause (confirmed)
`round_service.py` line 123-128:
```python
if current_round.round_number >= event.round_count:
    raise DomainError("EVENT_FINAL_ROUND_REACHED", ...)
```
`event.round_count` is set to `6` for Mexicano events at creation time (line 90 of `event_service.py`).

### Fix Decision
For Mexicano (and Team Mexicano), remove the `round_count` cap guard entirely. The guard is
needed for WinnersCourt and RankedBox where rounds are structural, but Mexicano is organiser-
controlled.

Change: in `next_round()`, skip the `EVENT_FINAL_ROUND_REACHED` check when `event_type == EventType.MEXICANO`.

Frontend: `RunEvent.tsx` computes `isFinalRound` as `roundData.roundNumber >= eventData.totalRounds`.
`totalRounds` comes from the backend `EventResponse.totalRounds`. 

Change: Always show both "Next Round" and "Finish" buttons for Mexicano events (regardless of
`isFinalRound`), and let them operate independently. The "Finish" button calls `finishEvent()`.

Note: `getRoundStepperProps` uses `totalRounds` to size the Stepper. For Mexicano with no cap,
return `null` (hide the stepper) or use a dynamic step count. Decision: **hide the stepper**
for Mexicano events (`totalRounds` can remain at the current `round_count = 6` in the DB for
backward compat, but the UI will ignore it when the event type is Mexicano).

---

## Story 8 — Mexicano Tiebreaker Hierarchy

### Current Implementation
`summary_ordering.py` — `order_final_rows()` for Mexicano sorts by:
`(-totals_by_player, displayName.lower(), playerId)` — no wins or best-match tiebreaker.

Same pattern in `order_progress_rows()`.

### Fix Decision
Extend both ordering methods for Mexicano to include:
1. `-wins_by_player[playerId]` (wins = matches where player's team scored > 12)
2. `-best_match_by_player[playerId]` (highest single-match score)

These values must be **derived from the match data** passed into the method. The caller
(`summary_service.py`) must pass wins and best-match maps.

`wins_by_player` and `best_match_by_player` are computed from completed Mexicano matches:
- A "win" for player P: `match.team1_score > 12` if P is on team1, or `match.team2_score > 12` if P is on team2.
- "best match" for player P: `max(match.team1_score if P on team1 else match.team2_score)` across all matches.

Both `order_final_rows` and `order_progress_rows` signatures gain two optional dicts:
`wins_by_player: dict[str, int] = None` and `best_match_by_player: dict[str, int] = None`.

The `_assign_competition_rank` method must also compare on all three keys to assign equal ranks
correctly (players equal on all three share a rank).

---

## Story 9 — Game Mode Documentation

### Decision
Three Markdown files committed to the repository under `docs/game-modes/`:
- `mexicano.md`
- `winners-court.md`
- `ranked-box.md`

No in-app rendering. No new routes. Plain language, non-technical audience.
Written as part of the implementation, committed to the feature branch.

---

## Technical Architecture Summary

| Story | Backend changes | Frontend changes | New DB tables/columns |
|-------|----------------|-----------------|----------------------|
| S1 UserMenu z-index | None | CardNav.css + components.css | None |
| S2 Player name split | None | CourtGrid.tsx + CSS | None |
| S3 Open in new window | None | PreviewEvent.tsx | None |
| S4 Team Mexicano | MexicanoService, EventService, new endpoints | CreateEvent stepper, lib/api.ts, lib/types.ts | `events.is_team_mexicano`, `event_teams` |
| S5 Mode change guard | EventService guard, update_event_setup | No new UI (Edit stepper already works) | None |
| S6 Player substitute | New endpoint + service method + repo | RunEvent modal + api.ts | `event_substitutions` |
| S7 Unlimited rounds | RoundService guard removal | RunEvent button logic | None |
| S8 Tiebreaker | summary_ordering.py | None (summary display already shows rank) | None |
| S9 Docs | None | None | None |
