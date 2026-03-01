# Tasks: Event Player Logic and Summary Icon/Alignment Update

**Input**: Design documents from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/012-event-player-logic/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include frontend tests for validation and summary presentation behavior per specification.

**Organization**: Tasks are grouped by user story to preserve independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared constants/helpers used by create-event and summary updates.

- [ ] T001 Add required player count and local today-date helpers in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/create-event/validation.ts`
- [ ] T002 [P] Add/confirm colored crown icon asset in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/public/images/icons/crown-color.png`
- [ ] T003 [P] Update crown icon source constant in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/summary/crownWinners.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish create-event validation and wiring that all stories depend on.

**⚠️ CRITICAL**: Complete this phase before story implementation.

- [ ] T004 Wire required player count into create-event submit validation in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/CreateEvent.tsx`
- [ ] T005 Update create-event disabled logic to require exact `courts * 4` players in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/features/create-event/validation.ts`
- [ ] T006 Pass total required players into player selector in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/CreateEvent.tsx`

**Checkpoint**: Capacity rules and wiring are in place for create-event behavior.

---

## Phase 3: User Story 1 - Enforce Court-Based Player Capacity (Priority: P1) 🎯 MVP

**Goal**: Enforce exact player/court capacity and keep submission blocked until valid.

**Independent Test**: `Create Event` remains disabled unless assigned players exactly equal selected courts multiplied by four.

### Tests for User Story 1

- [ ] T007 [P] [US1] Update create-event validation tests for exact player capacity in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/create-event-page.test.tsx`
- [ ] T008 [P] [US1] Add helper coverage for required count derivation in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/create-event-datetime.test.tsx`

### Implementation for User Story 1

- [ ] T009 [US1] Render assigned counter `assigned / required` in player selector header in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/players/PlayerSelector.tsx`
- [ ] T010 [US1] Add styles for assigned header/counter alignment in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`

**Checkpoint**: Capacity constraints and progress visibility are independently complete.

---

## Phase 4: User Story 2 - Improve Create-Event Clarity and Date Shortcut (Priority: P2)

**Goal**: Clarify court selection and provide date shortcut below schedule row.

**Independent Test**: Courts label is visible; "Today's date" click sets date only; selected time remains unchanged.

### Tests for User Story 2

- [ ] T011 [P] [US2] Add/extend date-shortcut behavior tests in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/create-event-datetime.test.tsx`

### Implementation for User Story 2

- [ ] T012 [US2] Add explicit courts section label in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/components/courts/CourtSelector.tsx`
- [ ] T013 [US2] Add "Today's date" clickable text below schedule row in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/CreateEvent.tsx`
- [ ] T014 [US2] Add styles for courts section wrapper and date shortcut text in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`

**Checkpoint**: Create-event copy and shortcut behavior are independently complete.

---

## Phase 5: User Story 3 - Improve Summary Winner Visual Presentation (Priority: P3)

**Goal**: Use colored crown icon and keep rank/name/icon alignment readable.

**Independent Test**: Final summary shows colored crown icon, rank centered, player name left, emblem right, with fallback marker on icon failure.

### Tests for User Story 3

- [ ] T015 [P] [US3] Update crown icon path expectations in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/tests/summary-crown-rendering.test.tsx`

### Implementation for User Story 3

- [ ] T016 [US3] Update summary name-cell markup for left name and right icon in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/pages/Summary.tsx`
- [ ] T017 [US3] Update summary table alignment styles (rank centered, name column left) in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/src/styles/components.css`

**Checkpoint**: Winner icon and summary row alignment are independently complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and documentation consistency.

- [ ] T018 [P] Update quickstart steps for create-event and summary behaviors in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/012-event-player-logic/quickstart.md`
- [ ] T019 Add ignore rule for local Vite cache in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.gitignore`
- [ ] T020 Run frontend validation suite (`npm run lint && npm run test`) from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/frontend/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP.
- **Phase 4 (US2)**: Depends on Phase 2.
- **Phase 5 (US3)**: Depends on Phase 2.
- **Phase 6 (Polish)**: Depends on completion of all selected stories.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational setup.
- **US2 (P2)**: Independent after foundational setup.
- **US3 (P3)**: Independent after foundational setup.

### Recommended Story Order

1. US1 (capacity enforcement and counters)
2. US2 (courts label and date shortcut)
3. US3 (summary icon/alignment)

---

## Parallel Execution Examples

### User Story 1

```bash
T007 frontend/tests/create-event-page.test.tsx
T008 frontend/tests/create-event-datetime.test.tsx
```

### User Story 2

```bash
T011 frontend/tests/create-event-datetime.test.tsx
T014 frontend/src/styles/components.css
```

### User Story 3

```bash
T015 frontend/tests/summary-crown-rendering.test.tsx
T017 frontend/src/styles/components.css
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundational phases.
2. Implement US1 and validate create-event exact-capacity behavior.
3. Demo MVP with disabled/enabled transitions.

### Incremental Delivery

1. Deliver US1.
2. Deliver US2.
3. Deliver US3.
4. Complete polish and validation.
