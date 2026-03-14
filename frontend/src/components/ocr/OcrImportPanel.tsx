import { useCallback, useEffect, useRef, useState } from "react"
import type { Worker as TesseractWorker } from "tesseract.js"
import { createWorker } from "tesseract.js"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import { matchNamesToCatalog, parseOcrNames } from "../../features/ocr/ocrImport"
import { parseBookingHtml, parseBookingText } from "../../features/ocr/bookingTextParser"
import { createOrReusePlayer } from "../../lib/api"
import type { OcrMatchResult } from "../../features/ocr/ocrImport"

type OcrStatus = "idle" | "processing" | "results" | "error"
type Tab = "image" | "text"

type OcrImportPanelProps = {
  /** Player catalog used for name matching and duplicate detection. */
  catalog: { id: string; displayName: string; email?: string | null }[]

  /**
   * Controls behaviour and labelling:
   * - "roster": pre-check all results; confirm assigns players to roster.
   * - "register": pre-check only new (unmatched) names; already-registered names disabled.
   */
  mode: "roster" | "register"

  /**
   * Optional file passed in from outside (e.g. a paste event captured by a
   * parent component before the panel was visible). When this prop changes to a
   * non-null value the panel will immediately start OCR on that file.
   */
  pendingFile?: File | null

  /**
   * Roster mode — called with resolved player objects (matched catalog entries
   * or freshly created players via createOrReusePlayer).
   * Register mode — pass a no-op: () => {}
   */
  onConfirmRoster: (players: { id: string; displayName: string }[]) => void

  /**
   * Register mode — called with the raw name strings selected for registration
   * (already-registered names excluded).
   * Roster mode — pass a no-op: () => {}
   */
  onConfirmRegister: (names: string[]) => void
}

export default function OcrImportPanel({ catalog, mode, pendingFile, onConfirmRoster, onConfirmRegister }: OcrImportPanelProps) {
  const [tab, setTab] = useState<Tab>("image")
  const [status, setStatus] = useState<OcrStatus>("idle")
  const [results, setResults] = useState<OcrMatchResult[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  // Names the user has explicitly dismissed via the − button; hidden from both lists
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [ocrError, setOcrError] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  // Per-row state for the "Add New Player" button in the unmatched column
  const [registering, setRegistering] = useState<Set<string>>(new Set())
  // rawName → resolved player for names individually registered via "Add New Player"
  const [individuallyRegistered, setIndividuallyRegistered] = useState<
    Map<string, { id: string; displayName: string }>
  >(new Map())
  const workerRef = useRef<TesseractWorker | null>(null)
  // Holds a file that arrived before the worker was ready
  const queuedFileRef = useRef<File | null>(null)

  // Create the Tesseract worker on mount and terminate on unmount.
  // If a file arrived before the worker was ready (queued via pendingFile or
  // an early paste), process it now.
  useEffect(() => {
    let worker: TesseractWorker | null = null
    createWorker(["eng", "swe"])
      .then((w) => {
        worker = w
        workerRef.current = w
        // Drain any file that arrived while we were initialising
        const queued = queuedFileRef.current
        if (queued) {
          queuedFileRef.current = null
          void runOcr(queued)
        }
      })
      .catch(() => {
        // Worker creation failed — runOcr will surface the error when called
      })
    return () => {
      void worker?.terminate()
    }
    // runOcr is stable (useCallback with [catalog]) — safe to list here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runOcr = useCallback(
    async (file: File) => {
      // If the worker hasn't initialised yet, queue the file — it will be
      // processed as soon as createWorker resolves.
      if (!workerRef.current) {
        queuedFileRef.current = file
        setStatus("processing")
        return
      }
      setStatus("processing")
      setResults([])
      setChecked(new Set())
      setDismissed(new Set())
      setOcrError("")
      setIndividuallyRegistered(new Map())
      try {
        const ret = await workerRef.current.recognize(file)
        const names = parseOcrNames(ret.data.text)
        const matched = matchNamesToCatalog(names, catalog)
        setResults(matched)
        // Pre-check all names in both modes.
        // In register mode, already-registered names are pre-checked but disabled
        // so the user can see the full list and know who is already in the system.
        const initialChecked = new Set(matched.map((r) => r.rawName))
        setChecked(initialChecked)
        setStatus("results")
      } catch {
        setOcrError("OCR failed — please try again.")
        setStatus("error")
      }
    },
    [catalog],
  )

  // Consume a file injected from outside (e.g. paste captured by a parent
  // before this panel was visible)
  useEffect(() => {
    if (pendingFile) void runOcr(pendingFile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFile])

  // Attach clipboard paste listener to document — only when no parent is
  // managing paste (pendingFile prop is absent). When a parent owns the paste
  // listener (e.g. PlayerSelector) it passes files via pendingFile instead.
  // Only active on the "image" tab.
  useEffect(() => {
    if (pendingFile !== undefined) return // parent owns paste
    if (tab !== "image") return
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) void runOcr(file)
          break
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [runOcr, pendingFile, tab])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void runOcr(file)
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  // ---------------------------------------------------------------------------
  // "Paste list" tab — parse booking text/HTML on paste into the textarea
  // ---------------------------------------------------------------------------

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()

    // Try HTML first (richer / unambiguous bold-tag strategy)
    const htmlData = e.clipboardData.getData("text/html")
    const textData = e.clipboardData.getData("text/plain")

    let participants: { name: string; email: string }[] = []
    if (htmlData) {
      participants = parseBookingHtml(htmlData)
    }
    if (participants.length === 0 && textData) {
      participants = parseBookingText(textData)
    }

    if (participants.length === 0) return

    // Convert ParsedParticipant[] → OcrMatchResult[] by looking up catalog
    const matched: OcrMatchResult[] = participants.map(({ name, email }) => {
      // Email-first match against catalog
      const emailLower = email.toLowerCase()
      let matchedPlayer =
        catalog.find((p) => p.email != null && p.email.toLowerCase() === emailLower) ?? null

      // Fallback: name-based match
      if (!matchedPlayer) {
        const normalizedName = name.toLowerCase().trim()
        matchedPlayer =
          catalog.find((p) => p.displayName.toLowerCase().trim() === normalizedName) ?? null
      }

      return { rawName: name, email, matchedPlayer }
    })

    // Deduplicate by rawName in case parser returned duplicates
    const seen = new Set<string>()
    const deduped = matched.filter((r) => {
      if (seen.has(r.rawName)) return false
      seen.add(r.rawName)
      return true
    })

    setResults(deduped)
    setChecked(new Set(deduped.map((r) => r.rawName)))
    setDismissed(new Set())
    setIndividuallyRegistered(new Map())
    setStatus("results")
  }

  // ---------------------------------------------------------------------------
  // Shared result/action logic (used by both tabs)
  // ---------------------------------------------------------------------------

  const toggleChecked = (rawName: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(rawName)) next.delete(rawName)
      else next.add(rawName)
      return next
    })
  }

  /** Remove a player row entirely: hide it and exclude it from the roster. */
  const dismissPlayer = (rawName: string) => {
    setDismissed((prev) => new Set(prev).add(rawName))
    setChecked((prev) => {
      const next = new Set(prev)
      next.delete(rawName)
      return next
    })
  }

  const handleReset = () => {
    setStatus("idle")
    setResults([])
    setChecked(new Set())
    setDismissed(new Set())
    setOcrError("")
    setIndividuallyRegistered(new Map())
    queuedFileRef.current = null
  }

  /**
   * Register a single unmatched player via the "Add New Player" per-row button.
   * On success the row moves to the left (in-system) column and is pre-checked.
   */
  const handleAddNewPlayer = async (r: OcrMatchResult, localCatalog: { id: string; displayName: string; email?: string | null }[]) => {
    setRegistering((prev) => new Set(prev).add(r.rawName))
    try {
      const { player } = await createOrReusePlayer(r.rawName, localCatalog, r.email)
      setIndividuallyRegistered((prev) => new Map(prev).set(r.rawName, player))
      setChecked((prev) => new Set(prev).add(r.rawName))
    } catch {
      // If creation fails, leave the row in the unmatched column
    } finally {
      setRegistering((prev) => {
        const next = new Set(prev)
        next.delete(r.rawName)
        return next
      })
    }
  }

  const handleConfirmRoster = async () => {
    setIsConfirming(true)
    const players: { id: string; displayName: string }[] = []
    for (const r of results) {
      if (!checked.has(r.rawName)) continue
      // Only act on names that are in the system (originally matched OR individually registered)
      const resolved = r.matchedPlayer ?? individuallyRegistered.get(r.rawName) ?? null
      if (resolved) {
        players.push(resolved)
      }
    }
    setIsConfirming(false)
    onConfirmRoster(players)
  }

  const handleConfirmRegister = () => {
    // Only pass names that have been individually registered via "Add New Player"
    // (unmatched names that were NOT yet registered are ignored by the confirm action)
    const newNames = results
      .filter((r) => {
        if (!checked.has(r.rawName)) return false
        // In register mode, "already in system" = originally matched OR individually registered
        const inSystem = r.matchedPlayer !== null || individuallyRegistered.has(r.rawName)
        return !inSystem
      })
      .map((r) => r.rawName)
    onConfirmRegister(newNames)
  }

  // A name is "in the system" if it was originally matched OR individually registered
  const isInSystem = (r: OcrMatchResult) =>
    r.matchedPlayer !== null || individuallyRegistered.has(r.rawName)

  const inSystemResults = results.filter((r) => isInSystem(r) && !dismissed.has(r.rawName))
  const newResults = results.filter((r) => !isInSystem(r) && !dismissed.has(r.rawName))

  // Build a live catalog that includes individually registered players (for createOrReusePlayer calls)
  const liveCatalog = [
    ...catalog,
    ...Array.from(individuallyRegistered.values()),
  ]

  // Count eligible checked items for disabling the confirm button.
  // Only in-system checked rows count.
  const checkedCount = results.filter((r) => isInSystem(r) && checked.has(r.rawName)).length

  // Switch tabs: reset any in-progress results
  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return
    handleReset()
    setTab(newTab)
  }

  return (
    <div className="ocr-import-panel">
      {/* Tab bar */}
      <div className="ocr-tab-bar" role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "image"}
          className={`ocr-tab${tab === "image" ? " ocr-tab--active" : ""}`}
          onClick={() => handleTabChange("image")}
        >
          Image
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "text"}
          className={`ocr-tab${tab === "text" ? " ocr-tab--active" : ""}`}
          onClick={() => handleTabChange("text")}
        >
          Paste list
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* IMAGE TAB                                                            */}
      {/* ------------------------------------------------------------------ */}
      {tab === "image" && (
        <>
          {/* Idle state — drop zone + file picker */}
          {status === "idle" && (
            <div className="ocr-drop-zone">
              <p className="muted">Paste a screenshot or pick an image file</p>
              <label className="ocr-file-label">
                <input
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleFileChange}
                />
                <span className={withInteractiveSurface("button-secondary")}>Choose image…</span>
              </label>
            </div>
          )}

          {/* Processing state */}
          {status === "processing" && (
            <p className="muted">Reading names…</p>
          )}

          {/* Error state */}
          {status === "error" && (
            <div>
              <p className="warning-text" role="alert">{ocrError}</p>
              <button
                className={withInteractiveSurface("button-secondary")}
                onClick={handleReset}
              >
                Try again
              </button>
            </div>
          )}

          {/* Results state */}
          {status === "results" && renderResults()}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PASTE LIST TAB                                                       */}
      {/* ------------------------------------------------------------------ */}
      {tab === "text" && (
        <>
          {status === "idle" && (
            <div className="ocr-drop-zone">
              <p className="muted">Paste your booking list below — names and emails are extracted automatically.</p>
              <textarea
                className="ocr-paste-area"
                placeholder="Paste here…"
                rows={6}
                onPaste={handleTextareaPaste}
                readOnly
                aria-label="Paste booking list here"
              />
            </div>
          )}

          {/* Results state */}
          {status === "results" && renderResults()}
        </>
      )}
    </div>
  )

  // ---------------------------------------------------------------------------
  // Shared results renderer (used by both tabs)
  // ---------------------------------------------------------------------------
  function renderResults() {
    return (
      <div className="ocr-results">
        {results.length === 0 ? (
          <div>
            <p className="muted">No names found — try a clearer image.</p>
            <button
              className={withInteractiveSurface("button-secondary")}
              onClick={handleReset}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="ocr-columns">
              {/* Left column — in system (originally matched OR individually registered) */}
              <div className="ocr-column">
                <p className="section-title">Already in system</p>
                <div className="player-listbox">
                  {inSystemResults.length === 0 ? (
                    <p className="muted player-listbox-empty">None found</p>
                  ) : (
                    inSystemResults.map((r) => {
                      const isAlreadyRegistered = mode === "register"
                      const isChecked = checked.has(r.rawName)
                      return (
                        <div
                          key={r.rawName}
                          className="ocr-in-system-row"
                        >
                          {!isAlreadyRegistered && (
                            <button
                              type="button"
                              className={withInteractiveSurface("row-action row-action-remove")}
                              aria-label={`Remove ${r.rawName}`}
                              onClick={() => dismissPlayer(r.rawName)}
                            >
                              −
                            </button>
                          )}
                          <button
                            type="button"
                            className={withInteractiveSurface("player-listbox-option ocr-in-system-name")}
                            aria-pressed={isChecked}
                            disabled={isAlreadyRegistered}
                            onClick={() => !isAlreadyRegistered && toggleChecked(r.rawName)}
                            data-active={isChecked}
                          >
                            <span className="ocr-player-name">{r.rawName}</span>
                            {r.email && (
                              <span className="ocr-player-email muted">{r.email}</span>
                            )}
                            {isAlreadyRegistered
                              ? <span className="tag">Registered</span>
                              : <span className="tag">Matched</span>
                            }
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right column — not yet in system */}
              <div className="ocr-column">
                <p className="section-title">New players</p>
                <div className="player-listbox">
                  {newResults.length === 0 ? (
                    <p className="muted player-listbox-empty">None found</p>
                  ) : (
                    newResults.map((r) => {
                      const isSaving = registering.has(r.rawName)
                      return (
                        <div
                          key={r.rawName}
                          className="ocr-new-player-row"
                        >
                          <button
                            type="button"
                            className={withInteractiveSurface("row-action row-action-remove")}
                            aria-label={`Remove ${r.rawName}`}
                            onClick={() => dismissPlayer(r.rawName)}
                          >
                            −
                          </button>
                          <span className="ocr-new-player-info">
                            <span className="ocr-new-player-name">{r.rawName}</span>
                            {r.email && (
                              <span className="ocr-player-email muted">{r.email}</span>
                            )}
                          </span>
                          <button
                            type="button"
                            className={withInteractiveSurface("button-secondary ocr-add-btn")}
                            disabled={isSaving}
                            onClick={() => void handleAddNewPlayer(r, liveCatalog)}
                          >
                            {isSaving ? "Saving…" : "Add New Player"}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="action-row">
              <button
                className={withInteractiveSurface("button-secondary")}
                onClick={handleReset}
              >
                Clear
              </button>
              <button
                className={withInteractiveSurface("button")}
                onClick={mode === "roster" ? () => void handleConfirmRoster() : handleConfirmRegister}
                disabled={isConfirming || checkedCount === 0}
              >
                {isConfirming
                  ? "Saving…"
                  : mode === "roster"
                    ? "Add to Roster"
                    : "Register All"}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }
}
