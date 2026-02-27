# Tasks: Navigation Shell, Prism Background, and Final Winner Crowns

**Input**: Design documents from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/010-nav-prism-crowns/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include backend and frontend tests because the spec explicitly requires automated coverage for crown rules and shell/background behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared dependencies and scaffolding used by all stories.

- [X] T001 Add prism rendering dependency to frontend dependencies in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/package.json`
- [X] T002 Install and lock frontend dependencies for prism rendering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/package-lock.json`
- [X] T003 [P] Add reusable crown icon helper/constants for summary UI in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/summary/crownWinners.ts`
- [X] T004 [P] Add reusable prism component stylesheet scaffold in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/backgrounds/Prism.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared contract/data-path changes required before story implementation.

**⚠️ CRITICAL**: Complete this phase before starting user stories.

- [X] T005 Extend final summary API schema with `crownedPlayerIds` in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/api/schemas/summary.py`
- [X] T006 Add crown winner resolution logic for Mexicano/Americano/BeatTheBox in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/services/summary_service.py`
- [X] T007 Wire `crownedPlayerIds` into finish/summary endpoints in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/app/api/routers/events.py`
- [X] T008 Update frontend summary response types to include `crownedPlayerIds` in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/lib/types.ts`
- [X] T009 Update frontend summary normalization/parsing for `crownedPlayerIds` in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/lib/api.ts`

**Checkpoint**: Shared API contract and frontend typing are ready for independent story work.

---

## Phase 3: User Story 1 - Recognize final winners instantly (Priority: P1) 🎯 MVP

**Goal**: Show crown icons next to final-summary winners using mode-specific rules and no crowns on progress summaries.

**Independent Test**: Complete an event and open summary; validate crowns for Mexicano ties and Americano final highest-court winners, and confirm zero crowns on progress/BeatTheBox.

### Tests for User Story 1

- [X] T010 [P] [US1] Add backend contract test for `crownedPlayerIds` payload in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/contract/test_summary_crowned_players_api.py`
- [X] T011 [P] [US1] Add backend integration test for Americano highest-court winner crown resolution in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests/integration/test_americano_crown_resolution.py`
- [X] T012 [P] [US1] Add frontend summary crown rendering test coverage in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/summary-crown-rendering.test.tsx`

### Implementation for User Story 1

- [X] T013 [US1] Implement crown winner selectors/utilities in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/summary/crownWinners.ts`
- [X] T014 [US1] Render crown icons beside crowned names in final summary table in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`
- [X] T015 [US1] Add crown icon styling and alignment for summary rows in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`
- [X] T016 [US1] Add crown icon asset usage and fallback behavior in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`
- [X] T017 [US1] Verify progress-summary path suppresses crowns in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`

**Checkpoint**: User Story 1 is independently functional and testable as MVP.

---

## Phase 4: User Story 2 - Use a cleaner branded header shell (Priority: P2)

**Goal**: Introduce full-width top nav shell and logo-only centered home button while preserving accessibility.

**Independent Test**: On any route, verify full-width top nav, centered image-only logo button, and unchanged keyboard/pointer navigation behavior.

### Tests for User Story 2

- [X] T018 [P] [US2] Add app-shell top-nav presence and structure tests in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/app-shell-top-nav.test.tsx`
- [X] T019 [P] [US2] Add logo-only button and centered-mark behavior tests in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/logo-button-centered-image.test.tsx`

### Implementation for User Story 2

- [X] T020 [US2] Add full-width top nav container structure in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/app/AppShell.tsx`
- [X] T021 [US2] Update logo button to image-only presentation with no text in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/branding/LogoButton.tsx`
- [X] T022 [US2] Implement top-nav full-width layout styles in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/layout.css`
- [X] T023 [US2] Implement centered circular logo button styles in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`
- [X] T024 [US2] Preserve logo button focus-visible and keyboard affordances in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/accessibility.css`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Experience a consistent global background refresh (Priority: P3)

**Goal**: Replace static light-rays with provided prism background globally with reduced-motion-safe behavior.

**Independent Test**: Navigate multiple routes and confirm prism background is global, non-blocking, and reduced-motion compliant.

### Tests for User Story 3

- [X] T025 [P] [US3] Add global prism background rendering test in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/prism-background-global.test.tsx`
- [X] T026 [P] [US3] Add reduced-motion prism behavior test in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/prism-background-reduced-motion.test.tsx`

### Implementation for User Story 3

- [X] T027 [US3] Implement provided prism component behavior in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/backgrounds/Prism.tsx`
- [X] T028 [US3] Add prism container styles and non-intercepting layer behavior in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/backgrounds/Prism.css`
- [X] T029 [US3] Replace light-rays background usage with prism in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/app/AppShell.tsx`
- [X] T030 [US3] Retire static light-rays component implementation in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/backgrounds/LightRaysBackground.tsx`
- [X] T031 [US3] Update global background and motion styles for prism layering in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/motion.css`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration checks and cross-story quality gates.

- [X] T032 [P] Update/verify feature quickstart steps and execution notes in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/010-nav-prism-crowns/quickstart.md`
- [X] T033 Run frontend verification suite (`npm run lint && npm run test`) from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/package.json`
- [X] T034 Run backend verification suite (`pytest backend/tests/contract backend/tests/integration`) from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/backend/tests`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice.
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with US1 after foundation, but recommended after MVP.
- **Phase 5 (US3)**: Depends on Phase 2; can run in parallel with US2 after foundation.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational API/type setup.
- **US2 (P2)**: Independent after foundational setup; no hard dependency on US1.
- **US3 (P3)**: Independent after foundational setup; integrates in app shell alongside US2 changes.

### Recommended Story Order

1. US1 (MVP winner crowns)
2. US2 (nav shell + logo-only branding)
3. US3 (global prism background)

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel test authoring
T010 backend/tests/contract/test_summary_crowned_players_api.py
T011 backend/tests/integration/test_americano_crown_resolution.py
T012 frontend/tests/summary-crown-rendering.test.tsx
```

### User Story 2

```bash
# Parallel test authoring
T018 frontend/tests/app-shell-top-nav.test.tsx
T019 frontend/tests/logo-button-centered-image.test.tsx
```

### User Story 3

```bash
# Parallel test authoring
T025 frontend/tests/prism-background-global.test.tsx
T026 frontend/tests/prism-background-reduced-motion.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate crown behavior independently on final/progress summaries.
4. Demo/deploy MVP once US1 passes.

### Incremental Delivery

1. Foundation ready (Phases 1-2).
2. Deliver US1 (winner crowns).
3. Deliver US2 (top nav + logo-only button).
4. Deliver US3 (global prism background).
5. Finish with Phase 6 verification.

### Parallel Team Strategy

1. One developer completes backend crown contract tasks (T005-T007) while another completes frontend type/parsing tasks (T008-T009) after setup.
2. After Phase 2, assign US1, US2, and US3 to separate developers.
3. Rejoin for cross-cutting verification in Phase 6.
