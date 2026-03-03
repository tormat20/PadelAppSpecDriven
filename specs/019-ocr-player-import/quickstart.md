# Quickstart: OCR Player Import (019-ocr-player-import)

**Branch**: `019-ocr-player-import` | **Date**: 2026-03-03

This guide gives an implementer everything needed to start coding immediately.

---

## Run tests

```bash
cd frontend && npm test
```

All 170 existing tests must remain green after each change.

---

## Step 0 — Install Tesseract.js

```bash
cd frontend && npm install tesseract.js
```

Verify `tesseract.js` appears in `frontend/package.json` under `dependencies`.

---

## Files to touch

| File | Action | User Story |
|---|---|---|
| `frontend/src/features/ocr/ocrImport.ts` | Create | US1 + US2 |
| `frontend/src/components/ocr/OcrImportPanel.tsx` | Create | US1 + US2 |
| `frontend/tests/ocr-import.test.ts` | Create | US1 + US2 |
| `frontend/src/components/players/PlayerSelector.tsx` | Modify | US1 |
| `frontend/src/pages/RegisterPlayer.tsx` | Modify | US2 |

---

## Step 1 — Create `frontend/src/features/ocr/ocrImport.ts`

```ts
import { normalizePlayerName } from "../../lib/playerNames"
import { findDuplicateByName } from "../../features/create-event/playerSearch"

export type OcrMatchResult = {
  rawName: string
  matchedPlayer: { id: string; displayName: string } | null
}

export function parseOcrNames(rawText: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of rawText.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.length <= 1) continue
    if (/^\d+$/.test(trimmed)) continue
    const key = normalizePlayerName(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

export function matchNamesToCatalog(
  names: string[],
  catalog: { id: string; displayName: string }[],
): OcrMatchResult[] {
  return names.map((rawName) => ({
    rawName,
    matchedPlayer: findDuplicateByName(catalog, rawName),
  }))
}
```

---

## Step 2 — Create `frontend/tests/ocr-import.test.ts`

Write unit tests for the two pure helpers. **No DOM, no React, no imports of Tesseract.js.** Vitest only.

Required cases for `parseOcrNames`:
- `"Alice\nBob\nCarlos\n"` → `["Alice", "Bob", "Carlos"]`
- `"Alice\n\nBob\n  \nCarlos"` → `["Alice", "Bob", "Carlos"]`
- `"1\nAlice\n23\nBob"` → `["Alice", "Bob"]`
- `""` → `[]`
- `"Alice\nalice\nALICE"` → `["Alice"]`
- `"A\nBob"` → `["Bob"]`

Required cases for `matchNamesToCatalog`:
- `(["Alice", "Bob"], [{id:"1", displayName:"Alice"}])` → `[{rawName:"Alice", matchedPlayer:{id:"1",displayName:"Alice"}}, {rawName:"Bob", matchedPlayer:null}]`
- `([], catalog)` → `[]`
- `(["Alice"], [])` → `[{rawName:"Alice", matchedPlayer:null}]`

---

## Step 3 — Create `frontend/src/components/ocr/OcrImportPanel.tsx`

Key imports:
```ts
import { useEffect, useRef, useState } from "react"
import { createWorker } from "tesseract.js"
import { parseOcrNames, matchNamesToCatalog, type OcrMatchResult } from "../../features/ocr/ocrImport"
import { createOrReusePlayer, createPlayer } from "../../lib/api"
import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
```

**Props**:
```ts
type OcrImportPanelProps = {
  catalog: { id: string; displayName: string }[]
  mode: "roster" | "register"
  onConfirmRoster: (players: { id: string; displayName: string }[]) => void
  onConfirmRegister: (names: string[]) => void
}
```

**State**: `status`, `results`, `checked`, `ocrError`, `isConfirming`, `workerRef` (see data-model.md).

**Worker lifecycle**:
```ts
useEffect(() => {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null
  createWorker(["eng", "swe"]).then((w) => { worker = w; workerRef.current = w })
  return () => { worker?.terminate() }
}, [])
```

**Clipboard paste**:
```ts
useEffect(() => {
  const handler = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) runOcr(file)
        break
      }
    }
  }
  document.addEventListener("paste", handler)
  return () => document.removeEventListener("paste", handler)
}, [status])  // re-attach when status changes so runOcr closure is fresh
```

**runOcr(file)**:
```ts
async function runOcr(file: File) {
  if (!workerRef.current) return
  setStatus("processing")
  setResults([])
  setChecked(new Set())
  setOcrError("")
  try {
    const ret = await workerRef.current.recognize(file)
    const names = parseOcrNames(ret.data.text)
    const matched = matchNamesToCatalog(names, catalog)
    setResults(matched)
    // Pre-check: in roster mode check all; in register mode check only unmatched
    const initialChecked = new Set(
      matched
        .filter((r) => mode === "roster" || r.matchedPlayer === null)
        .map((r) => r.rawName)
    )
    setChecked(initialChecked)
    setStatus("results")
  } catch {
    setOcrError("OCR failed — please try again.")
    setStatus("error")
  }
}
```

**handleConfirmRoster**:
```ts
async function handleConfirmRoster() {
  setIsConfirming(true)
  const players: { id: string; displayName: string }[] = []
  for (const r of results) {
    if (!checked.has(r.rawName)) continue
    if (r.matchedPlayer) {
      players.push(r.matchedPlayer)
    } else {
      const created = await createOrReusePlayer(r.rawName, catalog)
      players.push(created)
    }
  }
  setIsConfirming(false)
  onConfirmRoster(players)
}
```

**handleConfirmRegister**:
```ts
async function handleConfirmRegister() {
  setIsConfirming(true)
  const newNames = results
    .filter((r) => r.matchedPlayer === null && checked.has(r.rawName))
    .map((r) => r.rawName)
  onConfirmRegister(newNames)
  setIsConfirming(false)
}
```

**JSX skeleton**:
```tsx
<section className="ocr-import-panel">
  {/* Idle / drop zone */}
  {status === "idle" && (
    <div className="ocr-drop-zone">
      <p>Paste a screenshot or pick a file</p>
      <input type="file" accept="image/*" onChange={...} />
    </div>
  )}

  {/* Processing */}
  {status === "processing" && <p>Reading names…</p>}

  {/* Error */}
  {status === "error" && <p className="warning-text" role="alert">{ocrError}</p>}

  {/* Results */}
  {status === "results" && (
    <>
      {results.length === 0 && <p>No names found — try a clearer image.</p>}
      {results.map((r) => (
        <label key={r.rawName}>
          <input
            type="checkbox"
            checked={checked.has(r.rawName)}
            disabled={mode === "register" && r.matchedPlayer !== null}
            onChange={...}
          />
          {r.rawName}
          {mode === "register" && r.matchedPlayer && (
            <span> (Already registered)</span>
          )}
        </label>
      ))}
      <div className="action-row">
        <button
          className={withInteractiveSurface("button")}
          onClick={mode === "roster" ? handleConfirmRoster : handleConfirmRegister}
          disabled={isConfirming || checkedCount === 0}
        >
          {isConfirming ? "Saving…" : mode === "roster" ? "Add to Roster" : "Register All New"}
        </button>
      </div>
    </>
  )}
</section>
```

---

## Step 4 — Modify `PlayerSelector.tsx`

Add `isOcrOpen` state:
```ts
const [isOcrOpen, setIsOcrOpen] = useState(false)
```

Insert after `<h3 className="section-title">{PLAYER_SECTION_TITLE}</h3>`:
```tsx
<button
  className={withInteractiveSurface("button-secondary")}
  aria-expanded={isOcrOpen}
  onClick={() => setIsOcrOpen((v) => !v)}
>
  {isOcrOpen ? "▲ Import from image" : "▼ Import from image"}
</button>
{isOcrOpen && (
  <OcrImportPanel
    catalog={catalog}
    mode="roster"
    onConfirmRoster={(players) => {
      players.forEach((p) => assignPlayer(p))
      setIsOcrOpen(false)
    }}
    onConfirmRegister={() => {}}
  />
)}
```

Import `OcrImportPanel` from `"../ocr/OcrImportPanel"`.

---

## Step 5 — Modify `RegisterPlayer.tsx`

Below the `<input id="player-name">` block (and above the action row), insert:
```tsx
<OcrImportPanel
  catalog={catalog}
  mode="register"
  onConfirmRoster={() => {}}
  onConfirmRegister={async (names) => {
    const registered: string[] = []
    for (const name of names) {
      try {
        const player = await createPlayer(name)
        setCatalog((prev) => [...prev, player])
        registered.push(name)
      } catch {
        // individual failure — continue; show partial success
      }
    }
    if (registered.length > 0) {
      setSuccessName(registered.join(", "))
    }
  }}
/>
```

Import `OcrImportPanel` from `"../components/ocr/OcrImportPanel"`.

---

## Key constraints (never break these)

1. **No hardcoded colours** — all new CSS uses `var(--color-*)` tokens.
2. **All interactive buttons** use `withInteractiveSurface()`.
3. **Tesseract worker terminated** on panel unmount and on accordion collapse.
4. **No image data sent to backend** — all OCR is client-side (FR-017).
5. **Pure functions tested** — `parseOcrNames` and `matchNamesToCatalog` have unit tests.
6. **TypeScript strict** — no `any` for new code.

---

## Contracts

- [`contracts/ocr-import-panel.md`](./contracts/ocr-import-panel.md)
- [`contracts/player-selector-ocr.md`](./contracts/player-selector-ocr.md)
- [`contracts/register-player-ocr.md`](./contracts/register-player-ocr.md)
