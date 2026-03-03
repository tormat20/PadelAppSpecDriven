# Contract: OcrImportPanel component

**Feature**: 019-ocr-player-import | **User Stories**: US1 + US2
**Files affected**:
- `frontend/src/components/ocr/OcrImportPanel.tsx` — NEW
- `frontend/src/features/ocr/ocrImport.ts` — NEW (pure helpers consumed by panel)

---

## Component identity

**Name**: `OcrImportPanel`
**Default export**: yes
**Location**: `frontend/src/components/ocr/OcrImportPanel.tsx`

---

## Props

```ts
type OcrImportPanelProps = {
  /** Player catalog used for name matching and duplicate detection. */
  catalog: { id: string; displayName: string }[]

  /**
   * Controls behaviour and labelling:
   * - "roster": pre-check all results; confirm assigns players to roster.
   * - "register": pre-check only new (unmatched) names; already-registered names disabled.
   */
  mode: "roster" | "register"

  /**
   * Roster mode — called with resolved player objects (matched catalog entries
   * or freshly created players via createOrReusePlayer).
   * Register mode — pass a no-op: `() => {}`.
   */
  onConfirmRoster: (players: { id: string; displayName: string }[]) => void

  /**
   * Register mode — called with the raw name strings selected for registration
   * (already-registered names excluded).
   * Roster mode — pass a no-op: `() => {}`.
   */
  onConfirmRegister: (names: string[]) => void
}
```

---

## Internal state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `status` | `"idle" \| "processing" \| "results" \| "error"` | `"idle"` | Controls which panel section renders |
| `results` | `OcrMatchResult[]` | `[]` | Set after successful OCR + matching |
| `checked` | `Set<string>` | `new Set()` | `rawName` strings currently ticked by user |
| `ocrError` | `string` | `""` | Error message for `status === "error"` |
| `isConfirming` | `boolean` | `false` | True during in-flight API calls on confirm |
| `workerRef` | `MutableRefObject<TesseractWorker \| null>` | `null` | Tesseract.js worker instance |

---

## Lifecycle

| Event | Action |
|---|---|
| Mount | `createWorker(["eng", "swe"])` — store in `workerRef.current`; attach `document` paste listener |
| Unmount | `worker.terminate()` — clean up paste listener |
| Image received (paste / file) | Call `runOcr(file)` — sets `status = "processing"` |
| OCR success | Parse → match → `status = "results"`; populate `results` + `checked` |
| OCR error | `status = "error"`; set `ocrError` |
| Confirm clicked | Set `isConfirming = true`; execute API calls; call `onConfirmRoster` / `onConfirmRegister`; `isConfirming = false` |

---

## Rendered sections by `status`

### `"idle"`
```
[ Paste a screenshot or pick an image file ]
[ file input: accept="image/*" ]
```

### `"processing"`
```
Reading names…   (spinner or progress text)
```

### `"error"`
```
⚠ OCR failed — please try again.   (role="alert", className="warning-text")
[ Try again button resets to idle ]
```

### `"results"` — empty
```
No names found — try a clearer image.
[ Try again button resets to idle ]
```

### `"results"` — with items
```
☑ Alice Johnson           (matched — pre-checked; roster: checked; register: checked if new)
☐ Bob Smith               (unmatched — unchecked in roster mode)
☑ Carlos                  (unmatched — pre-checked in roster mode)
☑ Maria Karlsson (Already registered)  — disabled in register mode

[ Add to Roster ] / [ Register All New ]   (disabled when 0 eligible names checked)
```

---

## CSS classes (all existing)

```
.ocr-import-panel   — new wrapper class; use var(--color-*) for borders/bg
.ocr-drop-zone      — new wrapper for idle state; dashed border via var(--color-border)
.warning-text       — existing, for error state
.action-row         — existing, for confirm button row
.button             — existing, for confirm button
.button-secondary   — existing, for reset/try-again button
```

All interactive elements use `withInteractiveSurface()`.

---

## Acceptance criteria

| FR | Criterion |
|---|---|
| FR-003 | Panel accepts clipboard paste (image/* type) AND file input |
| FR-004 | Tesseract.js `createWorker(["eng","swe"])` used; no fetch to backend |
| FR-005 | Loading state shown while `status === "processing"` |
| FR-006 | `parseOcrNames` applied to raw OCR text before display |
| FR-007 | `matchNamesToCatalog` used to match names against catalog |
| FR-008 | Roster mode: matched=checked, unmatched=unchecked (initial state) |
| FR-011 | Register mode: matched names disabled with "(Already registered)" label |
| FR-014 | Confirm button disabled when `checkedCount === 0` |
| FR-015 | "No names found" message shown when `results.length === 0` |
| FR-016 | "OCR failed" message shown on Tesseract error |
| FR-017 | No network request made for OCR (confirmed by DevTools network tab) |
| FR-018 | `worker.terminate()` called in useEffect cleanup |
