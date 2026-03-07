import { useEffect, useRef, useState } from "react"

import { withInteractiveSurface } from "../interaction/surfaceClass"
import { createOrReusePlayer, searchPlayers, substitutePlayer } from "../../lib/api"

type Player = { id: string; displayName: string }

type Props = {
  isOpen: boolean
  eventId: string
  currentPlayers: Player[]
  onClose: () => void
  onSubstituted: () => void
}

export function SubstituteModal({ isOpen, eventId, currentPlayers, onClose, onSubstituted }: Props) {
  const [departingPlayerId, setDepartingPlayerId] = useState("")
  const [substituteQuery, setSubstituteQuery] = useState("")
  const [substituteResults, setSubstituteResults] = useState<Player[]>([])
  const [selectedSubstitute, setSelectedSubstitute] = useState<Player | null>(null)
  const [isStandIn, setIsStandIn] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartingPlayerId("")
      setSubstituteQuery("")
      setSubstituteResults([])
      setSelectedSubstitute(null)
      setIsStandIn(false)
      setError("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Debounced player search
  useEffect(() => {
    if (!substituteQuery.trim()) {
      setSubstituteResults([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchPlayers(substituteQuery.trim())
        const currentIds = new Set(currentPlayers.map((p) => p.id))
        setSubstituteResults(results.filter((p) => !currentIds.has(p.id)))
      } catch {
        setSubstituteResults([])
      }
    }, 250)
  }, [substituteQuery, currentPlayers])

  const handleConfirm = async () => {
    if (!departingPlayerId) {
      setError("Select the player who is leaving.")
      return
    }
    if (!selectedSubstitute) {
      setError("Select or create the substitute player.")
      return
    }
    setError("")
    setIsSubmitting(true)
    try {
      if (isStandIn) {
        // createOrReusePlayer handles dedup against the catalog
        const catalog = await searchPlayers("")
        const { player } = await createOrReusePlayer(selectedSubstitute.displayName, catalog)
        await substitutePlayer(eventId, {
          departingPlayerId,
          substitutePlayerId: player.id,
        })
      } else {
        await substitutePlayer(eventId, {
          departingPlayerId,
          substitutePlayerId: selectedSubstitute.id,
        })
      }
      onSubstituted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to substitute player. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="result-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="result-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Substitute player"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="result-modal-header">
          <h3 className="match-title">Substitute Player</h3>
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            style={{ padding: "0.25rem 0.6rem", minHeight: "unset" }}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <p className="muted">Replace a player for all future rounds. The current round is not affected.</p>

        {/* Departing player selector */}
        <div>
          <p className="section-label" style={{ marginBottom: "0.5rem" }}>Who is leaving?</p>
          <div className="form-grid" style={{ gap: "0.4rem" }}>
            {currentPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                className={withInteractiveSurface(departingPlayerId === player.id ? "button" : "button-secondary")}
                aria-pressed={departingPlayerId === player.id}
                onClick={() => {
                  setDepartingPlayerId(player.id)
                  setError("")
                }}
              >
                {player.displayName}
              </button>
            ))}
          </div>
        </div>

        {/* Substitute player search */}
        <div>
          <p className="section-label" style={{ marginBottom: "0.5rem" }}>Who is joining?</p>
          {selectedSubstitute ? (
            <div className="summary-row">
              <span>{selectedSubstitute.displayName}</span>
              <button
                type="button"
                className={withInteractiveSurface("button-secondary")}
                style={{ padding: "0.25rem 0.6rem", minHeight: "unset", fontSize: "0.8rem" }}
                onClick={() => {
                  setSelectedSubstitute(null)
                  setSubstituteQuery("")
                  setIsStandIn(false)
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                className="input"
                type="text"
                placeholder="Search player by name…"
                value={substituteQuery}
                onChange={(e) => {
                  setSubstituteQuery(e.target.value)
                  setSelectedSubstitute(null)
                }}
                aria-label="Search substitute player"
              />
              {substituteResults.length > 0 && (
                <ul className="summary-list" style={{ marginTop: "0.4rem", maxHeight: "12rem", overflowY: "auto" }}>
                  {substituteResults.map((player) => (
                    <li key={player.id}>
                      <button
                        type="button"
                        className={withInteractiveSurface("button-secondary")}
                        style={{ width: "100%", textAlign: "left" }}
                        onClick={() => {
                          setSelectedSubstitute(player)
                          setSubstituteQuery(player.displayName)
                          setIsStandIn(false)
                        }}
                      >
                        {player.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {substituteQuery.trim().length > 1 && substituteResults.length === 0 && (
                <button
                  type="button"
                  className={withInteractiveSurface("button-secondary")}
                  style={{ marginTop: "0.4rem", width: "100%" }}
                  onClick={() => {
                    setSelectedSubstitute({ id: "", displayName: substituteQuery.trim() })
                    setIsStandIn(true)
                  }}
                >
                  Add "{substituteQuery.trim()}" as a stand-in
                </button>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="warning-text" aria-live="polite">{error}</p>
        )}

        <section className="grid-columns-2">
          <button
            type="button"
            className={withInteractiveSurface("button")}
            onClick={() => void handleConfirm()}
            disabled={isSubmitting || !departingPlayerId || !selectedSubstitute}
          >
            {isSubmitting ? "Substituting…" : "Confirm"}
          </button>
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </section>
      </div>
    </div>
  )
}
