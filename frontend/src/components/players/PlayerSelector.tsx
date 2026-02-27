import { useEffect, useMemo, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import { createOrReusePlayer, searchPlayers, searchPlayersByPrefix } from "../../lib/api"
import type { AssignedPlayer } from "../../features/create-event/draftPlayers"
import { PLAYER_MESSAGES } from "../../features/create-event/playerMessages"
import {
  filterPrefixSuggestions,
  getActiveSuggestion,
  getInitialActiveSuggestionIndex,
  getListboxOptionId,
  getNextActiveSuggestionIndex,
  LISTBOX_NAVIGATION_KEYS,
} from "../../features/create-event/playerSearch"

type Props = {
  assignedPlayers: AssignedPlayer[]
  onAssignedPlayersChange: (players: AssignedPlayer[]) => void
}

export const PLAYER_SECTION_TITLE = "Players"

export function addAssignedPlayer(players: AssignedPlayer[], player: AssignedPlayer): AssignedPlayer[] {
  if (players.some((assigned) => assigned.id === player.id)) return players
  return [...players, player]
}

export function removeAssignedPlayer(players: AssignedPlayer[], playerId: string): AssignedPlayer[] {
  return players.filter((player) => player.id !== playerId)
}

export function getAddPlayerMessage(reused: boolean) {
  return reused ? PLAYER_MESSAGES.reusedAndAssigned : PLAYER_MESSAGES.createdAndAssigned
}

export function PlayerSelector({ assignedPlayers, onAssignedPlayersChange }: Props) {
  const [query, setQuery] = useState("")
  const [catalog, setCatalog] = useState<AssignedPlayer[]>([])
  const [prefixMatches, setPrefixMatches] = useState<AssignedPlayer[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [statusMessage, setStatusMessage] = useState("")

  const refreshCatalog = async () => {
    try {
      const data = await searchPlayers("")
      setCatalog(data)
    } catch {
      setStatusMessage("Cannot reach backend player service.")
    }
  }

  useEffect(() => {
    void refreshCatalog()
  }, [])

  const updateMatches = useMemo(() => {
    return (value: string, source: AssignedPlayer[]) => {
      if (value.trim().length < 1) {
        setPrefixMatches([])
        setActiveSuggestionIndex(-1)
        return
      }

      const matches = filterPrefixSuggestions(source, value)
      setPrefixMatches(matches)
      setActiveSuggestionIndex(getInitialActiveSuggestionIndex(matches))
    }
  }, [])

  const onQueryChange = (value: string) => {
    setQuery(value)
    updateMatches(value, catalog)
  }

  const runPrefixSearch = async (term: string) => {
      if (term.trim().length < 1) {
        setPrefixMatches([])
        setActiveSuggestionIndex(-1)
        return
      }

    try {
      const matches = await searchPlayersByPrefix(term)
      setPrefixMatches(matches)
      setActiveSuggestionIndex(getInitialActiveSuggestionIndex(matches))
      if (matches.length === 0) {
        setStatusMessage(PLAYER_MESSAGES.emptySearch)
      }
    } catch {
      setStatusMessage("Cannot reach backend player service.")
    }
  }

  const assignPlayer = (player: AssignedPlayer) => {
    onAssignedPlayersChange(addAssignedPlayer(assignedPlayers, player))
  }

  const assignSuggestion = (player: AssignedPlayer) => {
    assignPlayer(player)
    setStatusMessage(`Assigned ${player.displayName}.`)
    setQuery("")
    setPrefixMatches([])
    setActiveSuggestionIndex(-1)
  }

  const unassignPlayer = (playerId: string) => {
    onAssignedPlayersChange(removeAssignedPlayer(assignedPlayers, playerId))
  }

  const addOrReuse = async () => {
    if (!query.trim()) return

    try {
      const { player, reused } = await createOrReusePlayer(query, catalog)
      setCatalog((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]))
      assignPlayer(player)
      setStatusMessage(getAddPlayerMessage(reused))
      setQuery("")
      setPrefixMatches([])
      setActiveSuggestionIndex(-1)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cannot reach backend player service."
      setStatusMessage(message || "Cannot reach backend player service.")
    }
  }

  const onAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void addOrReuse()
  }

  const onQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === LISTBOX_NAVIGATION_KEYS.close) {
      setActiveSuggestionIndex(-1)
      return
    }

    if (
      event.key !== LISTBOX_NAVIGATION_KEYS.next &&
      event.key !== LISTBOX_NAVIGATION_KEYS.previous &&
      event.key !== LISTBOX_NAVIGATION_KEYS.select
    ) {
      return
    }

    if (event.key === LISTBOX_NAVIGATION_KEYS.select) {
      const activeSuggestion = getActiveSuggestion(prefixMatches, activeSuggestionIndex)
      if (activeSuggestion) {
        event.preventDefault()
        assignSuggestion(activeSuggestion)
      }
      return
    }

    event.preventDefault()
    setActiveSuggestionIndex((currentIndex) =>
      getNextActiveSuggestionIndex({
        key: event.key,
        activeIndex: currentIndex,
        suggestionCount: prefixMatches.length,
      }),
    )
  }

  const activeSuggestion = getActiveSuggestion(prefixMatches, activeSuggestionIndex)
  const activeOptionId = activeSuggestion ? getListboxOptionId(activeSuggestion.id) : undefined

  return (
    <div className="list-stack" aria-label="Player selector">
      <h3 className="section-title">{PLAYER_SECTION_TITLE}</h3>
      <form className="player-search-row" onSubmit={onAddSubmit}>
        <input
          className="input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onQueryKeyDown}
          placeholder="Search or create player"
          role="combobox"
          aria-controls="player-suggestion-listbox"
          aria-expanded={query.trim().length > 0}
          aria-activedescendant={activeOptionId}
        />
        <button className={withInteractiveSurface("button-secondary")} type="button" onClick={() => runPrefixSearch(query)}>Search</button>
        <button className={withInteractiveSurface("button")} type="submit" disabled={!query.trim()}>
          Add New
        </button>
      </form>

      {statusMessage ? <p className="muted">{statusMessage}</p> : null}

      <section className="list-stack" aria-label="Search suggestions">
        <div className="player-listbox" role="listbox" id="player-suggestion-listbox" aria-label="Player suggestions">
          {query.trim().length >= 1 && prefixMatches.length === 0 ? (
            <p className="muted player-listbox-empty">{PLAYER_MESSAGES.emptySearch}</p>
          ) : (
            prefixMatches.map((player, index) => {
              const assigned = assignedPlayers.some((p) => p.id === player.id)
              const isActive = activeSuggestionIndex === index

              return (
                <button
                  key={player.id}
                  id={getListboxOptionId(player.id)}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={withInteractiveSurface("player-listbox-option")}
                  data-active={isActive}
                  disabled={assigned}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  onClick={() => assignSuggestion(player)}
                >
                  <span>{player.displayName}</span>
                  {assigned ? <span className="tag">Assigned</span> : null}
                </button>
              )
            })
          )}
        </div>
      </section>

      <section className="list-stack" aria-label="Assigned players">
        <h3 className="section-title">Assigned</h3>
        {assignedPlayers.length === 0 ? (
          <p className="muted">{PLAYER_MESSAGES.emptyAssigned}</p>
        ) : (
          <div className="player-list">
            {assignedPlayers.map((player) => (
              <div className="player-item" key={player.id}>
                  <button className={withInteractiveSurface("row-action row-action-remove")} onClick={() => unassignPlayer(player.id)} type="button">
                  -
                </button>
                <span>{player.displayName}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="visually-hidden" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  )
}
