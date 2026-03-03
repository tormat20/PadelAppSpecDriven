# Contract: PlayerSelector — OCR accordion integration

**Feature**: 019-ocr-player-import | **User Story**: US1
**Files affected**:
- `frontend/src/components/players/PlayerSelector.tsx` — MODIFIED

---

## Change summary

Add a collapsed "Import from image" accordion to `PlayerSelector.tsx` between the "Players" section heading (`<h3>`) and the existing player search form. The accordion hosts an `OcrImportPanel` in `"roster"` mode.

---

## New import

```ts
import OcrImportPanel from "../ocr/OcrImportPanel"
```

---

## New state

```ts
const [isOcrOpen, setIsOcrOpen] = useState(false)
```

No new props on `PlayerSelector`.

---

## JSX insertion point

Insert **after** `<h3 className="section-title">{PLAYER_SECTION_TITLE}</h3>` and **before** the `<form className="player-search-row">`:

```tsx
{/* OCR accordion toggle */}
<button
  className={withInteractiveSurface("button-secondary")}
  aria-expanded={isOcrOpen}
  aria-controls="ocr-import-panel"
  onClick={() => setIsOcrOpen((v) => !v)}
>
  {isOcrOpen ? "▲ Import from image" : "▼ Import from image"}
</button>

{/* OCR accordion panel */}
{isOcrOpen && (
  <div id="ocr-import-panel">
    <OcrImportPanel
      catalog={catalog}
      mode="roster"
      onConfirmRoster={(players) => {
        players.forEach((p) => assignPlayer(p))
        setIsOcrOpen(false)
      }}
      onConfirmRegister={() => {}}
    />
  </div>
)}
```

---

## Behaviour

| Trigger | Result |
|---|---|
| Click "Import from image" (closed) | `isOcrOpen = true`; panel mounts; Tesseract worker starts |
| Click "Import from image" (open) | `isOcrOpen = false`; panel unmounts; worker terminated |
| `onConfirmRoster` fires | Each player passed to `assignPlayer(p)`; then `isOcrOpen = false` |

---

## Existing behaviour preserved

- The `catalog` state and `assignPlayer` function are **unchanged**.
- The `<form className="player-search-row">` and all search/assign UI below it are **unchanged**.
- No existing props of `PlayerSelector` are changed.
- All existing exports from `PlayerSelector.tsx` remain intact.

---

## Acceptance criteria (FR references)

| FR | Criterion |
|---|---|
| FR-001 | Accordion toggle "Import from image" visible below "Players" heading |
| FR-002 | Clicking toggle expands panel |
| FR-008 | In roster mode: matched=pre-checked, unmatched=unchecked |
| FR-009 | "Add to Roster" assigns all checked players |
| FR-010 | Accordion collapses automatically after confirm |
| FR-018 | Worker terminated when accordion collapses (panel unmounts) |
