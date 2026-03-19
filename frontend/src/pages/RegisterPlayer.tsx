import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import OcrImportPanel from "../components/ocr/OcrImportPanel"
import { findDuplicateByName } from "../features/create-event/playerSearch"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { createPlayer, searchPlayers } from "../lib/api"
import type { PlayerApiRecord } from "../lib/api"

/**
 * Returns a user-facing error string if the display name is invalid or
 * already exists in the catalog. Returns "" if the name is valid and unique.
 *
 * @param name    - raw value from the text input (may be untrimmed)
 * @param catalog - current player catalog from the API
 */
export function getRegisterPlayerError(
  name: string,
  catalog: { id: string; displayName: string }[],
): string {
  if (name.trim() === "") return "Player name cannot be empty."
  if (findDuplicateByName(catalog, name.trim()) !== null) {
    return `A player named '${name.trim()}' already exists.`
  }
  return ""
}

export default function RegisterPlayerPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [catalog, setCatalog] = useState<PlayerApiRecord[]>([])
  const [submitError, setSubmitError] = useState("")
  const [successName, setSuccessName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    searchPlayers("").then(setCatalog).catch(() => setCatalog([]))
  }, [])

  const refreshCatalog = async () => {
    try {
      const players = await searchPlayers("")
      setCatalog(players)
    } catch {
      setCatalog([])
    }
  }

  // Inline duplicate check — shown while typing, cleared on empty input
  const existingPlayer = name.trim() ? findDuplicateByName(catalog, name.trim()) : null

  const handleSubmit = async () => {
    const error = getRegisterPlayerError(name, catalog)
    if (error) {
      setSubmitError(error)
      return
    }

    setIsSubmitting(true)
    setSubmitError("")
    setSuccessName("")

    try {
      const newPlayer = await createPlayer(name.trim())
      setCatalog((current) => [...current, newPlayer])
      setSuccessName(name.trim())
      setName("")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to register player.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-shell">
      <header className="page-header panel">
        <h1 className="page-title">Register Player</h1>
        <p className="page-subtitle">Add a new player to the roster</p>
      </header>

      <section className="panel form-grid">
        <label htmlFor="player-name">Display name</label>
        <input
          id="player-name"
          className="input"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSubmitError("")
          }}
          disabled={isSubmitting}
          placeholder="Enter player name"
        />

        {/* Inline "already registered" hint while typing */}
        {existingPlayer && !submitError && (
          <p className="muted" role="status">
            &apos;{existingPlayer.displayName}&apos; is already registered.
          </p>
        )}

        {submitError && (
          <p className="warning-text" role="alert">{submitError}</p>
        )}

        {successName && (
          <p role="status">
            Player &apos;{successName}&apos; registered.{" "}
            <button className={withInteractiveSurface("button-secondary")} onClick={() => setSuccessName("")}>
              Register Another
            </button>
          </p>
        )}

        <OcrImportPanel
          catalog={catalog}
          mode="register"
          onPlayerCreated={() => void refreshCatalog()}
          onConfirmRoster={() => {}}
          onConfirmRegister={async (names) => {
            const registered: string[] = []
            for (const n of names) {
              try {
                const player = await createPlayer(n)
                setCatalog((prev) => [...prev, player])
                registered.push(n)
              } catch {
                // individual failure — continue to next name
              }
            }
            if (registered.length > 0) {
              setSuccessName(registered.join(", "))
            }
          }}
        />

        <div className="action-row">
          <button
            aria-label="Main menu"
            className={withInteractiveSurface("button-secondary")}
            onClick={() => navigate("/")}
          >
            Main Menu
          </button>
          <button
            className={withInteractiveSurface("button")}
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !!existingPlayer}
          >
            {isSubmitting ? "Saving…" : "Register Player"}
          </button>
        </div>
      </section>
    </section>
  )
}
