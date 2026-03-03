# Implementation Plan: OCR Player Import

**Branch**: `019-ocr-player-import` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-ocr-player-import/spec.md`

---

## Summary

One reusable client-side OCR component (`OcrImportPanel`) integrated at two locations:

1. **Create Event — Roster step** (`PlayerSelector.tsx`): A collapsed accordion "Import from image" placed below the "Players" section heading. Expands to reveal the OCR panel. On confirm, bulk-assigns selected players to the roster and collapses automatically.
2. **Register Player page** (`RegisterPlayer.tsx`): An always-visible OCR import panel below the player name input. On confirm, bulk-calls `createPlayer` for each selected new name and shows success feedback.

**OCR engine**: Tesseract.js v7, WebAssembly, client-side only. No backend changes. Languages: `eng` + `swe`. Worker created lazily on first image load, terminated on panel unmount/collapse.

---

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3
**Primary Dependencies**: React Router DOM 6, Vite 5, Vitest 2, `motion` (already installed), **Tesseract.js v7** (new — to be `npm install`ed)
**Storage**: No new persistence — players created via existing `POST /api/v1/players` endpoint; player assignment uses existing `createOrReusePlayer`/`assignPlayer` patterns
**Testing**: Vitest 2 — pure unit tests exporting helper functions; no DOM rendering / React Testing Library
**Target Platform**: Web app (desktop + mobile browser); SPA served by Vite dev server / static build
**Performance Goals**: OCR on a clean screenshot in < 10 seconds on a modern desktop (post-worker-creation); `.traineddata` files lazily fetched and cached by browser (~4 MB each, one-time download)
**Constraints**: Must not break any of the 170 existing passing tests; TypeScript must compile with zero errors; CSS must use `var(--color-*)` tokens; all interactive buttons use `withInteractiveSurface()`; no image data sent to the backend (FR-017)
**Scale/Scope**: 2 existing components modified (`PlayerSelector.tsx`, `RegisterPlayer.tsx`); 2 new files (`ocrImport.ts`, `OcrImportPanel.tsx`); 1 new test file (`ocr-import.test.ts`); 1 new npm package

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Inferred Convention | Status | Notes |
|---|---|---|
| Pure-function exports for unit-testable logic | ✅ PASS | `parseOcrNames` and `matchNamesToCatalog` are pure exports; all logic in `ocrImport.ts` is deterministic and dependency-free |
| CSS design tokens — no hardcoded colours | ✅ PASS | All new CSS uses `var(--color-*)` tokens; no new hex values |
| All interactive buttons use `withInteractiveSurface()` | ✅ PASS | Accordion toggle, confirm button, cancel/close button all wrapped |
| TypeScript strict compliance | ✅ PASS | New code fully typed; `tesseract.js` ships its own `.d.ts` types |
| Vitest unit-test pattern | ✅ PASS | `ocr-import.test.ts` tests only pure exported functions |
| Existing tests must not regress | ✅ PASS | Only `PlayerSelector.tsx` and `RegisterPlayer.tsx` are modified; existing test files for those components test exported helpers, not JSX — no import paths change |
| No image data sent to backend | ✅ PASS | Tesseract.js runs fully in-browser via WebAssembly |
| One new npm package allowed | ✅ PASS | `tesseract.js` is the sole new dependency; confirmed by user |

**No gate violations. Proceeding to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/019-ocr-player-import/
├── plan.md              ← this file
├── spec.md              ← user stories, FRs, success criteria
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── checklists/
│   └── requirements.md  ← FR checklist
├── contracts/
│   ├── ocr-import-panel.md        ← OcrImportPanel component contract
│   ├── player-selector-ocr.md    ← PlayerSelector integration contract
│   └── register-player-ocr.md   ← RegisterPlayer integration contract
└── tasks.md             ← Phase 2 output
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── features/
│   │   └── ocr/
│   │       └── ocrImport.ts              ← NEW: pure helper functions
│   ├── components/
│   │   └── ocr/
│   │       └── OcrImportPanel.tsx        ← NEW: reusable OCR panel component
│   └── pages/
│       ├── RegisterPlayer.tsx            ← MODIFIED: always-visible OcrImportPanel added
│   └── components/
│       └── players/
│           └── PlayerSelector.tsx        ← MODIFIED: collapsed accordion + OcrImportPanel
└── tests/
    └── ocr-import.test.ts               ← NEW: pure-function unit tests
```

---

## Complexity Tracking

**Tesseract.js bundle impact**: ~200–300 KB extra gzipped JS (code-split via Vite dynamic import pattern). The `.traineddata` files (~4 MB each for eng/swe) are fetched lazily and cached by the browser — not bundled.

**Clipboard API**: Standard `ClipboardEvent.clipboardData.items` — works in all modern browsers for screenshots. Listener attached to `document` in a `useEffect` and cleaned up on unmount. No permission required for paste events.

**Worker lifecycle**: One Tesseract worker per `OcrImportPanel` instance. Worker is created on mount and terminated on unmount. In accordion mode, the worker is also terminated when the accordion collapses (resetting panel state).
