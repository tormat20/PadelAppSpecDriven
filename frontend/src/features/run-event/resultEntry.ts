import { submitResult } from "../../lib/api"

export type WinnerSelectionMap = Record<string, string>

type AmericanoPayload = { mode: "Americano"; winningTeam: 1 | 2 }
type MexicanoPayload = { mode: "Mexicano"; team1Score: number; team2Score: number }
type BeatTheBoxPayload = { mode: "BeatTheBox"; outcome: "Team1Win" | "Team2Win" | "Draw" }

export type WinnerPayload = AmericanoPayload | MexicanoPayload | BeatTheBoxPayload
export type TeamSide = 1 | 2
export type RelativeOutcome = "Win" | "Loss" | "Draw"
export type TeamBadgePair = { team1: string; team2: string }

export async function submitAmericanoWin(matchId: string, winningTeam: 1 | 2) {
  await submitResult(matchId, { mode: "Americano", winningTeam })
}

export function toAmericanoPayload(selectedSide: TeamSide, outcome: Exclude<RelativeOutcome, "Draw">): AmericanoPayload {
  if (outcome === "Win") {
    return { mode: "Americano", winningTeam: selectedSide }
  }
  return { mode: "Americano", winningTeam: selectedSide === 1 ? 2 : 1 }
}

export function toBeatTheBoxPayload(selectedSide: TeamSide, outcome: RelativeOutcome): BeatTheBoxPayload {
  if (outcome === "Draw") {
    return { mode: "BeatTheBox", outcome: "Draw" }
  }

  if (outcome === "Win") {
    return { mode: "BeatTheBox", outcome: selectedSide === 1 ? "Team1Win" : "Team2Win" }
  }

  return { mode: "BeatTheBox", outcome: selectedSide === 1 ? "Team2Win" : "Team1Win" }
}

export function toMexicanoPayload(selectedSide: TeamSide, selectedSideScore: number): MexicanoPayload {
  const opposingScore = 24 - selectedSideScore
  if (selectedSide === 1) {
    return { mode: "Mexicano", team1Score: selectedSideScore, team2Score: opposingScore }
  }

  return { mode: "Mexicano", team1Score: opposingScore, team2Score: selectedSideScore }
}

export function getMexicanoSideScoreOptions(): number[] {
  return Array.from({ length: 24 }, (_, index) => index + 1)
}

export function getSideRelativeSelectionKey(payload: WinnerPayload, selectedSide: TeamSide): string {
  if (payload.mode === "Americano") {
    const won = payload.winningTeam === selectedSide
    return won ? "Win" : "Loss"
  }

  if (payload.mode === "BeatTheBox") {
    if (payload.outcome === "Draw") return "Draw"
    const selectedSideWins = (selectedSide === 1 && payload.outcome === "Team1Win") || (selectedSide === 2 && payload.outcome === "Team2Win")
    return selectedSideWins ? "Win" : "Loss"
  }

  const selectedScore = selectedSide === 1 ? payload.team1Score : payload.team2Score
  return String(selectedScore)
}

export function getMirroredBadgePair(payload: WinnerPayload): TeamBadgePair {
  if (payload.mode === "Americano") {
    return payload.winningTeam === 1
      ? { team1: "Win", team2: "Loss" }
      : { team1: "Loss", team2: "Win" }
  }

  if (payload.mode === "BeatTheBox") {
    if (payload.outcome === "Draw") return { team1: "Draw", team2: "Draw" }
    return payload.outcome === "Team1Win"
      ? { team1: "Win", team2: "Loss" }
      : { team1: "Loss", team2: "Win" }
  }

  return {
    team1: String(payload.team1Score),
    team2: String(payload.team2Score),
  }
}

export function getWinnerSelectionKey(payload: WinnerPayload): string {
  if (payload.mode === "Americano") return `team${payload.winningTeam}`
  if (payload.mode === "BeatTheBox") return payload.outcome
  return `${payload.team1Score}-${payload.team2Score}`
}

export function upsertWinnerSelection(
  currentSelection: WinnerSelectionMap,
  matchId: string,
  payload: WinnerPayload,
): WinnerSelectionMap {
  return {
    ...currentSelection,
    [matchId]: getWinnerSelectionKey(payload),
  }
}

export function clearWinnerSelection(currentSelection: WinnerSelectionMap, matchId: string): WinnerSelectionMap {
  if (!currentSelection[matchId]) return currentSelection

  const nextSelection = { ...currentSelection }
  delete nextSelection[matchId]
  return nextSelection
}

export function isWinnerOptionSelected(
  currentSelection: WinnerSelectionMap,
  matchId: string,
  optionKey: string,
): boolean {
  return currentSelection[matchId] === optionKey
}
