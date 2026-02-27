# Tasks: Branding and Interaction Polish

**Input**: Design documents from `/specs/001-branding-interaction-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include frontend tests because the specification defines measurable UI behavior outcomes for branding, interaction states, accessibility, and reduced-motion handling.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable task (different files, no dependency on unfinished tasks)
- **[Story]**: Story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature documentation and verification scaffolding.

- [X] T001 Create implementation task checklist baseline in `specs/001-branding-interaction-polish/tasks.md`
- [X] T002 [P] Add verification placeholders in `specs/001-branding-interaction-polish/contracts/logo-button-contract.md`
- [X] T003 [P] Add verification placeholders in `specs/001-branding-interaction-polish/contracts/interactive-surface-contract.md`
- [X] T004 Add validation notes for hover/focus/mobile/reduced-motion checks in `specs/001-branding-interaction-polish/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish reusable interaction primitives and shared styling hooks used by all stories.

**⚠️ CRITICAL**: Complete this phase before user story implementation.

- [X] T005 Define shared interaction CSS variables and tokens in `frontend/src/styles/tokens.css`
- [X] T006 Add shared clickable edge/glow/proximity base classes in `frontend/src/styles/components.css`
- [X] T007 Add reduced-motion interaction fallback rules in `frontend/src/styles/motion.css`
- [X] T008 Add focus-visible and disabled-state guard rails for shared interactive surfaces in `frontend/src/styles/accessibility.css`
- [X] T009 Create reusable pointer-proximity state hook for clickable surfaces in `frontend/src/components/interaction/usePointerProximity.ts`

**Checkpoint**: Shared interaction primitives and accessibility-motion guard rails are ready.

---

## Phase 3: User Story 1 - Branded Logo Button (Priority: P1) 🎯 MVP

**Goal**: Replace the logo mark with the Molndal asset and ensure the circular logo button supports centered mark + optional responsive text.

**Independent Test**: Render app shell and verify logo button asset, centered mark alignment, and responsive text behavior (shown on larger viewport, hidden on small/mobile).

### Tests for User Story 1

- [X] T010 [P] [US1] Add logo asset and centered-mark rendering tests in `frontend/tests/logo-button-branding.test.tsx`
- [X] T011 [P] [US1] Add responsive logo-text visibility tests in `frontend/tests/logo-button-responsive-text.test.tsx`

### Implementation for User Story 1

- [X] T012 [US1] Update logo button markup and accessibility labels in `frontend/src/components/branding/LogoButton.tsx`
- [X] T013 [US1] Update app shell header composition for responsive logo text behavior in `frontend/src/app/AppShell.tsx`
- [X] T014 [US1] Add branded logo-button visual styles (circular container, centered mark, optional text region) in `frontend/src/styles/components.css`
- [X] T015 [US1] Add responsive logo-button layout adjustments for small/mobile breakpoints in `frontend/src/styles/layout.css`
- [X] T016 [US1] Validate logo asset path usage from `images/logos/Molndal-padel-bg-removed.png` in `frontend/src/components/branding/LogoButton.tsx`

**Checkpoint**: Branded logo button behavior is fully functional and independently testable.

---

## Phase 4: User Story 2 - Interactive Surface Language (Priority: P2)

**Goal**: Apply shared edge/glow/proximity interaction language to all clickable UI elements.

**Independent Test**: On hover-capable devices, clickable controls across menu/create/run/summary screens show consistent resting edge, hover glow, and pointer-proximity feedback.

### Tests for User Story 2

- [X] T017 [P] [US2] Add shared interactive-surface behavior tests in `frontend/tests/interactive-surface-pattern.test.tsx`
- [X] T018 [P] [US2] Add menu-card glow/proximity regression tests in `frontend/tests/magic-bento-menu-interactions.test.tsx`
- [X] T019 [P] [US2] Add cross-page clickable interaction regression tests in `frontend/tests/clickable-controls-interaction-regression.test.tsx`

### Implementation for User Story 2

- [X] T020 [US2] Apply shared interactive-surface classes to home menu cards in `frontend/src/components/bento/MagicBentoMenu.tsx`
- [X] T021 [US2] Apply shared interactive-surface classes to logo button in `frontend/src/components/branding/LogoButton.tsx`
- [X] T022 [US2] Apply shared interactive-surface classes to run-event court/team controls in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T023 [US2] Apply shared interactive-surface classes to player selection controls in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T024 [US2] Apply shared interactive-surface classes to create-event and run-event page actions in `frontend/src/pages/CreateEvent.tsx`
- [X] T025 [US2] Apply shared interactive-surface classes to run-event actions and result controls in `frontend/src/pages/RunEvent.tsx`
- [X] T026 [US2] Apply shared interactive-surface classes to summary navigation/actions in `frontend/src/pages/Summary.tsx`
- [X] T027 [US2] Extend shared styling for app-wide clickable controls and states in `frontend/src/styles/components.css`

**Checkpoint**: Shared interaction language is consistently applied across clickable controls.

---

## Phase 5: User Story 3 - Accessible and Mobile-Safe Interaction (Priority: P3)

**Goal**: Ensure interaction polish remains accessible for keyboard users, touch users, disabled states, and reduced-motion preferences.

**Independent Test**: Verify focus-visible clarity, disabled static behavior, mobile usability without hover, and reduced-motion animation suppression.

### Tests for User Story 3

- [X] T028 [P] [US3] Add keyboard focus-visible interaction tests in `frontend/tests/interaction-accessibility.test.tsx`
- [X] T029 [P] [US3] Add disabled control no-hover/no-proximity tests in `frontend/tests/interaction-disabled-state.test.tsx`
- [X] T030 [P] [US3] Add reduced-motion interaction fallback tests in `frontend/tests/reduced-motion-interaction.test.tsx`
- [X] T031 [P] [US3] Add mobile/touch non-hover usability tests in `frontend/tests/interaction-mobile-fallback.test.tsx`

### Implementation for User Story 3

- [X] T032 [US3] Enforce focus-visible cues for interactive surfaces in `frontend/src/styles/accessibility.css`
- [X] T033 [US3] Enforce disabled static interaction behavior in `frontend/src/styles/components.css`
- [X] T034 [US3] Enforce reduced-motion suppression of animated proximity behavior in `frontend/src/styles/motion.css`
- [X] T035 [US3] Tune mobile/touch interaction readability and target sizing in `frontend/src/styles/layout.css`

**Checkpoint**: Accessibility and mobile behavior remain robust with interaction polish enabled.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, evidence capture, and regression validation across all stories.

- [X] T036 [P] Record logo-button contract verification evidence in `specs/001-branding-interaction-polish/contracts/logo-button-contract.md`
- [X] T037 [P] Record interactive-surface contract verification evidence in `specs/001-branding-interaction-polish/contracts/interactive-surface-contract.md`
- [X] T038 Run frontend validation commands and capture outputs in `specs/001-branding-interaction-polish/quickstart.md`
- [X] T039 Execute manual hover/focus/mobile/reduced-motion walkthrough notes in `specs/001-branding-interaction-polish/quickstart.md`
- [X] T040 Update agent context notes if implementation introduces additional frontend interaction primitives in `AGENTS.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Setup; blocks all user stories.
- **Phase 3 (US1)**: depends on Foundational; delivers MVP branding outcome.
- **Phase 4 (US2)**: depends on Foundational and builds on US1 logo button pattern.
- **Phase 5 (US3)**: depends on Foundational; validates accessibility/mobile/reduced-motion across US1+US2 behavior.
- **Phase 6 (Polish)**: depends on completion of targeted stories.

### User Story Dependencies

- **US1 (P1)**: independent after Foundational and is the MVP slice.
- **US2 (P2)**: depends on shared primitives and benefits from US1 logo component baseline.
- **US3 (P3)**: depends on interaction surfaces from US2 to validate accessibility and motion policies comprehensively.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Update component markup/class hooks before final style tuning.
- Validate independent story criteria before advancing.

### Parallel Opportunities

- Setup placeholders T002 and T003 can run in parallel.
- Foundational style files T007 and T008 can run in parallel after T005/T006.
- US1 tests T010 and T011 can run in parallel.
- US2 tests T017-T019 can run in parallel.
- US3 tests T028-T031 can run in parallel.
- Polish evidence tasks T036 and T037 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] Add logo asset and centering tests in frontend/tests/logo-button-branding.test.tsx"
Task: "T011 [US1] Add responsive logo-text tests in frontend/tests/logo-button-responsive-text.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T017 [US2] Add shared interactive-surface tests in frontend/tests/interactive-surface-pattern.test.tsx"
Task: "T018 [US2] Add menu-card interaction tests in frontend/tests/magic-bento-menu-interactions.test.tsx"
Task: "T019 [US2] Add cross-page clickable regression tests in frontend/tests/clickable-controls-interaction-regression.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T028 [US3] Add focus-visible tests in frontend/tests/interaction-accessibility.test.tsx"
Task: "T030 [US3] Add reduced-motion tests in frontend/tests/reduced-motion-interaction.test.tsx"
Task: "T031 [US3] Add mobile/touch interaction tests in frontend/tests/interaction-mobile-fallback.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Deliver branded logo-button behavior (US1).
3. Validate US1 independently on desktop and mobile viewport.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Deliver US1 (logo branding baseline).
3. Deliver US2 (all-clickable interaction language rollout).
4. Deliver US3 (accessibility/mobile/reduced-motion hardening).
5. Finalize with evidence capture and full frontend validation.

### Parallel Team Strategy

1. Team aligns on shared interaction primitives in Phase 2.
2. Parallel split after foundation:
   - Developer A: logo/button branding (US1)
   - Developer B: clickable-surface rollout (US2)
   - Developer C: accessibility/motion/mobile validation (US3)
3. Integrate and run full polish validations.

---

## Notes

- Every task follows the required checklist format with ID, markers, and exact path.
- Tasks are story-grouped for independent implementation and validation.
- The generated sequence intentionally prioritizes branding MVP before app-wide interaction rollout.
