import { normalizePlayerName } from "./playerNames"
import type {
  CreateEventPayload,
  EventRecord,
  EventSummaryResponse,
  FinalEventSummary,
  InProgressEventSummary,
  UpdateEventPayload,
} from "./types"

const API_BASE = "http://127.0.0.1:8000/api/v1"

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  EVENT_NOT_FOUND: "Event could not be found. Refresh and try again.",
  EVENT_NOT_READY: "Event setup is incomplete. Add courts and players before starting.",
  EVENT_ALREADY_STARTED: "Event is already started. Open it from Resume Event.",
  EVENT_ALREADY_FINISHED: "Event is already finished. Open the summary or restart it.",
  EVENT_NOT_ONGOING: "Event is not running right now.",
  EVENT_NOT_AT_FINAL_ROUND: "Finish is available only after the final round is complete.",
  EVENT_RESTART_NOT_ALLOWED: "Only ongoing or finished events can be restarted.",
  EVENT_FINAL_ROUND_REACHED: "Final round reached. Finish the event to see summary.",
  ROUND_NOT_FOUND: "No active round found. Start or resume the event first.",
  ROUND_PENDING_RESULTS: "Submit all match results before moving to the next round.",
}

export class ApiError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

type ErrorDetail = {
  code?: string
  message?: string
}

function getFriendlyMessage(detail: ErrorDetail, fallback: string): string {
  const codeMessage = detail.code ? ERROR_MESSAGE_BY_CODE[detail.code] : ""
  if (codeMessage) return codeMessage
  if (detail.message && detail.message.trim().length > 0) return detail.message
  return fallback
}

export type PlayerApiRecord = { id: string; displayName: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })
  if (!response.ok) {
    let detail: ErrorDetail = {}
    try {
      const json = await response.json()
      if (typeof json?.detail === "string") {
        detail = { message: json.detail }
      } else if (json?.detail && typeof json.detail === "object") {
        detail = json.detail as ErrorDetail
      } else if (typeof json?.message === "string") {
        detail = { message: json.message }
      }
    } catch {
      detail = {}
    }

    const fallback = response.status >= 500 ? "Server error. Please try again." : "Request failed."
    throw new ApiError(getFriendlyMessage(detail, fallback), response.status, detail.code)
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

export async function createEvent(payload: CreateEventPayload): Promise<EventRecord> {
  return request("/events", { method: "POST", body: JSON.stringify(payload) })
}

export async function listEvents(): Promise<EventRecord[]> {
  return request("/events")
}

export async function getEvent(id: string): Promise<EventRecord> {
  return request(`/events/${id}`)
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<EventRecord> {
  return request(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export async function deleteEvent(id: string): Promise<void> {
  await request(`/events/${id}`, { method: "DELETE" })
}

export async function startEvent(id: string): Promise<any> {
  return request(`/events/${id}/start`, { method: "POST" })
}

export async function restartEvent(id: string): Promise<EventRecord> {
  return request(`/events/${id}/restart`, { method: "POST" })
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

function normalizeProgressSummaryResponse(payload: any, eventId: string): InProgressEventSummary {
  const rows = Array.isArray(payload?.playerRows)
    ? payload.playerRows.map((row: any, index: number) => ({
        rank: typeof row?.rank === "number" ? row.rank : index + 1,
        playerId: row?.playerId ?? "",
        displayName: row?.displayName ?? "",
        cells: Array.isArray(row?.cells) ? row.cells : [],
      }))
    : []

  return {
    mode: "progress",
    eventId: payload?.eventId ?? eventId,
    orderingMode: payload?.orderingMode ?? "legacy",
    orderingVersion: payload?.orderingVersion ?? "v1",
    columns: Array.isArray(payload?.columns) ? payload.columns : [],
    playerRows: rows,
  }
}

function normalizeFinalSummaryResponse(payload: any, eventId: string): FinalEventSummary {
  const rows = Array.isArray(payload?.playerRows)
    ? payload.playerRows.map((row: any, index: number) => ({
        rank: typeof row?.rank === "number" ? row.rank : index + 1,
        playerId: row?.playerId ?? "",
        displayName: row?.displayName ?? "",
        cells: Array.isArray(row?.cells) ? row.cells : [],
      }))
    : []

  return {
    mode: "final",
    eventId: payload.eventId ?? eventId,
    orderingMode: payload.orderingMode ?? "legacy",
    orderingVersion: payload.orderingVersion ?? "v1",
    finalStandings: payload.finalStandings ?? [],
    crownedPlayerIds: payload.crownedPlayerIds ?? [],
    rounds: payload.rounds ?? [],
    matches: payload.matches ?? [],
    columns: payload.columns ?? [],
    playerRows: rows,
  }
}

export async function getEventSummary(eventId: string): Promise<EventSummaryResponse> {
  try {
    const summary = await request<unknown>(`/events/${eventId}/summary`)
    if (isProgressSummaryResponse(summary)) return normalizeProgressSummaryResponse(summary, eventId)
    return normalizeFinalSummaryResponse(summary, eventId)
  } catch {
    const legacySummary = await finishEvent(eventId)
    return normalizeFinalSummaryResponse(legacySummary, eventId)
  }
}
