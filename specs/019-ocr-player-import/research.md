# Research: OCR Player Import (019-ocr-player-import)

**Branch**: `019-ocr-player-import` | **Date**: 2026-03-03

---

## US1 — Roster step: Import players from image

### Question
How should the OCR panel integrate with `PlayerSelector.tsx`? What state and callbacks does it need?

### Findings

`PlayerSelector.tsx` is a controlled component receiving:
- `assignedPlayers: AssignedPlayer[]` — the current roster
- `onAssignedPlayersChange: (players) => void` — callback to update roster
- It owns `catalog: AssignedPlayer[]` state, loaded on mount via `searchPlayers("")`
- `assignPlayer(player)` internally calls `onAssignedPlayersChange(addAssignedPlayer(assignedPlayers, player))`

The OCR panel in roster mode needs:
1. The current `catalog` (already available in `PlayerSelector`) — to run `matchNamesToCatalog`
2. A callback `onConfirmRoster(players)` — called with the list of players to assign (already-matched catalog players + newly-created ones)

**Decision**: `OcrImportPanel` receives `catalog` and `onConfirmRoster` as props. `PlayerSelector` wraps it in an accordion: `isOcrOpen` boolean state, toggled by the "Import from image" button. When `onConfirmRoster` fires, `PlayerSelector` calls `assignPlayer` for each returned player and then sets `isOcrOpen = false`.

**Accordion placement**: Insert immediately after `<h3 className="section-title">{PLAYER_SECTION_TITLE}</h3>` and before the `<form className="player-search-row">`.

### Impact on existing tests
`PlayerSelector.tsx` exports no pure helper functions — its tests (if any) test the component indirectly. Adding the accordion adds new state (`isOcrOpen`) and a new child component, but does not change any existing exports. No existing tests break.

---

## US2 — Register Player page: Bulk import from image

### Question
How does the OCR panel interact with `RegisterPlayer.tsx`'s existing state and submit flow?

### Findings

`RegisterPlayer.tsx` already has:
- `catalog: PlayerApiRecord[]` loaded on mount — available to pass to `OcrImportPanel`
- `createPlayer(displayName)` — the API call to use for each new name
- Success/error feedback patterns already established

In register mode the OCR panel needs:
1. `catalog` — to distinguish new vs. already-registered names
2. `onConfirmRegister(names: string[])` — called with the list of raw name strings to register

`RegisterPlayer.tsx` implements `onConfirmRegister` by calling `createPlayer` for each name sequentially (or in parallel), appending each successful result to `catalog`, and building a success summary.

**Decision**: `OcrImportPanel` is placed below the `<input id="player-name">` block (between the input and the action row). It is always visible (`mode="register"` — no accordion wrapper). The `isSubmitting` state is managed inside `OcrImportPanel` during bulk registration, not in `RegisterPlayer`.

---

## Tesseract.js v7 API

### Question
What is the exact Tesseract.js v7 API? Are there TypeScript types?

### Findings

```ts
import { createWorker } from "tesseract.js"

const worker = await createWorker(["eng", "swe"])
const result = await worker.recognize(imageFile)  // imageFile: File | Blob | HTMLImageElement | string (URL)
const text = result.data.text  // raw OCR output string
await worker.terminate()
```

- `createWorker` is async — loads the `.traineddata` files on first call
- `.traineddata` files are fetched from `https://tessdata.projectnaptha.com/4.0.0/` by default, then cached by the browser
- The worker runs in a Web Worker thread — non-blocking
- TypeScript types ship with the package (`tesseract.js/dist/tesseract.d.ts`)
- `result.data.text` is a `string` — may contain newlines, blank lines, noise characters

**Decision**: Create the Tesseract worker in a `useEffect` on `OcrImportPanel` mount (`createWorker(["eng", "swe"])`). Store it in a `useRef`. Terminate it in the cleanup function. This ensures one worker per panel instance with proper lifecycle management.

---

## Clipboard paste mechanics

### Question
How do we capture paste events globally without requiring the panel to be focused?

### Findings

- Attach `paste` listener to `document` inside a `useEffect` on mount
- `handler = (e: ClipboardEvent) => { const items = e.clipboardData?.items; ... }`
- Iterate `items`, find one where `item.type.startsWith("image/")`, call `item.getAsFile()` → `File | null`
- If `File`, set as the current image → trigger OCR
- Remove listener in `useEffect` cleanup

Browser support: Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+. All modern browsers supported.

**Security note**: Clipboard read via paste events requires the paste gesture from the user — no `navigator.clipboard.read()` (which needs explicit permission) is needed. This is safe and requires no permission request.

---

## Pure helper functions — parseOcrNames

### Question
What filtering rules are needed to clean raw Tesseract output into player names?

### Findings

Tesseract output on a clean vertically-listed name screenshot typically looks like:
```
Alice Johnson
Bob Smith
Carlos

1
Maria Karlsson
  
```

Rules (in order):
1. Split on newlines (`\n`)
2. Trim each line
3. Drop empty / whitespace-only lines
4. Drop lines with ≤ 1 character (single chars are OCR noise)
5. Drop lines that are purely numeric (`/^\d+$/`)
6. Deduplicate by normalised name (case-insensitive via `normalizePlayerName`)

Result: `["Alice Johnson", "Bob Smith", "Carlos", "Maria Karlsson"]`

**Decision**: Implement as `parseOcrNames(rawText: string): string[]` in `frontend/src/features/ocr/ocrImport.ts`. Import `normalizePlayerName` from `lib/playerNames.ts` for the deduplication step.

---

## matchNamesToCatalog

### Question
How do we match parsed names to catalog players?

### Findings

`findDuplicateByName(catalog, displayName)` in `features/create-event/playerSearch.ts`:
- Takes `catalog: { id: string; displayName: string }[]` and a `displayName: string`
- Returns the first matching `{ id, displayName }` or `null`
- Uses `normalizePlayerName` for case-insensitive comparison

**Decision**: `matchNamesToCatalog(names: string[], catalog: { id: string; displayName: string }[])` calls `findDuplicateByName(catalog, name)` for each name and returns `OcrMatchResult[]`.

---

## CSS / Design Tokens

No new design tokens required. New UI uses:
- `.panel`, `.form-grid`, `.input`, `.button`, `.button-secondary`, `.warning-text`, `.action-row` from `components.css`
- `withInteractiveSurface()` for all interactive buttons
- A new `.ocr-accordion` class for the collapsible section (using existing `var(--color-*)` tokens for borders/backgrounds)

---

## Dependency audit

| Item | Status |
|---|---|
| `tesseract.js` v7 | **NEW** — `cd frontend && npm install tesseract.js` |
| `createOrReusePlayer` | Already in `lib/api.ts` |
| `createPlayer` | Already in `lib/api.ts` |
| `searchPlayers` | Already in `lib/api.ts` |
| `findDuplicateByName` | Already in `features/create-event/playerSearch.ts` |
| `normalizePlayerName` | Already in `lib/playerNames.ts` |
| `withInteractiveSurface` | Already in `features/interaction/surfaceClass` |
| `AssignedPlayer` type | Already in `features/create-event/draftPlayers.ts` |
| `PlayerApiRecord` type | Already in `lib/api.ts` |

**One new npm package: `tesseract.js`.**
