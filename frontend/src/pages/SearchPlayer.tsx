import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { searchPlayers } from "../lib/api"
import type { PlayerApiRecord } from "../lib/api"

function filterPlayers(players: PlayerApiRecord[], query: string): PlayerApiRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return players
  return players.filter((p) => p.displayName.toLowerCase().includes(q))
}

export default function SearchPlayerPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [catalog, setCatalog] = useState<PlayerApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    searchPlayers("")
      .then((players) => {
        setCatalog(players)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load players. Check your connection.")
        setLoading(false)
      })
  }, [])

  const filtered = filterPlayers(catalog, query)

  return (
    <section className="page-shell">
      <header className="page-header panel">
        <h1 className="page-title">Search Player</h1>
        <p className="page-subtitle">Find a player and view their stats</p>
      </header>

      <section className="panel">
        <label htmlFor="player-search-input" className="player-search-label">
          Search by name
        </label>
        <input
          id="player-search-input"
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a player name…"
          aria-label="Search players by name"
          autoComplete="off"
        />
      </section>

      {loading && (
        <section className="panel player-search-empty-state">
          <p className="muted">Loading players…</p>
        </section>
      )}

      {!loading && error && (
        <section className="panel player-search-empty-state">
          <p className="warning-text" role="alert">{error}</p>
        </section>
      )}

      {!loading && !error && filtered.length === 0 && (
        <section className="panel player-search-empty-state">
          <p className="muted">
            {query.trim() ? `No players matching "${query.trim()}".` : "No players registered yet."}
          </p>
        </section>
      )}

      {!loading && !error && filtered.length > 0 && (
        <section className="panel">
          <ul className="player-search-list" role="list">
            {filtered.map((player) => (
              <li key={player.id} className="player-search-item">
                <button
                  type="button"
                  className={withInteractiveSurface("player-search-row")}
                  onClick={() => navigate(`/players/${player.id}/stats`)}
                  aria-label={`View stats for ${player.displayName}`}
                >
                  <span className="player-search-name">{player.displayName}</span>
                  <span className="player-search-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3 13L13 3M13 3H6M13 3V10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="action-row">
          <button
            aria-label="Main menu"
            className={withInteractiveSurface("button-secondary")}
            onClick={() => navigate("/")}
          >
            Main Menu
          </button>
        </div>
      </section>
    </section>
  )
}
