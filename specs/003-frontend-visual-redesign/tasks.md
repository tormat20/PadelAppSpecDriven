# Tasks: Frontend Visual Redesign

**Input**: Design documents from `/specs/001-frontend-visual-redesign/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Keep existing automated checks passing and add targeted regression coverage for redesigned workflows where UI structure changes could break existing guarantees.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare styling and validation scaffolding for incremental redesign.

- [X] T001 Create feature style directory scaffold in `frontend/src/styles/` with placeholder files for tokens, layout, components, motion, and accessibility
- [X] T002 Add global style entry imports for new style layers in `frontend/src/main.tsx`
- [X] T003 [P] Create manual QA checklist template for browser/performance/a11y/reduced-motion gates in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`
- [X] T004 [P] Document baseline before/after capture steps for visual parity in `specs/001-frontend-visual-redesign/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the shared visual system that blocks all story work.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T005 Define semantic design tokens (color, typography, spacing, radius, layers) in `frontend/src/styles/tokens.css`
- [X] T006 Define application layout primitives and responsive container rules in `frontend/src/styles/layout.css`
- [X] T007 Define shared control/panel/surface component classes in `frontend/src/styles/components.css`
- [X] T008 Define motion tokens and transition utility classes in `frontend/src/styles/motion.css`
- [X] T009 Define focus, contrast, and reduced-motion fallback rules in `frontend/src/styles/accessibility.css`
- [X] T010 Refactor app shell structure to consume shared classes and stable layering in `frontend/src/app/AppShell.tsx`
- [X] T011 Align global reset/base body treatment with new visual foundation in `frontend/src/index.css`

**Checkpoint**: Foundation ready - user story phases can begin.

---

## Phase 3: User Story 1 - Run event operations in a cleaner interface (Priority: P1) 🎯 MVP

**Goal**: Redesign live run workflow presentation while preserving result-entry and next-round behavior.

**Independent Test**: Start from an existing event, complete one live round in redesigned run UI, and verify unchanged scoring and round progression outcomes.

### Implementation for User Story 1

- [X] T012 [US1] Restructure live run page layout sections and semantic landmarks in `frontend/src/pages/RunEvent.tsx`
- [X] T013 [P] [US1] Redesign result input states and status feedback visuals in `frontend/src/components/matches/ResultEntry.tsx`
- [X] T014 [P] [US1] Redesign court board card and team label presentation in `frontend/src/components/courts/CourtGrid.tsx`
- [X] T015 [US1] Apply run-view specific styling hooks and class names in `frontend/src/pages/RunEvent.tsx`
- [X] T016 [P] [US1] Add run workflow page/component style rules in `frontend/src/styles/components.css`
- [X] T017 [US1] Ensure reduced-motion safe transition behavior on run interactions in `frontend/src/styles/motion.css`
- [X] T018 [US1] Update run workflow regression test expectations in `frontend/tests/result-entry.test.tsx`
- [X] T019 [US1] Add run page route smoke test for unchanged controls and actions in `frontend/tests/run-event-page.test.tsx`

**Checkpoint**: User Story 1 is visually redesigned and independently testable with behavior parity.

---

## Phase 4: User Story 2 - Create and configure events with improved readability (Priority: P2)

**Goal**: Redesign create-event setup flow UI without changing validation rules or creation semantics.

**Independent Test**: Create a new event from the redesigned setup page and verify constraints and resulting event creation behavior are unchanged.

### Implementation for User Story 2

- [X] T020 [US2] Redesign create-event page structure and section hierarchy in `frontend/src/pages/CreateEvent.tsx`
- [X] T021 [P] [US2] Redesign mode selector visuals with unchanged selection behavior in `frontend/src/components/mode/ModeAccordion.tsx`
- [X] T022 [P] [US2] Redesign player selection panel visuals and chip states in `frontend/src/components/players/PlayerSelector.tsx`
- [X] T023 [P] [US2] Redesign court selection card/chip visuals with current constraints intact in `frontend/src/components/courts/CourtSelector.tsx`
- [X] T024 [US2] Add create workflow style rules and validation-state visuals in `frontend/src/styles/components.css`
- [X] T025 [US2] Update court selection regression tests for redesigned markup in `frontend/tests/court-grid.test.tsx`
- [X] T026 [US2] Add create-event interaction regression test for required-field and submit enablement behavior in `frontend/tests/create-event-page.test.tsx`

**Checkpoint**: User Story 2 is independently testable and preserves event setup behavior.

---

## Phase 5: User Story 3 - Navigate all primary pages with consistent visual language (Priority: P3)

**Goal**: Apply cohesive visual system across Home, Preview, and Summary pages plus shared navigation/branding elements.

**Independent Test**: Navigate all primary routes on desktop/mobile viewport sizes and verify consistent design patterns with no blocked actions.

### Implementation for User Story 3

- [X] T027 [US3] Redesign home page visual hierarchy and mode entry presentation in `frontend/src/pages/Home.tsx`
- [X] T028 [P] [US3] Redesign preview page layout and information grouping in `frontend/src/pages/PreviewEvent.tsx`
- [X] T029 [P] [US3] Redesign summary page layout and ranking presentation in `frontend/src/pages/Summary.tsx`
- [X] T030 [P] [US3] Refresh branding component styling hooks for shell consistency in `frontend/src/components/branding/LogoButton.tsx`
- [X] T031 [P] [US3] Update background component layering and fallback behavior in `frontend/src/components/backgrounds/LightRaysBackground.tsx`
- [X] T032 [US3] Align route shell spacing and content frame behavior across pages in `frontend/src/app/AppShell.tsx`
- [X] T033 [US3] Add router-level navigation consistency smoke test in `frontend/src/app/router.smoke.test.tsx`

**Checkpoint**: All primary pages share a consistent visual language and remain independently usable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize quality gates across all stories.

- [X] T034 [P] Normalize shared component class naming and remove obsolete style rules in `frontend/src/styles/components.css`
- [X] T035 [P] Finalize WCAG 2.1 AA focus/contrast refinements across global styles in `frontend/src/styles/accessibility.css`
- [X] T036 Run frontend automated validation (`npm run lint` and `npm run test`) from `frontend/package.json` scripts and record results in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`
- [ ] T037 Execute cross-browser and responsive manual checks and record pass/fail evidence in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`
- [ ] T038 Validate reduced-motion behavior and performance targets and record measurements in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`
- [X] T039 Confirm UI workflow contract invariants and non-regression outcomes in `specs/001-frontend-visual-redesign/contracts/ui-workflow-contract.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all story phases.
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice.
- **Phase 4 (US2)**: Depends on Phase 2; can run parallel to US1 if staffed.
- **Phase 5 (US3)**: Depends on Phase 2; can run parallel to US1/US2 if staffed.
- **Phase 6 (Polish)**: Depends on completion of selected story phases.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational completion.
- **US2 (P2)**: Independent after foundational completion; must preserve existing setup constraints.
- **US3 (P3)**: Independent after foundational completion; validates cross-page consistency.

### Within Each User Story

- Page and component structure updates before story-specific style hardening.
- Story-specific tests run after implementation updates and before story checkpoint.
- Each story must satisfy its independent test criterion before moving on.

### Parallel Opportunities

- Setup: T003 and T004 can run in parallel.
- Foundational: T006, T007, T008, T009 can run in parallel after T005 starts token definitions.
- US1: T013, T014, and T016 can run in parallel after T012.
- US2: T021, T022, and T023 can run in parallel after T020.
- US3: T028, T029, T030, and T031 can run in parallel after baseline shell alignment starts.
- Polish: T034 and T035 can run in parallel before validation tasks.

---

## Parallel Example: User Story 1

```bash
# After T012, run independent UI updates concurrently:
Task: "T013 [US1] Redesign result input states in frontend/src/components/matches/ResultEntry.tsx"
Task: "T014 [US1] Redesign court board visuals in frontend/src/components/courts/CourtGrid.tsx"
Task: "T016 [US1] Add run workflow styles in frontend/src/styles/components.css"
```

## Parallel Example: User Story 2

```bash
# After T020, execute setup component restyles concurrently:
Task: "T021 [US2] Redesign mode selector in frontend/src/components/mode/ModeAccordion.tsx"
Task: "T022 [US2] Redesign player selector in frontend/src/components/players/PlayerSelector.tsx"
Task: "T023 [US2] Redesign court selector in frontend/src/components/courts/CourtSelector.tsx"
```

## Parallel Example: User Story 3

```bash
# Once cross-page consistency work begins, parallelize page restyles:
Task: "T028 [US3] Redesign preview page in frontend/src/pages/PreviewEvent.tsx"
Task: "T029 [US3] Redesign summary page in frontend/src/pages/Summary.tsx"
Task: "T030 [US3] Refresh branding component in frontend/src/components/branding/LogoButton.tsx"
Task: "T031 [US3] Update background layering in frontend/src/components/backgrounds/LightRaysBackground.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) and run story-specific checks.
3. Validate run-event parity before expanding scope.

### Incremental Delivery

1. Foundation (Phases 1-2) establishes stable design system.
2. Deliver US1 (run workflow), validate, and demo.
3. Deliver US2 (create workflow), validate, and demo.
4. Deliver US3 (cross-page consistency), validate, and demo.
5. Finish Phase 6 quality gates and contract verification.

### Parallel Team Strategy

1. Team aligns on Phase 1-2 foundations.
2. After Phase 2 completion:
   - Developer A: US1 tasks
   - Developer B: US2 tasks
   - Developer C: US3 tasks
3. Rejoin for Phase 6 polish and validation evidence capture.

---

## Notes

- `[P]` tasks are intentionally scoped to distinct files to reduce merge conflicts.
- Keep all workflow behavior and API semantics unchanged unless fixing defects that block parity.
- Use `specs/001-frontend-visual-redesign/checklists/qa-validation.md` as the source of truth for manual gate evidence.
