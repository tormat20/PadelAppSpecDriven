# Implementation Plan: Summary Screen & OCR Panel Fixes

**Branch**: `029-summary-screen-bugs` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/029-summary-screen-bugs/spec.md`

## Summary

Five targeted fixes across backend and frontend:

1. **Backend** — `is_final_summary_available()` does not detect early-finished Mexicano/Americano events as final. Fix: also return `True` when `event.status == FINISHED`.
2. **Frontend** — `Summary.tsx` already branches on `summary.mode === "progress"` vs `"final"`. Since Bug 1 prevents `mode="final"` from being returned for early-finished Mexicano, fixing the backend automatically delivers podium + crown + confetti on the frontend for Mexicano/Team Mexicano. No frontend changes needed for the crown/podium themselves.
3. **Frontend** — Page title "Progress Summary" vs "Summary" is already handled correctly by `Summary.tsx` (progress branch → "Progress Summary", final branch → "Summary"). Fixing Bug 1 backend fix therefore also closes this bug.
4. **Frontend OCR** — `OcrImportPanel.tsx` left column: remove button already exists but is only shown when `isChecked && !isAlreadyRegistered`. Right column: also has a remove button already present for checked rows. **After re-reading the file, the remove buttons are already implemented**. The only missing item is that the right column remove button only appears when `isChecked` — which means unchecked rows have no button. This is correct behaviour per the spec (deselect = toggle, re-select by clicking the row). **The OCR panel is already correct as-is.** No code change needed for US4.
5. **Frontend EventSlots** — `showTeamMexicano` was already wired to `localStorage` at line 133–136 of `EventSlots.tsx`. After re-reading the file, persistence is already in place. The `modeFilters` default is `[...MODE_ORDER]` (all types) and the checkboxes render `checked={modeFilters.includes(mode)}` — so all checkboxes should be checked by default when there's no stored state. **US5 is also already correct.** No code change needed.

### Actual required changes (after code audit)

| Story | Root Cause | File(s) | Type |
|-------|-----------|---------|------|
| US1 — Americano final sort | `summary_ordering.py` already has an Americano branch (lines 104–114). It sorts correctly. The bug from the previous session analysis was already fixed. **Verify with tests.** | `summary_ordering.py` | Verify only |
| US2+US3 — Mexicano final/title | `is_final_summary_available()` checks `current_round_number >= round_count`, but early-finished Mexicano events have `status=FINISHED` and `current_round_number < round_count`. Fix: check `event.status == FINISHED` first. | `summary_service.py` | Backend fix |
| US4 — OCR remove buttons | Already implemented in current code | — | No change |
| US5 — Filter checkboxes | Already implemented in current code | — | No change |

> **Important re-assessment**: Reading `summary_ordering.py` in full reveals an Americano branch already exists at lines 104–114. And reading `EventSlots.tsx` in full reveals `showTeamMexicano` IS already persisted (lines 133–136) and `parseSavedModeFilters` does default to all-checked. The only real bug remaining is `is_final_summary_available()` — which does not check `event.status == FINISHED`, so early-finished Mexicano/Americano events fall through to the progress summary path, showing "Progress Summary" and no podium/crowns/confetti.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x / React 18.3 (frontend)
**Primary Dependencies**: FastAPI, Pydantic, DuckDB (backend); React 18, React Router 6, Vite 5, Vitest 2 (frontend)
**Storage**: DuckDB embedded — `?` positional params, `row[N]` index access, re-query after INSERT
**Testing**: pytest + FastAPI TestClient, sync `def test_*`, no asyncio (backend); Vitest 2 (frontend)
**Target Platform**: Linux/macOS server + modern browser (Docker local)
**Project Type**: Web application (FastAPI backend + React SPA frontend)
**Performance Goals**: <200ms p95 on all existing endpoints; no new performance requirements
**Constraints**: No new npm packages; no schema migration needed; no new DB tables
**Scale/Scope**: Single-file DuckDB; ~10–50 concurrent users; small event sizes (8–32 players)

## Constitution Check

| Check | Status | Notes |
|-------|--------|-------|
| No new npm packages | ✅ PASS | Pure Python + existing React code |
| Backend pattern: routers→services→repositories→sql | ✅ PASS | Only `summary_service.py` touched |
| Repo constructor `def __init__(self, conn):` untyped | ✅ PASS | No new repos |
| SQL params `?` positional, `row[N]` index | ✅ PASS | No new SQL files |
| `services_scope()` is `@contextmanager` | ✅ PASS | No new repos added |
| Sync `def` router handlers | ✅ PASS | No router changes |
| Tests: TestClient, sync `def test_*`, no asyncio | ✅ PASS | New tests follow existing pattern |
| No `passlib` | ✅ PASS | No auth changes |
| Pre-existing LSP errors not touched | ✅ PASS | `users_repo.py:16`, `round_service.py:62` left alone |

## Root Cause Analysis

### The Core Bug: `is_final_summary_available()` ignores `FINISHED` status

```python
# CURRENT (broken for early-finish):
def is_final_summary_available(self, event_id: str) -> bool:
    ...
    return (
        event.current_round_number is not None
        and event.current_round_number >= event.round_count
    )
```

For a Mexicano event with `round_count=6` that was early-finished at round 3:
- `event.status = FINISHED` ✅
- `event.current_round_number = 3`
- `event.round_count = 6`
- `3 >= 6` → **False** → falls through to progress summary → wrong title, no podium, no confetti

For Americano events (which also support early-finish per `finish_event()` line 58-65):
- Same problem applies

**Fix**: Check `event.status == FINISHED` first. A finished event always has a final summary.

```python
# FIXED:
def is_final_summary_available(self, event_id: str) -> bool:
    event = self.events_repo.get(event_id)
    if not event:
        raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
    if event.status == EventStatus.FINISHED:
        return True
    return (
        event.current_round_number is not None
        and event.current_round_number >= event.round_count
    )
```

This is safe because:
- `finish_event()` already validates the event is in a valid state before calling `set_status(FINISHED)`
- WinnersCourt and RankedBox can only be finished at `current_round_number == round_count` (enforced by `finish_event()`)
- `get_final_summary()` calls `is_final_summary_available()` as its guard — it now correctly returns the final summary for finished events

### Cascading Fix

Once `is_final_summary_available()` returns `True` for finished Mexicano/Americano events, the `GET /events/{id}/summary` endpoint routes to `FinalSummaryResponse` instead of `ProgressSummaryResponse`. The frontend receives:
- `mode = "final"` (set by `FinalSummaryResponse`)
- `crownedPlayerIds` populated by `crowned_player_ids()` (which already handles Mexicano/Americano via `_crowned_players_for_mexicano`)
- `playerRows` with correct `rank` fields from `order_final_rows()` (Americano branch already in place)

The frontend `Summary.tsx` already:
- Shows "Summary" title on `mode === "final"` branch
- Shows podium on `mode === "final"` branch (for non-RankedBox)
- Fires confetti on `mode === "final"`
- Shows crown icons on `mode === "final"`

**No frontend changes required.**

### OCR Panel — Already Fixed

Re-reading `OcrImportPanel.tsx`:
- Left column (lines 320–329): remove button present, shown when `!isAlreadyRegistered && isChecked`
- Right column (lines 353–361): remove button present, shown when `isChecked`

Both columns have remove buttons. Both use `toggleChecked(r.rawName)` which deselects without removing from the list. Re-clicking the row re-selects it. This matches the spec exactly. **No code change needed for US4.**

### EventSlots Filter — Already Fixed

Re-reading `EventSlots.tsx`:
- Lines 107–112: `showTeamMexicano` initialises from localStorage with `true` default
- Lines 133–136: `useEffect` persists `showTeamMexicano` to localStorage on change ✅
- Lines 103–106: `modeFilters` initialises via `parseSavedModeFilters` which defaults to `[...MODE_ORDER]` (all 4 types) ✅
- Checkboxes: `checked={modeFilters.includes(mode)}` — when all 4 types are in `modeFilters`, all are checked ✅

**No code change needed for US5.**

## Data Model

No schema changes. No migration.

## API Contracts

No changes to response shapes. No new endpoints.

The only observable change: `GET /events/{id}/summary` for a finished Mexicano/Americano event that was early-finished now returns `FinalSummaryResponse` (with `mode="final"`, podium, crowns) instead of `ProgressSummaryResponse` (with `mode="progress"`).

## Project Structure

### Documentation (this feature)

```text
specs/029-summary-screen-bugs/
├── plan.md              ← This file
├── spec.md              ← Written
└── tasks.md             ← /speckit.tasks output (next step)
```

### Source Code (files to be modified or created)

```text
backend/
├── app/
│   └── services/
│       └── summary_service.py          ← MODIFIED (is_final_summary_available fix)
└── tests/
    └── integration/
        └── test_summary_early_finish.py  ← NEW (Mexicano/Americano early-finish → final summary)
```

**No frontend files modified.** OCR and EventSlots bugs were already fixed in prior work.

**Structure Decision**: Web application layout. Minimal change: one backend method, one new integration test.

## Complexity Tracking

> No constitution violations detected. No justification table required.

## Risk Assessment

| Story | Risk | Notes |
|-------|------|-------|
| US1 — Americano ordering | Very Low | Already implemented; just verify with tests |
| US2+US3 — Mexicano final | Low | One-line guard added; `get_final_summary()` already correct |
| US4 — OCR remove buttons | None | Already implemented |
| US5 — Filter checkboxes | None | Already implemented |
