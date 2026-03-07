export type EventType = "WinnersCourt" | "Mexicano" | "RankedBox"

export type MatchStatus = "Pending" | "Completed"

export type SetupStatus = "planned" | "ready"

export type PlanningWarnings = {
  pastDateTime: boolean
  duplicateSlot: boolean
  duplicateCount: number
}

export type EventRecord = {
  id: string
  eventName: string
  eventType: EventType
  eventDate: string
  eventTime24h?: string | null
  status: "Lobby" | "Running" | "Finished"
  setupStatus: SetupStatus
  lifecycleStatus?: "planned" | "ready" | "ongoing" | "finished"
  missingRequirements: string[]
  warnings: PlanningWarnings
  version: number
  selectedCourts: number[]
  playerIds: string[]
  currentRoundNumber: number | null
  totalRounds: number
  isTeamMexicano?: boolean
}

export type CreateActionType = "create_event" | "create_event_slot"

export type CreateEventPayload = {
  eventName: string
  eventType: EventType
  eventDate: string
  eventTime24h: string
  createAction: CreateActionType
  selectedCourts: number[]
  playerIds: string[]
  isTeamMexicano?: boolean
}

export type UpdateEventPayload = {
  expectedVersion: number
  eventName?: string
  eventType?: EventType
  eventDate?: string
  eventTime24h?: string
  selectedCourts?: number[]
  playerIds?: string[]
  isTeamMexicano?: boolean
}

export type EventTeam = {
  id: string
  eventId: string
  player1Id: string
  player2Id: string
}

export type SubstitutePlayerPayload = {
  departingPlayerId: string
  substitutePlayerId: string
}

export type Player = {
  id: string
  displayName: string
  globalRankingPoints?: number
}

export type Team = {
  players: Player[]
}

export type MatchView = {
  matchId: string
  courtNumber: number
  teamA: Team
  teamB: Team
  inputType: "WinLoss" | "Score24" | "WinLossDraw"
  status: MatchStatus
}

export type RunEventTeamBadgeView = {
  team1?: string
  team2?: string
}

export type RoundView = {
  eventId: string
  eventType: EventType
  roundIndex: number
  totalRounds: number
  selectedCourts: number[]
  matches: MatchView[]
  canAdvance: boolean
}

export type SummaryMode = "progress" | "final"

export type SummaryStanding = {
  playerId: string
  displayName: string
  totalScore: number
  rank: number
}

export type SummaryMatch = {
  matchId: string
  courtNumber: number
}

export type SummaryRound = {
  roundNumber: number
}

export type ProgressSummaryColumn = {
  id: string
  label: string
}

export type ProgressSummaryPlayerCell = {
  columnId: string
  value: string
}

export type SummaryRoundCell = ProgressSummaryPlayerCell

export type ProgressSummaryPlayerRow = {
  rank: number
  playerId: string
  displayName: string
  cells: ProgressSummaryPlayerCell[]
}

export type FinalEventSummary = {
  mode: "final"
  eventId: string
  eventType: EventType
  orderingMode: string
  orderingVersion: string
  finalStandings: SummaryStanding[]
  crownedPlayerIds: string[]
  rounds: SummaryRound[]
  matches: SummaryMatch[]
  columns: ProgressSummaryColumn[]
  playerRows: ProgressSummaryPlayerRow[]
}

export type InProgressEventSummary = {
  mode: "progress"
  eventId: string
  orderingMode: string
  orderingVersion: string
  columns: ProgressSummaryColumn[]
  playerRows: ProgressSummaryPlayerRow[]
}

export type EventSummaryResponse = FinalEventSummary | InProgressEventSummary

// ── Player stats ──────────────────────────────────────────────────────────────

export type PlayerStats = {
  playerId: string
  displayName: string
  mexicanoScoreTotal: number
  rbScoreTotal: number
  eventsAttended: number
  wcMatchesPlayed: number
  wcWins: number
  wcLosses: number
  rbWins: number
  rbLosses: number
  rbDraws: number
}

// ── Leaderboards ──────────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  rank: number
  playerId: string
  displayName: string
  eventsPlayed: number
  mexicanoScore: number
  rbScore: number
}

export type Leaderboard = {
  year: number
  month: number
  entries: LeaderboardEntry[]
}

// ── Ranked Box Ladder (all-time) ──────────────────────────────────────────────

export type RankedBoxLadderEntry = {
  rank: number
  playerId: string
  displayName: string
  rbScoreTotal: number
  rbWins: number
  rbLosses: number
  rbDraws: number
}

export type RankedBoxLadder = {
  entries: RankedBoxLadderEntry[]
}
