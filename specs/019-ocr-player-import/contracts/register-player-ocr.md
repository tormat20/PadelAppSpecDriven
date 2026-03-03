# Contract: RegisterPlayer — OCR panel integration

**Feature**: 019-ocr-player-import | **User Story**: US2
**Files affected**:
- `frontend/src/pages/RegisterPlayer.tsx` — MODIFIED

---

## Change summary

Add an always-visible `OcrImportPanel` in `"register"` mode to `RegisterPlayer.tsx`, placed below the `<input id="player-name">` block. The panel allows bulk-registering new player names from a screenshot.

---

## New import

```ts
import OcrImportPanel from "../components/ocr/OcrImportPanel"
```

---

## New state

No new state fields in `RegisterPlayer.tsx`. The `OcrImportPanel` manages its own OCR state internally.

---

## JSX insertion point

Insert between the `<input id="player-name">` block (and its error/success messages) and the `<div className="action-row">` containing the Main Menu + Register Player buttons:

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
        // individual failure — continue to next name
      }
    }
    if (registered.length > 0) {
      setSuccessName(registered.join(", "))
    }
  }}
/>
```

---

## Behaviour

| Trigger | Result |
|---|---|
| User pastes / uploads image | `OcrImportPanel` runs OCR internally |
| OCR completes | New names shown checked; already-registered names disabled |
| User clicks "Register All New" | `onConfirmRegister(newNames)` fires |
| `onConfirmRegister` handler runs | `createPlayer` called for each name; successful names appended to `catalog`; `successName` updated |

---

## Success message format

When `registered.length > 0`:
```
Player 'Alice Johnson, Bob Smith' registered.
```
(Existing `successName` state + existing success message JSX — just the value changes to a comma-separated list.)

---

## Existing behaviour preserved

- The single-player registration form (`name` input, Main Menu + Register Player buttons) remains fully functional.
- `getRegisterPlayerError` and all other exports from `RegisterPlayer.tsx` are **unchanged**.
- `catalog` is still loaded on mount via `searchPlayers("")`.
- `isSubmitting` state for the single-player submit path is unaffected.

---

## Acceptance criteria (FR references)

| FR | Criterion |
|---|---|
| FR-011 | Already-registered names labelled "Already registered" and disabled |
| FR-012 | "Register All New" excludes already-registered names |
| FR-013 | Success message lists all newly registered names |
| FR-014 | "Register All New" disabled when no eligible names checked |
| FR-017 | No network request for OCR (client-side Tesseract only) |
