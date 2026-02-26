import type { ReactNode } from "react"

import type { MatchView } from "../../lib/types"

export const COURT_IMAGE_SRC = "/images/courts/court-bg-removed.png"

type LightweightMatch = {
  matchId: string
  courtNumber: number
  team1: string[]
  team2: string[]
}

type CourtGridMatch = MatchView | LightweightMatch

type CourtGridProps = {
  matches: CourtGridMatch[]
  showCourtImage?: boolean
  selectedTeamByMatch?: Record<string, 1 | 2>
  hoveredTeamByMatch?: Record<string, 1 | 2>
  onTeamGroupClick?: (matchId: string, teamNumber: 1 | 2) => void
  onTeamGroupHover?: (matchId: string, teamNumber: 1 | 2 | null) => void
  renderMatchFooter?: (matchId: string) => ReactNode
}

export function selectTeamGrouping(
  currentSelection: Record<string, 1 | 2>,
  matchId: string,
  teamNumber: 1 | 2,
): Record<string, 1 | 2> {
  return { ...currentSelection, [matchId]: teamNumber }
}

function getTeamNames(match: CourtGridMatch): { team1: string[]; team2: string[] } {
  if ("team1" in match) {
    return { team1: match.team1, team2: match.team2 }
  }

  return {
    team1: match.teamA.players.map((player) => player.displayName),
    team2: match.teamB.players.map((player) => player.displayName),
  }
}

export function CourtGrid({
  matches,
  showCourtImage = false,
  selectedTeamByMatch = {},
  hoveredTeamByMatch = {},
  onTeamGroupClick,
  onTeamGroupHover,
  renderMatchFooter,
}: CourtGridProps) {
  return (
    <div className="grid-columns-2">
      {matches.map((match) => (
        <article key={match.matchId} className="match-card court-card" data-has-image={showCourtImage}>
          {showCourtImage ? <img src={COURT_IMAGE_SRC} alt="" aria-hidden="true" className="court-card-image" /> : null}
          <h3 className="match-title">Court {match.courtNumber}</h3>
          <button
            className="team-grouping team-grouping-left"
            type="button"
            data-selected={selectedTeamByMatch[match.matchId] === 1}
            data-hovered={hoveredTeamByMatch[match.matchId] === 1}
            onMouseEnter={() => onTeamGroupHover?.(match.matchId, 1)}
            onMouseLeave={() => onTeamGroupHover?.(match.matchId, null)}
            onClick={() => onTeamGroupClick?.(match.matchId, 1)}
          >
            {getTeamNames(match).team1.join(" + ")}
          </button>
          <p className="tag" style={{ width: "fit-content" }}>VS</p>
          <button
            className="team-grouping team-grouping-right"
            type="button"
            data-selected={selectedTeamByMatch[match.matchId] === 2}
            data-hovered={hoveredTeamByMatch[match.matchId] === 2}
            onMouseEnter={() => onTeamGroupHover?.(match.matchId, 2)}
            onMouseLeave={() => onTeamGroupHover?.(match.matchId, null)}
            onClick={() => onTeamGroupClick?.(match.matchId, 2)}
          >
            {getTeamNames(match).team2.join(" + ")}
          </button>
          {renderMatchFooter ? renderMatchFooter(match.matchId) : null}
        </article>
      ))}
    </div>
  )
}
