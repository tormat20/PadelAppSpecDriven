# Tasks: OCR/Paste Accuracy Uplift + Learned Corrections

**Input**: Design documents from `/specs/040-ocr-correction-learning/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature explicitly requires regression and contract coverage; include parser, OCR flow, and backend contract tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in every task description

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare OCR correction feature scaffolding and shared contracts.

- [X] T001 Create OCR correction API schema module skeleton in `backend/app/api/schemas/ocr.py`
- [X] T002 Create OCR correction router module skeleton in `backend/app/api/routers/ocr.py`
- [X] T003 [P] Create contract test file skeleton in `backend/tests/contract/test_ocr_corrections_api.py`
- [X] T004 [P] Add frontend OCR correction shared type definitions in `frontend/src/features/ocr/correctionTypes.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build cross-story correction-memory foundation required for parser learning and resolution.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T005 Add DuckDB migration for correction memory table and indexes in `backend/app/db/migrations/017_ocr_corrections.sql`
- [X] T006 [P] Implement correction repository CRUD/upsert operations in `backend/app/repositories/ocr_corrections_repo.py`
- [X] T007 [P] Implement correction request/response schemas in `backend/app/api/schemas/ocr.py`
- [X] T008 Implement correction resolution service (signature lookup, recency ranking, confidence gates) in `backend/app/services/ocr_correction_service.py`
- [X] T009 Implement correction API endpoints (`/ocr/corrections`, `/ocr/corrections/resolve`) in `backend/app/api/routers/ocr.py`
- [X] T010 Register OCR correction router in `backend/app/api/routers/__init__.py` and `backend/app/main.py`
- [X] T011 [P] Add frontend API client methods for correction upsert/resolve in `frontend/src/lib/api.ts`
- [X] T012 [P] Add deterministic noisy-signature helper in `frontend/src/features/ocr/correctionSignature.ts`

**Checkpoint**: Correction-memory foundation is complete; user stories can proceed.

---

## Phase 3: User Story 1 - Correct edge-case parsing in bulk paste (Priority: P1) 🎯 MVP

**Goal**: Fix known jammed boundary parsing failures while preserving existing parser behavior.

**Independent Test**: `parseBookingText` returns correct name/email for the two reported failure samples and all existing booking parser fixtures remain green.

### Tests for User Story 1

- [X] T013 [P] [US1] Add regression tests for Daniel and Mikael jammed-row failures in `frontend/tests/booking-text-parser.test.ts`
- [X] T014 [P] [US1] Add non-regression test for Swedish/all-caps jammed patterns in `frontend/tests/booking-text-parser.test.ts`

### Implementation for User Story 1

- [X] T015 [US1] Patch jammed local-part boundary tie-break logic in `frontend/src/features/ocr/bookingTextParser.ts`
- [X] T016 [US1] Improve digit-boundary fallback to preserve valid alnum local-part prefixes in `frontend/src/features/ocr/bookingTextParser.ts`
- [X] T017 [US1] Update parser rule documentation/comments for new targeted heuristics in `frontend/src/features/ocr/bookingTextParser.ts`

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Auto-correct from learned historical edits (Priority: P2)

**Goal**: Persist user-confirmed corrections and auto-apply most recent safe matches on repeated imports.

**Independent Test**: Confirm one manual correction, re-import same noisy row, and verify automatic correction from backend memory.

### Tests for User Story 2

- [X] T018 [P] [US2] Add backend contract tests for correction upsert behavior in `backend/tests/contract/test_ocr_corrections_api.py`
- [X] T019 [P] [US2] Add backend contract tests for resolve auto-apply and recency precedence in `backend/tests/contract/test_ocr_corrections_api.py`
- [X] T020 [P] [US2] Add frontend OCR import test for auto-corrected rows in `frontend/tests/ocr-import.test.ts`

### Implementation for User Story 2

- [X] T021 [US2] Implement correction upsert metadata updates (`useCount`, `lastUsedAt`, `updatedAt`) in `backend/app/repositories/ocr_corrections_repo.py`
- [X] T022 [US2] Implement most-recent correction winner selection in `backend/app/services/ocr_correction_service.py`
- [X] T023 [US2] Implement correction resolve endpoint wiring and response reasons in `backend/app/api/routers/ocr.py`
- [X] T024 [US2] Integrate resolve API call and resolution mapping in `frontend/src/components/ocr/OcrImportPanel.tsx`
- [X] T025 [US2] Persist manual row edits through correction upsert API in `frontend/src/components/ocr/OcrImportPanel.tsx`
- [X] T026 [US2] Apply resolved correction outcomes (`auto_corrected`, `suggested_review`, `unchanged`) in `frontend/src/components/ocr/OcrImportPanel.tsx`

**Checkpoint**: US1 and US2 are independently functional.

---

## Phase 5: User Story 3 - Safe conflict handling and review visibility (Priority: P3)

**Goal**: Prevent unsafe silent overrides and clearly surface conflicts/suggestions for manual review.

**Independent Test**: Import rows with ambiguous/conflicting learned matches and verify they are flagged for review, not force-applied.

### Tests for User Story 3

- [X] T027 [P] [US3] Add backend conflict-case contract tests (`identity_conflict`, `suggested_only`) in `backend/tests/contract/test_ocr_corrections_api.py`
- [X] T028 [P] [US3] Add frontend review-state rendering tests for conflict/suggestion badges in `frontend/tests/ocr-import.test.ts`

### Implementation for User Story 3

- [X] T029 [US3] Implement conflict guardrails against stronger identity matches in `backend/app/services/ocr_correction_service.py`
- [X] T030 [US3] Return explicit resolution reasons for conflict/suggestion states in `backend/app/api/routers/ocr.py`
- [X] T031 [US3] Render “Auto-corrected from previous edit” and conflict review indicators in `frontend/src/components/ocr/OcrImportPanel.tsx`
- [X] T032 [US3] Prevent silent override when exact catalog email match disagrees in `frontend/src/components/ocr/OcrImportPanel.tsx`

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, verification, and documentation across stories.

- [X] T033 [P] Add signature helper unit/regression tests in `frontend/tests/ocr-import.test.ts` and `frontend/tests/booking-text-parser.test.ts`
- [X] T034 Run backend contract and suite verification updates in `backend/tests/contract/test_ocr_corrections_api.py` and `specs/040-ocr-correction-learning/quickstart.md`
- [X] T035 Run frontend targeted/full verification updates in `frontend/tests/booking-text-parser.test.ts`, `frontend/tests/ocr-import.test.ts`, and `specs/040-ocr-correction-learning/quickstart.md`
- [X] T036 [P] Document final validation outcomes and edge-case notes in `specs/040-ocr-correction-learning/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Starts after Phase 2.
- **Phase 4 (US2)**: Starts after Phase 2; may reuse US1 parser outputs but remains independently testable.
- **Phase 5 (US3)**: Starts after Phase 2; depends on US2 correction-resolution infrastructure.
- **Phase 6 (Polish)**: Starts after desired user stories complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories.
- **US2 (P2)**: Depends on foundational correction persistence/resolution pieces.
- **US3 (P3)**: Depends on US2 resolution flow to surface conflict paths.

### Task-Level Dependencies (highlights)

- T005 -> T006/T008 (migration before repo/service persistence behavior)
- T007 -> T009 (schemas before router contract implementation)
- T009/T010 -> T018/T019/T027 (endpoints registered before contract validation)
- T011/T012 -> T024/T025/T026 (frontend API/signature utilities before panel integration)
- T015/T016 -> T013/T014 verification completion for US1
- T021/T022/T023 -> T024/T025/T026 (backend correction behavior before frontend auto-apply integration)

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel parser test authoring
Task: "T013 [US1] Add Daniel/Mikael regressions in frontend/tests/booking-text-parser.test.ts"
Task: "T014 [US1] Add non-regression Swedish/all-caps case in frontend/tests/booking-text-parser.test.ts"
```

### User Story 2

```bash
# Parallel US2 test additions
Task: "T018 [US2] Add upsert contract tests in backend/tests/contract/test_ocr_corrections_api.py"
Task: "T020 [US2] Add frontend auto-corrected row test in frontend/tests/ocr-import.test.ts"

# Parallel backend/frontend implementation once contracts exist
Task: "T022 [US2] Implement recency winner service in backend/app/services/ocr_correction_service.py"
Task: "T024 [US2] Integrate resolve mapping in frontend/src/components/ocr/OcrImportPanel.tsx"
```

### User Story 3

```bash
# Parallel conflict visibility work
Task: "T027 [US3] Add backend conflict contract tests in backend/tests/contract/test_ocr_corrections_api.py"
Task: "T028 [US3] Add frontend review badge tests in frontend/tests/ocr-import.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1 parser fixes).
3. Validate targeted parser regressions + non-regression fixtures.
4. Demo improved 24-row import accuracy.

### Incremental Delivery

1. Ship US1 targeted parser uplift first (low-risk immediate value).
2. Add US2 learned correction persistence + auto-apply behavior.
3. Add US3 conflict/review safeguards and visibility.
4. Run full frontend/backend regressions and finalize quickstart evidence.

### Parallel Team Strategy

1. One developer handles backend correction persistence/resolution (T005-T010, T021-T023, T029-T030).
2. One developer handles frontend OCR panel integration (T011-T012, T024-T026, T031-T032).
3. Shared ownership on regression/contract tests and quickstart verification (T013-T020, T027-T036).

---

## Notes

- All tasks use exact file paths and strict checklist format.
- `[P]` tasks are file-independent and can run concurrently.
- Story labels map tasks to independently testable increments.
- Keep parser changes surgical; avoid architecture rewrite per spec constraints.
