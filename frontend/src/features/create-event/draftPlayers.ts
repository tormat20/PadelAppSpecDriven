export type AssignedPlayer = {
  id: string
  displayName: string
}

const ACTIVE_DRAFT_KEY = "create-event:active-draft:players"

export function loadDraftPlayers(): AssignedPlayer[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(ACTIVE_DRAFT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AssignedPlayer[]
    if (!Array.isArray(parsed)) return []

    return parsed.filter((p) => typeof p?.id === "string" && typeof p?.displayName === "string")
  } catch {
    return []
  }
}

export function saveDraftPlayers(players: AssignedPlayer[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(players))
}

export function clearDraftPlayers() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACTIVE_DRAFT_KEY)
}
