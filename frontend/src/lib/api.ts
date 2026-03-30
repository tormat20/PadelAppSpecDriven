import { normalizePlayerName } from "./playerNames"
import type { StagedCalendarChangeSet } from "../components/calendar/stagedChangeTypes"
import type {
  OcrCorrectionRecord,
  OcrCorrectionResolveRequest,
  OcrCorrectionResolveResponse,
  OcrCorrectionUpsertRequest,
} from "../features/ocr/correctionTypes"
import type {
  CreateEventPayload,
  EventRecord,
  EventSummaryResponse,
  EventType,
  FinalEventSummary,
  InlineSummaryView,
  InProgressEventSummary,
  Leaderboard,
  LeaderboardEntry,
  MexicanoHighscore,
  MexicanoHighscoreEntry,
  PlayerDeepDive,
  PlayerStats,
  PreviousRoundResponse,
  RankedBoxLadder,
  RankedBoxLadderEntry,
  ScoreCorrectionPayload,
  ScoreCorrectionResponse,
  UpdateEventPayload,
} from "./types"

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000") + "/api/v1"

export const PREVIOUS_ROUND_BOUNDARY_WARNING = "Round 1 is the first round. You cannot go back further."

// ---------------------------------------------------------------------------
// Auth token helpers — stored in localStorage under key "auth_token"
// ---------------------------------------------------------------------------

const TOKEN_KEY = "auth_token"

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export type AuthTokenResponse = { access_token: string }
export type MeResponse = { id: string; email: string; role: string }

export async function loginUser(email: string, password: string): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function registerUser(email: string, password: string): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me")
}

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  EVENT_NOT_FOUND: "Event could not be found. Refresh and try again.",
  EVENT_NOT_READY: "Event setup is incomplete. Add courts and players before starting.",
  EVENT_ALREADY_STARTED: "Event is already started. Open it from Resume Event.",
  EVENT_ALREADY_FINISHED: "Event is already finished. Open the summary or restart it.",
  EVENT_NOT_ONGOING: "Event is not running right now.",
  EVENT_NOT_AT_FINAL_ROUND: "Finish is available only after the final round is complete.",
  EVENT_RESTART_NOT_ALLOWED: "Only ongoing or finished events can be restarted.",
  EVENT_FINAL_ROUND_REACHED: "Final round reached. Finish the event to see summary.",
  EVENT_MODE_CHANGE_BLOCKED: "Event mode cannot be changed after the event has started.",
  EVENT_NOT_TEAM_MEXICANO: "This event is not a Team Mexicano event.",
  PLAYER_NOT_IN_EVENT: "The selected player is not part of this event.",
  SUBSTITUTE_NOT_FOUND: "The substitute player could not be found.",
  SUBSTITUTE_ALREADY_IN_EVENT: "The substitute player is already in this event.",
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

export type PlayerApiRecord = { id: string; displayName: string; email?: string | null }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader, ...(init?.headers ?? {}) },
    ...init,
  })

  if (response.status === 401) {
    // Clear stored token and fire event so AuthProvider can react
    removeStoredToken()
    window.dispatchEvent(new Event("auth:logout"))
    throw new ApiError("Session expired. Please log in again.", 401)
  }

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

export async function createPlayer(displayName: string, email?: string | null): Promise<PlayerApiRecord> {
  return request("/players", {
    method: "POST",
    body: JSON.stringify({ displayName, ...(email != null ? { email } : {}) }),
  })
}

export async function searchPlayers(query = ""): Promise<PlayerApiRecord[]> {
  const q = query ? `?query=${encodeURIComponent(query)}` : ""
  return request(`/players${q}`)
}

export async function searchPlayersByPrefix(prefix: string): Promise<PlayerApiRecord[]> {
  return searchPlayers(prefix)
}

export async function deletePlayer(playerId: string): Promise<void> {
  await request<{ status: string }>(`/players/${encodeURIComponent(playerId)}`, {
    method: "DELETE",
  })
}

export async function updatePlayer(
  playerId: string,
  payload: { displayName: string; email?: string | null },
): Promise<PlayerApiRecord> {
  return request<PlayerApiRecord>(`/players/${encodeURIComponent(playerId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      displayName: payload.displayName,
      ...(payload.email !== undefined ? { email: payload.email } : {}),
    }),
  })
}

export async function upsertOcrCorrection(
  payload: OcrCorrectionUpsertRequest,
): Promise<OcrCorrectionRecord> {
  return request<OcrCorrectionRecord>("/ocr/corrections", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function resolveOcrCorrections(
  payload: OcrCorrectionResolveRequest,
): Promise<OcrCorrectionResolveResponse> {
  return request<OcrCorrectionResolveResponse>("/ocr/corrections/resolve", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function resetAllPlayerStats(): Promise<void> {
  await request<{ status: string }>("/admin/players/reset-stats", {
    method: "POST",
  })
}

export async function deleteAllPlayers(): Promise<void> {
  await request<{ status: string }>("/admin/players", {
    method: "DELETE",
  })
}

export async function createOrReusePlayer(
  displayName: string,
  catalog: PlayerApiRecord[],
  email?: string | null,
): Promise<{ player: PlayerApiRecord; reused: boolean }> {
  // Email-first dedup: if we have an email, check the catalog for a matching one first
  if (email) {
    const emailLower = email.toLowerCase()
    const emailMatch = catalog.find(
      (player) => player.email != null && player.email.toLowerCase() === emailLower,
    )
    if (emailMatch) {
      return { player: emailMatch, reused: true }
    }
  }

  const normalizedDisplayName = normalizePlayerName(displayName)
  const existing = catalog.find(
    (player) => normalizePlayerName(player.displayName) === normalizedDisplayName,
  )

  if (existing) {
    return { player: existing, reused: true }
  }

  const player = await createPlayer(displayName.trim(), email)
  return { player, reused: false }
}

export async function createEvent(payload: CreateEventPayload): Promise<EventRecord> {
  return request("/events", { method: "POST", body: JSON.stringify(payload) })
}

export async function listEvents(): Promise<EventRecord[]> {
  return request("/events")
}

export async function listEventsByDateRange(from: string, to: string): Promise<EventRecord[]> {
  return request(`/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
}

export async function getEvent(id: string): Promise<EventRecord> {
  return request(`/events/${id}`)
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<EventRecord> {
  return request(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export async function saveCalendarEventImmediately(
  id: string,
  payload: UpdateEventPayload,
): Promise<EventRecord> {
  return request(`/events/${id}/popup-save`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(id: string): Promise<void> {
  await request(`/events/${id}`, { method: "DELETE" })
}

export async function deleteAllEvents(): Promise<{ status: "deleted"; deletedCount: number }> {
  return request("/events", { method: "DELETE" })
}

export async function saveStagedCalendarChanges(
  payload: Pick<StagedCalendarChangeSet, "creates" | "updates" | "deletes">,
): Promise<{ status: "saved"; createdCount: number; updatedCount: number; deletedCount: number }> {
  return request("/events/staged-save", {
    method: "POST",
    body: JSON.stringify(payload),
  })
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

export async function previousRound(eventId: string): Promise<PreviousRoundResponse> {
  const response = await request<PreviousRoundResponse>(`/events/${eventId}/previous`, {
    method: "POST",
  })
  if (response.status === "blocked" && !response.warningMessage) {
    return { ...response, warningMessage: PREVIOUS_ROUND_BOUNDARY_WARNING }
  }
  return response
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
        momentumBadge:
          row?.momentumBadge === "fire" || row?.momentumBadge === "snowflake"
            ? row.momentumBadge
            : "none",
        cells: Array.isArray(row?.cells)
          ? row.cells.map((cell: any) => ({
              columnId: cell?.columnId ?? "",
              value: String(cell?.value ?? ""),
              isWinner: Boolean(cell?.isWinner),
            }))
          : [],
      }))
    : []

  return {
    mode: "progress",
    eventId: payload?.eventId ?? eventId,
    eventName: payload?.eventName ?? "",
    orderingMode: payload?.orderingMode ?? "legacy",
    orderingVersion: payload?.orderingVersion ?? "v1",
    columns: Array.isArray(payload?.columns) ? payload.columns : [],
    playerRows: rows,
    scoreRows: Array.isArray(payload?.scoreRows) ? payload.scoreRows : [],
  }
}

function normalizeFinalSummaryResponse(payload: any, eventId: string): FinalEventSummary {
  const rows = Array.isArray(payload?.playerRows)
    ? payload.playerRows.map((row: any, index: number) => ({
        rank: typeof row?.rank === "number" ? row.rank : index + 1,
        playerId: row?.playerId ?? "",
        displayName: row?.displayName ?? "",
        momentumBadge:
          row?.momentumBadge === "fire" || row?.momentumBadge === "snowflake"
            ? row.momentumBadge
            : "none",
        cells: Array.isArray(row?.cells)
          ? row.cells.map((cell: any) => ({
              columnId: cell?.columnId ?? "",
              value: String(cell?.value ?? ""),
              isWinner: Boolean(cell?.isWinner),
            }))
          : [],
      }))
    : []

  return {
    mode: "final",
    eventId: payload.eventId ?? eventId,
    eventName: payload.eventName ?? "",
    eventType: (payload.eventType ?? "WinnersCourt") as EventType,
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

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const data = await request<any>(`/players/${playerId}/stats`)
  return {
    playerId: data.player_id,
    displayName: data.display_name,
    mexicanoScoreTotal: data.mexicano_score_total ?? 0,
    americanoScoreTotal: data.americano_score_total ?? 0,
    rbScoreTotal: data.rb_score_total ?? 0,
    eventsAttended: data.events_attended ?? 0,
    wcMatchesPlayed: data.wc_matches_played ?? 0,
    wcWins: data.wc_wins ?? 0,
    wcLosses: data.wc_losses ?? 0,
    rbWins: data.rb_wins ?? 0,
    rbLosses: data.rb_losses ?? 0,
    rbDraws: data.rb_draws ?? 0,
    eventWins: data.event_wins ?? 0,
    mexicanoBestEventScore: data.mexicano_best_event_score ?? 0,
  }
}

function normalizeScore24Mode(raw: any) {
  return {
    avgScorePerRound: (raw?.avg_score_per_round ?? []).map((r: any) => ({
      round: r.round,
      avgScore: r.avg_score,
      sampleCount: r.sample_count,
    })),
    avgCourtPerRound: (raw?.avg_court_per_round ?? []).map((r: any) => ({
      round: r.round,
      avgCourt: r.avg_court,
      sampleCount: r.sample_count,
    })),
    avgCourtOverall: raw?.avg_court_overall ?? null,
    matchWdl: {
      wins: raw?.match_wdl?.wins ?? 0,
      draws: raw?.match_wdl?.draws ?? 0,
      losses: raw?.match_wdl?.losses ?? 0,
    },
  }
}

export async function getPlayerDeepDive(playerId: string): Promise<PlayerDeepDive> {
  const data = await request<any>(`/players/${playerId}/stats/deep-dive`)
  return {
    mexicano: normalizeScore24Mode(data.mexicano),
    americano: normalizeScore24Mode(data.americano),
    teamMexicano: normalizeScore24Mode(data.team_mexicano),
    rankedBox: {
      perRoundWdl: (data.ranked_box?.per_round_wdl ?? []).map((r: any) => ({
        round: r.round,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
      })),
      eloTimeline: (data.ranked_box?.elo_timeline ?? []).map((p: any) => ({
        eventDate: p.event_date,
        cumulativeScore: p.cumulative_score,
      })),
    },
    winnersCourt: {
      perRoundWdl: (data.winners_court?.per_round_wdl ?? []).map((r: any) => ({
        round: r.round,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
      })),
    },
  }
}

function normalizeLeaderboardEntry(raw: any, rank: number): LeaderboardEntry {
  return {
    rank: raw.rank ?? rank,
    playerId: raw.player_id,
    displayName: raw.display_name,
    eventsPlayed: raw.events_played ?? 0,
    mexicanoScore: raw.mexicano_score ?? 0,
    rbScore: raw.rb_score ?? 0,
  }
}

function normalizeLeaderboard(data: any): Leaderboard {
  const entries: LeaderboardEntry[] = Array.isArray(data.entries)
    ? data.entries.map((e: any, i: number) => normalizeLeaderboardEntry(e, i + 1))
    : []
  return { year: data.year, month: data.month, entries }
}

export async function getPlayerOfMonthLeaderboard(): Promise<Leaderboard> {
  const data = await request<any>("/leaderboards/player-of-month")
  return normalizeLeaderboard(data)
}

export async function getMexicanoOfMonthLeaderboard(): Promise<Leaderboard> {
  const data = await request<any>("/leaderboards/mexicano-of-month")
  return normalizeLeaderboard(data)
}

function normalizeRankedBoxLadderEntry(raw: any, rank: number): RankedBoxLadderEntry {
  return {
    rank: raw.rank ?? rank,
    playerId: raw.player_id,
    displayName: raw.display_name,
    rbScoreTotal: raw.rb_score_total ?? 0,
    rbWins: raw.rb_wins ?? 0,
    rbLosses: raw.rb_losses ?? 0,
    rbDraws: raw.rb_draws ?? 0,
  }
}

export async function getRankedBoxLadder(): Promise<RankedBoxLadder> {
  const data = await request<any>("/leaderboards/ranked-box-ladder")
  const entries: RankedBoxLadderEntry[] = Array.isArray(data.entries)
    ? data.entries.map((e: any, i: number) => normalizeRankedBoxLadderEntry(e, i + 1))
    : []
  return { entries }
}

function normalizeMexicanoHighscoreEntry(raw: any, rank: number): MexicanoHighscoreEntry {
  return {
    rank: raw.rank ?? rank,
    playerId: raw.player_id,
    displayName: raw.display_name,
    mexicanoBestEventScore: raw.mexicano_best_event_score ?? 0,
  }
}

export async function getMexicanoHighscore(): Promise<MexicanoHighscore> {
  const data = await request<any>("/leaderboards/mexicano-highscore")
  const entries: MexicanoHighscoreEntry[] = Array.isArray(data.entries)
    ? data.entries.map((e: any, i: number) => normalizeMexicanoHighscoreEntry(e, i + 1))
    : []
  return { entries }
}

export async function getOnFirePlayerIds(): Promise<string[]> {
  const data = await request<any>("/players/on-fire")
  return Array.isArray(data.player_ids) ? data.player_ids : []
}

// ---------------------------------------------------------------------------
// Team Mexicano — Teams API
// ---------------------------------------------------------------------------


export type TeamPair = { player1Id: string; player2Id: string }
export type TeamRecord = { id: string; eventId: string; player1Id: string; player2Id: string }
export type TeamsResponse = { teams: TeamRecord[] }

export async function getEventTeams(eventId: string): Promise<TeamsResponse> {
  return request<TeamsResponse>(`/events/${eventId}/teams`)
}

export async function setEventTeams(eventId: string, teams: TeamPair[]): Promise<TeamsResponse> {
  return request<TeamsResponse>(`/events/${eventId}/teams`, {
    method: "POST",
    body: JSON.stringify({ teams }),
  })
}

// ---------------------------------------------------------------------------
// Substitution API
// ---------------------------------------------------------------------------

export type SubstitutePlayerPayload = { departingPlayerId: string; substitutePlayerId: string }
export type SubstitutePlayerResponse = {
  substitutionId: string
  eventId: string
  departingPlayerId: string
  substitutePlayerId: string
  effectiveFromRound: number
}

export async function substitutePlayer(
  eventId: string,
  payload: SubstitutePlayerPayload,
): Promise<SubstitutePlayerResponse> {
  return request<SubstitutePlayerResponse>(`/events/${eventId}/substitute`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
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

export async function getOngoingInlineSummary(eventId: string): Promise<InlineSummaryView> {
  const summary = await getEventSummary(eventId)
  const progressRows = summary.playerRows
  const scoreRows = summary.mode === "progress" ? (summary.scoreRows ?? []) : []
  return {
    eventId,
    isExpanded: true,
    columns: summary.columns,
    playerRows: progressRows,
    scoreRows,
  }
}

export async function correctMatchResult(
  matchId: string,
  payload: ScoreCorrectionPayload,
): Promise<ScoreCorrectionResponse> {
  return request<ScoreCorrectionResponse>(`/matches/${matchId}/result`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
