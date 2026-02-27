import type { AssignedPlayer } from "./draftPlayers"
import { normalizePlayerName } from "../../lib/playerNames"

export const LISTBOX_NAVIGATION_KEYS = {
  next: "ArrowDown",
  previous: "ArrowUp",
  select: "Enter",
  close: "Escape",
} as const

export function filterPrefixSuggestions(catalog: AssignedPlayer[], query: string): AssignedPlayer[] {
  const normalizedQuery = normalizePlayerName(query)
  if (normalizedQuery.length < 1) return []

  return catalog.filter((player) => normalizePlayerName(player.displayName).startsWith(normalizedQuery))
}

export function getListboxOptionId(playerId: string): string {
  return `player-option-${playerId}`
}

export function getInitialActiveSuggestionIndex(suggestions: AssignedPlayer[]): number {
  return suggestions.length > 0 ? 0 : -1
}

export function getNextActiveSuggestionIndex(input: {
  key: string
  activeIndex: number
  suggestionCount: number
}): number {
  const { key, activeIndex, suggestionCount } = input
  if (suggestionCount < 1) return -1

  if (key === LISTBOX_NAVIGATION_KEYS.next) {
    if (activeIndex < 0) return 0
    return (activeIndex + 1) % suggestionCount
  }

  if (key === LISTBOX_NAVIGATION_KEYS.previous) {
    if (activeIndex < 0) return suggestionCount - 1
    return (activeIndex - 1 + suggestionCount) % suggestionCount
  }

  return activeIndex
}

export function getActiveSuggestion(
  suggestions: AssignedPlayer[],
  activeIndex: number,
): AssignedPlayer | null {
  if (activeIndex < 0 || activeIndex >= suggestions.length) return null
  return suggestions[activeIndex] ?? null
}

export function findDuplicateByName(catalog: AssignedPlayer[], displayName: string): AssignedPlayer | null {
  const normalizedDisplayName = normalizePlayerName(displayName)
  return catalog.find((player) => normalizePlayerName(player.displayName) === normalizedDisplayName) ?? null
}
