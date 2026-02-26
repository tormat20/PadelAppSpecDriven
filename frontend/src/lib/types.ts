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
