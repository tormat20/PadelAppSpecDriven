# Tasks: OCR Player Import (019-ocr-player-import)

**Input**: Design documents from `/specs/019-ocr-player-import/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by phase. US1 and US2 share the same core component (`OcrImportPanel`) and pure helpers — implement those first, then integrate at each location.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (Baseline & Dependency)

**Purpose**: Confirm baseline is green and install Tesseract.js before any changes.

- [ ] T001 Run `cd frontend && npm test` — confirm all 170 existing tests pass before any changes
- [ ] T002 Run `cd frontend && npm install tesseract.js` — install Tesseract.js v7; verify it appears in `package.json` under `dependencies`

---

## Phase 2: Pure Helpers + Unit Tests

**Purpose**: Implement and test the two pure functions that underpin the whole feature. These have no UI and no React — fastest path to confidence.

- [ ] T003 Create `frontend/src/features/ocr/ocrImport.ts` — implement `OcrMatchResult` type, `parseOcrNames(rawText)`, and `matchNamesToCatalog(names, catalog)` per quickstart.md Step 1
- [ ] T004 [P] Create `frontend/tests/ocr-import.test.ts` — Vitest unit tests for `parseOcrNames` and `matchNamesToCatalog` per quickstart.md Step 2 (all required cases listed there)
- [ ] T005 Run `cd frontend && npm test` — confirm new unit tests pass and all 170 existing tests still pass

**Checkpoint**: Core pure logic is correct and tested. Ready to build the component.

---

## Phase 3: OcrImportPanel Component

**Purpose**: Build the reusable panel component. Can be developed against the unit-tested helpers.

- [ ] T006 Create `frontend/src/components/ocr/OcrImportPanel.tsx` — implement the full component per contracts/ocr-import-panel.md and quickstart.md Step 3:
  - Tesseract worker lifecycle (create on mount, terminate on unmount)
  - Clipboard paste listener (`document` paste event, cleanup on unmount)
  - File input handler
  - `runOcr(file)` function
  - `status` state machine (`idle` → `processing` → `results` / `error`)
  - `checked` Set state with pre-population logic (roster: all checked; register: unmatched only)
  - `handleConfirmRoster` (calls `createOrReusePlayer` for unmatched, then `onConfirmRoster`)
  - `handleConfirmRegister` (calls `onConfirmRegister` with filtered new-only names)
  - Full JSX per contract (idle, processing, error, results sections)
  - All interactive buttons use `withInteractiveSurface()`
  - No hardcoded colours — all CSS uses `var(--color-*)` tokens
- [ ] T007 Run `cd frontend && npm test && npx tsc --noEmit` — confirm no new test failures and zero TypeScript errors

**Checkpoint**: `OcrImportPanel` is built and TypeScript-clean. Ready to integrate.

---

## Phase 4: User Story 1 — PlayerSelector accordion

**Purpose**: Integrate `OcrImportPanel` into the Create Event Roster step.

- [ ] T008 [US1] Edit `frontend/src/components/players/PlayerSelector.tsx`:
  - Add `useState(false)` for `isOcrOpen`
  - Import `OcrImportPanel` from `"../ocr/OcrImportPanel"`
  - Insert accordion toggle button (with `withInteractiveSurface("button-secondary")`) immediately after `<h3 className="section-title">`
  - Insert conditional `{isOcrOpen && <OcrImportPanel … />}` after the toggle
  - Implement `onConfirmRoster` callback: call `assignPlayer` for each player, then `setIsOcrOpen(false)`
  - Per contract: `player-selector-ocr.md`
- [ ] T009 [US1] Run `cd frontend && npm test` — confirm all existing tests still pass

**Checkpoint**: Roster step has working "Import from image" accordion.

---

## Phase 5: User Story 2 — RegisterPlayer panel

**Purpose**: Integrate `OcrImportPanel` into the Register Player page.

- [ ] T010 [US2] Edit `frontend/src/pages/RegisterPlayer.tsx`:
  - Import `OcrImportPanel` from `"../components/ocr/OcrImportPanel"`
  - Insert always-visible `<OcrImportPanel mode="register" … />` below the `<input id="player-name">` block (above the action row)
  - Implement `onConfirmRegister` callback: loop `createPlayer` calls, update `catalog`, update `successName`
  - Per contract: `register-player-ocr.md`
- [ ] T011 [US2] Run `cd frontend && npm test` — confirm all existing tests still pass

**Checkpoint**: Register Player page has working always-visible OCR panel.

---

## Phase 6: Polish & Final Verification

**Purpose**: Cross-cutting concerns, CSS audit, and final test run.

- [ ] T012 [P] Verify CSS compliance — confirm no hardcoded hex colours in new files; all styles use `var(--color-*)` tokens and existing CSS classes
- [ ] T013 [P] Verify all new interactive buttons use `withInteractiveSurface()` — audit `OcrImportPanel.tsx` and `PlayerSelector.tsx` changes
- [ ] T014 Run full test suite and TypeScript check: `cd frontend && npm test && npx tsc --noEmit` — confirm 170+ tests pass and zero TS errors
- [ ] T015 Manual smoke test — open browser and verify:
  - (a) Create Event → Roster step shows "Import from image" accordion; clicking expands; pasting a screenshot runs OCR; "Add to Roster" assigns players and collapses accordion
  - (b) `/players/register` shows always-visible OCR panel; pasting screenshot; already-registered names flagged; "Register All New" registers new names and shows success message
  - (c) No network requests to backend for OCR operations (DevTools Network tab)
  - (d) All existing page flows unaffected (bento menu, event creation, run event, view events)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Helpers)**: Depends on Phase 1 (Tesseract.js installed for TS type check)
- **Phase 3 (Component)**: Depends on Phase 2 (helpers imported by component)
- **Phase 4 (US1)**: Depends on Phase 3 (component must exist)
- **Phase 5 (US2)**: Depends on Phase 3 — independent of Phase 4; can run in parallel
- **Phase 6 (Polish)**: Depends on Phases 4 and 5

### Parallel Opportunities

- T003 (helpers) and T004 (unit tests) can be written in parallel (same file pair, different logic)
- T008 (US1 integration) and T010 (US2 integration) can be done in parallel after Phase 3

---

## Notes

- `tesseract.js` ships its own TypeScript types — no `@types/tesseract.js` package needed
- The Tesseract `.traineddata` files are fetched from `https://tessdata.projectnaptha.com` on first OCR run — ensure DevTools confirms this is the only OCR-related network traffic (images themselves must NOT be sent anywhere)
- `parseOcrNames` is a pure function with zero async code — ideal for unit testing without mocking
- `matchNamesToCatalog` depends on `findDuplicateByName` which is already tested; its unit test confirms the integration
- Existing `getRegisterPlayerError` export from `RegisterPlayer.tsx` must remain unchanged — its existing tests must still pass
