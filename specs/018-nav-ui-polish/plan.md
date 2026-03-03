# Implementation Plan: Navigation & UI Polish

**Branch**: `018-nav-ui-polish` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-nav-ui-polish/spec.md`

---

## Summary

Four independent UI polish changes to the Padel Host App frontend:

1. **Create Event — Main Menu button** moved from the page header into each step's action button row, so navigation controls are grouped with step progression controls.
2. **Run Event — round-progress stepper** added below the page heading, reusing the existing `Stepper` component. Steps = total rounds; active step = current round; read-only (no click handler).
3. **Home page cleanup** — the event-slots panel (list + filter/sort controls) is removed from the home page. A new `/events` route hosts the full event-slots view. The "Resume Event" bento card is renamed "View Events" and links to `/events`.
4. **Register Player page** — a new `/players/register` page is created. The "Player Setup" bento card is renamed "Register Player" and links to it. The page allows entering a display name and saving to the player catalog with success/error feedback.

No backend changes required. All four changes are purely frontend.

---

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3
**Primary Dependencies**: React Router DOM 6, Vite 5, Vitest 2, `motion` (already installed)
**Storage**: No new persistence — player creation uses the existing `POST /api/v1/players` endpoint via `createPlayer()` in `lib/api.ts`; event-slot view state (filter, sort, mode blobs) continues to use `localStorage` under existing keys
**Testing**: Vitest 2 — pure unit tests exporting helper functions; no DOM rendering / React Testing Library
**Target Platform**: Web app (desktop + mobile browser); hosted SPA served by Vite dev server / static build
**Project Type**: Web application — frontend only for this feature
**Performance Goals**: No new performance requirements; all changes are layout/routing adjustments
**Constraints**: Must not break any of the 158 existing passing tests; TypeScript must compile with zero errors; CSS must use design tokens (`var(--color-*)`) not hardcoded hex values (except the existing `.button` gradient); no new npm packages required
**Scale/Scope**: 4 pages/components touched (CreateEvent, RunEvent, Home, MagicBentoMenu); 1 new page (RegisterPlayer); 1 new route (`/events`); 1 new route (`/players/register`)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains only a blank template — no project-specific principles are defined. The following conventions have been inferred from the existing codebase and all previous feature plans (017, 016, etc.):

| Inferred Convention | Status | Notes |
|---|---|---|
| Pure-function exports for unit-testable logic | ✅ PASS | All new helper functions will be exported and tested independently |
| CSS design tokens — no hardcoded colours | ✅ PASS | All new CSS will use `var(--color-*)` tokens; only the existing gradient exception retained |
| No new npm packages | ✅ PASS | `Stepper` component already exists; `createPlayer` API already exists |
| No backend changes | ✅ PASS | All 4 user stories are purely frontend |
| TypeScript strict compliance | ✅ PASS | All new code typed; no `any` except where existing codebase already uses it |
| Vitest unit-test pattern | ✅ PASS | New test files follow the project's pure-export + unit-test pattern |
| Existing tests must not regress | ✅ PASS | `home-event-slots-status-layout.test.tsx` imports helpers from `Home.tsx` — those helpers will remain exportable from their new location |

**No gate violations. Proceeding to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/018-nav-ui-polish/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── create-event-main-menu.md
│   ├── run-event-round-stepper.md
│   ├── home-view-events.md
│   └── register-player-page.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── CreateEvent.tsx          ← MODIFIED: Main Menu moved from header to step panels
│   │   ├── RunEvent.tsx             ← MODIFIED: round-progress Stepper added below heading
│   │   ├── Home.tsx                 ← MODIFIED: event-slots panel removed; helpers stay exported
│   │   ├── EventSlots.tsx           ← NEW: dedicated event-slots page (moved from Home.tsx)
│   │   └── RegisterPlayer.tsx       ← NEW: /players/register page
│   ├── components/
│   │   └── bento/
│   │       └── MagicBentoMenu.tsx   ← MODIFIED: card labels + routes updated
│   └── app/
│       └── routes.tsx               ← MODIFIED: /events and /players/register routes added
└── tests/
    ├── create-event-main-menu.test.tsx        ← NEW
    ├── run-event-round-stepper.test.tsx       ← NEW
    ├── home-view-events-nav.test.tsx          ← NEW
    ├── register-player-page.test.tsx          ← NEW
    ├── magic-bento-menu-interactions.test.tsx ← UPDATED (card labels)
    └── home-event-slots-status-layout.test.tsx ← UPDATED (import source may change)
```

**Structure Decision**: Web application — Option 2 (frontend only for this feature). No backend files touched. The event-slots logic (helpers, state, JSX) moves from `Home.tsx` into a new `EventSlots.tsx` page component; helper functions remain exported under the same names so existing tests continue to pass with only an import-path update.

---

## Complexity Tracking

No constitution violations to justify.
