# Data Model: OCR Player Import (019-ocr-player-import)

**Branch**: `019-ocr-player-import` | **Date**: 2026-03-03

This feature is entirely frontend. There are no new backend entities, no database schema changes, and no new API endpoints.

---

## New types — `frontend/src/features/ocr/ocrImport.ts`

### OcrMatchResult

```ts
/**
 * The result of matching a single OCR-extracted name against the player catalog.
 */
export type OcrMatchResult = {
  /** The raw name string extracted from the OCR output (trimmed, deduplicated). */
  rawName: string
  /**
   * The matched catalog player, or null if no case-insensitive match was found.
   */
  matchedPlayer: { id: string; displayName: string } | null
}
```

---

## New pure helper functions — `frontend/src/features/ocr/ocrImport.ts`

### parseOcrNames

```ts
import { normalizePlayerName } from "../../lib/playerNames"

/**
 * Converts raw Tesseract OCR output into a deduplicated list of candidate
 * player name strings.
 *
 * Filtering rules (applied in order):
 * 1. Split on newlines
 * 2. Trim each line
 * 3. Drop empty / whitespace-only lines
 * 4. Drop lines with ≤ 1 character (OCR noise)
 * 5. Drop lines that are purely numeric
 * 6. Deduplicate by normalised name (case-insensitive)
 *
 * @param rawText - The raw string returned by Tesseract worker.recognize()
 * @returns       - Ordered list of unique candidate player name strings
 */
export function parseOcrNames(rawText: string): string[]
```

**Examples**:

| Input | Output |
|---|---|
| `"Alice\nBob\nCarlos\n"` | `["Alice", "Bob", "Carlos"]` |
| `"Alice\n\nBob\n  \nCarlos"` | `["Alice", "Bob", "Carlos"]` |
| `"1\nAlice\n23\nBob"` | `["Alice", "Bob"]` |
| `""` | `[]` |
| `"Alice\nalice\nALICE"` | `["Alice"]` (dedup on first seen) |
| `"A\nBob"` | `["Bob"]` (1-char dropped) |

---

### matchNamesToCatalog

```ts
import { findDuplicateByName } from "../../features/create-event/playerSearch"

/**
 * Maps a list of candidate name strings to OcrMatchResult objects by
 * looking each name up in the player catalog.
 *
 * @param names   - Output of parseOcrNames()
 * @param catalog - The current player catalog loaded from the API
 * @returns       - One OcrMatchResult per input name, in the same order
 */
export function matchNamesToCatalog(
  names: string[],
  catalog: { id: string; displayName: string }[],
): OcrMatchResult[]
```

**Examples**:

| Input | Output |
|---|---|
| `(["Alice", "Bob"], [{id:"1", displayName:"Alice"}])` | `[{rawName:"Alice", matchedPlayer:{id:"1",displayName:"Alice"}}, {rawName:"Bob", matchedPlayer:null}]` |
| `([], catalog)` | `[]` |
| `(names, [])` | all `matchedPlayer: null` |

---

## OcrImportPanel — props contract

```ts
// frontend/src/components/ocr/OcrImportPanel.tsx

type OcrImportPanelProps = {
  /**
   * The current player catalog. Used to match OCR names and detect duplicates.
   */
  catalog: { id: string; displayName: string }[]

  /**
   * "roster" — show pre-checked matched + unchecked unmatched names.
   *            Confirm button: "Add to Roster"
   *            Duplicate detection: none (unmatched names will create new players)
   * "register" — show pre-checked new names; already-registered names
   *              labelled "Already registered" and disabled.
   *              Confirm button: "Register All New"
   */
  mode: "roster" | "register"

  /**
   * Called (roster mode only) with the resolved list of players to assign.
   * Matched names → existing catalog player object.
   * Unmatched names → newly-created player returned by createOrReusePlayer.
   */
  onConfirmRoster: (players: { id: string; displayName: string }[]) => void

  /**
   * Called (register mode only) with the raw name strings selected by the user
   * (new names only — already-registered names excluded).
   */
  onConfirmRegister: (names: string[]) => void
}
```

---

## OcrImportPanel — local state

| Field | Type | Initial value | Notes |
|---|---|---|---|
| `status` | `"idle" \| "processing" \| "results" \| "error"` | `"idle"` | Drives which UI section is shown |
| `results` | `OcrMatchResult[]` | `[]` | Set after OCR + matching completes |
| `checked` | `Set<string>` | `new Set()` | Set of `rawName` strings currently checked by the user |
| `ocrError` | `string` | `""` | Error message shown when `status === "error"` |
| `isConfirming` | `boolean` | `false` | Disables confirm button during API calls |
| `workerRef` | `React.MutableRefObject<Worker \| null>` | `null` | Holds the Tesseract worker instance |

---

## PlayerSelector.tsx — new local state

| Field | Type | Initial value | Notes |
|---|---|---|---|
| `isOcrOpen` | `boolean` | `false` | Controls accordion open/close state |

**No new props on `PlayerSelector`.**

---

## RegisterPlayer.tsx — new state / changes

No new state fields in `RegisterPlayer.tsx`. The `OcrImportPanel` is rendered directly below the name input. `onConfirmRegister` in `RegisterPlayer` calls `createPlayer` for each name, appending results to `catalog`, then sets `successName` to a comma-separated list of new names.
