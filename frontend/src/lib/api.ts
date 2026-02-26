import { normalizePlayerName } from "./playerNames"
import type {
  EventSummaryResponse,
  FinalEventSummary,
  InProgressEventSummary,
} from "./types"

const API_BASE = "http://127.0.0.1:8000/api/v1"

export type PlayerApiRecord = { id: string; displayName: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function createPlayer(displayName: string): Promise<PlayerApiRecord> {
  return request("/players", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  })
}

export async function searchPlayers(query = ""): Promise<PlayerApiRecord[]> {
  const q = query ? `?query=${encodeURIComponent(query)}` : ""
  return request(`/players${q}`)
}

export async function searchPlayersByPrefix(prefix: string): Promise<PlayerApiRecord[]> {
  return searchPlayers(prefix)
}

export async function createOrReusePlayer(
  displayName: string,
  catalog: PlayerApiRecord[],
): Promise<{ player: PlayerApiRecord; reused: boolean }> {
  const normalizedDisplayName = normalizePlayerName(displayName)
  const existing = catalog.find(
    (player) => normalizePlayerName(player.displayName) === normalizedDisplayName,
  )

  if (existing) {
    return { player: existing, reused: true }
  }

  const player = await createPlayer(displayName.trim())
  return { player, reused: false }
}

export async function createEvent(payload: unknown): Promise<{ id: string }> {
  return request("/events", { method: "POST", body: JSON.stringify(payload) })
}

export async function getEvent(id: string): Promise<any> {
  return request(`/events/${id}`)
}

export async function startEvent(id: string): Promise<any> {
  return request(`/events/${id}/start`, { method: "POST" })
}

export async function getCurrentRound(eventId: string): Promise<any> {
  return request(`/events/${eventId}/rounds/current`)
}

export async function submitResult(matchId: string, payload: unknown): Promise<void> {
  await request(`/matches/${matchId}/result`, { method: "POST", body: JSON.stringify(payload) })
}

export async function nextRound(eventId: string): Promise<any> {
  return request(`/events/${eventId}/next`, { method: "POST" })
}

export async function finishEvent(eventId: string): Promise<any> {
  return request(`/events/${eventId}/finish`, { method: "POST" })
}

function isProgressSummaryResponse(payload: unknown): payload is InProgressEventSummary {
  if (!payload || typeof payload !== "object") return false
  const candidate = payload as Partial<InProgressEventSummary>
  return candidate.mode === "progress" && Array.isArray(candidate.playerRows) && Array.isArray(candidate.columns)
}

function normalizeFinalSummaryResponse(payload: any, eventId: string): FinalEventSummary {
  return {
    mode: "final",
    eventId: payload.eventId ?? eventId,
    finalStandings: payload.finalStandings ?? [],
    rounds: payload.rounds ?? [],
    matches: payload.matches ?? [],
    columns: payload.columns ?? [],
    playerRows: payload.playerRows ?? [],
  }
}

export async function getEventSummary(eventId: string): Promise<EventSummaryResponse> {
  try {
    const summary = await request<unknown>(`/events/${eventId}/summary`)
    if (isProgressSummaryResponse(summary)) return summary
    return normalizeFinalSummaryResponse(summary, eventId)
  } catch {
    const legacySummary = await finishEvent(eventId)
    return normalizeFinalSummaryResponse(legacySummary, eventId)
  }
}
