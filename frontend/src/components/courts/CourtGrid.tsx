import type { ReactNode } from "react"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import type { MatchView, RunEventTeamBadgeView } from "../../lib/types"

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
  resultBadgeByMatch?: Record<string, RunEventTeamBadgeView>
  onTeamGroupClick?: (matchId: string, teamNumber: 1 | 2) => void
  onTeamGroupHover?: (matchId: string, teamNumber: 1 | 2 | null) => void
  renderMatchFooter?: (matchId: string) => ReactNode
  /** Set of player display-names that should render a status badge next to the name. */
  onFireNames?: Set<string>
  onColdNames?: Set<string>
  badgeVariant?: "crown" | "fire"
  /**
   * When true, forces exactly two rows by computing cols = ceil(n / 2).
   * Top row gets the larger half for odd counts (e.g. 5 → 3 top + 2 bottom).
   */
  fullscreen?: boolean
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
  resultBadgeByMatch = {},
  onTeamGroupClick,
  onTeamGroupHover,
  renderMatchFooter,
  onFireNames,
  onColdNames,
  badgeVariant = "crown",
  fullscreen = false,
}: CourtGridProps) {
  const badgeSrc = badgeVariant === "fire" ? "/images/icons/fire.svg" : "/images/icons/crown-color.png"
  const badgeAlt = badgeVariant === "fire" ? "Hot streak" : "Recent winner"
  const badgeTitle = badgeVariant === "fire" ? "Hot streak" : "Won an event in the last 7 days"
  const badgeClass = badgeVariant === "fire" ? "court-fire-icon" : "court-crown-icon"

  const statusIconForName = (name: string) => {
    if (onColdNames?.has(name)) {
      return (
        <img
          src="/images/icons/snowflake.svg"
          alt="Cold streak"
          className="court-snowflake-icon"
          title="Cold streak"
        />
      )
    }
    if (onFireNames?.has(name)) {
      return (
        <img
          src={badgeSrc}
          alt={badgeAlt}
          className={badgeClass}
          title={badgeTitle}
        />
      )
    }
    return null
  }

  const gridStyle = fullscreen
    ? { gridTemplateColumns: `repeat(${Math.ceil(matches.length / 2)}, 1fr)` }
    : undefined

  return (
    <div className="grid-columns-2" style={gridStyle}>
      {[...matches].sort((a, b) => b.courtNumber - a.courtNumber).map((match) => (
        <article key={match.matchId} className="match-card court-card" data-has-image={showCourtImage}>
          {showCourtImage ? <img src={COURT_IMAGE_SRC} alt="" aria-hidden="true" className="court-card-image" /> : null}
          <h3 className="match-title">Court {match.courtNumber}</h3>
          <div
            role="group"
            className={withInteractiveSurface("team-grouping team-grouping-left")}
            data-selected={selectedTeamByMatch[match.matchId] === 1}
            data-hovered={hoveredTeamByMatch[match.matchId] === 1}
            onMouseEnter={() => onTeamGroupHover?.(match.matchId, 1)}
            onMouseLeave={() => onTeamGroupHover?.(match.matchId, null)}
            onClick={() => onTeamGroupClick?.(match.matchId, 1)}
          >
            <div className="team-grouping-names">
              {getTeamNames(match).team1.map((name) => (
                <span key={name} className="team-player-name">
                  {name}
                  {statusIconForName(name)}
                </span>
              ))}
            </div>
            {resultBadgeByMatch[match.matchId]?.team1 ? (
              <span className="team-result-badge">{resultBadgeByMatch[match.matchId].team1}</span>
            ) : null}
          </div>
          <p className="tag" style={{ width: "fit-content" }}>VS</p>
          <div
            role="group"
            className={withInteractiveSurface("team-grouping team-grouping-right")}
            data-selected={selectedTeamByMatch[match.matchId] === 2}
            data-hovered={hoveredTeamByMatch[match.matchId] === 2}
            onMouseEnter={() => onTeamGroupHover?.(match.matchId, 2)}
            onMouseLeave={() => onTeamGroupHover?.(match.matchId, null)}
            onClick={() => onTeamGroupClick?.(match.matchId, 2)}
          >
            <div className="team-grouping-names">
              {getTeamNames(match).team2.map((name) => (
                <span key={name} className="team-player-name">
                  {name}
                  {statusIconForName(name)}
                </span>
              ))}
            </div>
            {resultBadgeByMatch[match.matchId]?.team2 ? (
              <span className="team-result-badge">{resultBadgeByMatch[match.matchId].team2}</span>
            ) : null}
          </div>
          {renderMatchFooter ? renderMatchFooter(match.matchId) : null}
        </article>
      ))}
    </div>
  )
}
