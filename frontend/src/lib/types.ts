export type EventType = "Americano" | "Mexicano" | "BeatTheBox"

export type MatchStatus = "Pending" | "Completed"

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

export type ProgressSummaryPlayerRow = {
  playerId: string
  displayName: string
  cells: ProgressSummaryPlayerCell[]
}

export type FinalEventSummary = {
  mode: "final"
  eventId: string
  finalStandings: SummaryStanding[]
  rounds: SummaryRound[]
  matches: SummaryMatch[]
  columns: ProgressSummaryColumn[]
  playerRows: ProgressSummaryPlayerRow[]
}

export type InProgressEventSummary = {
  mode: "progress"
  eventId: string
  columns: ProgressSummaryColumn[]
  playerRows: ProgressSummaryPlayerRow[]
}

export type EventSummaryResponse = FinalEventSummary | InProgressEventSummary
