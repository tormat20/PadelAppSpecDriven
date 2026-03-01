import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  CROWN_ICON_ALT,
  CROWN_ICON_SRC,
  isPlayerCrowned,
  showCrownForSummaryMode,
  toCrownedPlayerSet,
} from "../features/summary/crownWinners"
import {
  getRowRank,
  getSummaryColumnsWithRank,
  sortRowsByRank,
} from "../features/summary/rankOrdering"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { getEventSummary } from "../lib/api"
import type { EventSummaryResponse } from "../lib/types"

export function getProgressCellDisplay(value: string | null | undefined): string {
  return value && value.trim() ? value : "-"
}

export function getSummaryBackPath(eventId: string): string {
  return `/events/${eventId}/run`
}

export function isRoundColumnLabel(label: string): boolean {
  return /^R\d+$/.test(label)
}

export function getFinalSummarySubtitle(): string {
  return "Final player stats by round and total."
}

export function getFinalRowTotal(cells: { columnId: string; value: string }[]): number {
  const totalCell = cells.find((cell) => cell.columnId === "total")
  if (!totalCell) return 0
  const parsed = Number(totalCell.value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function sortFinalRowsByScore<T extends { displayName: string; cells: { columnId: string; value: string }[] }>(
  rows: T[],
): T[] {
  return [...rows].sort((left, right) => {
    const totalDelta = getFinalRowTotal(right.cells) - getFinalRowTotal(left.cells)
    if (totalDelta !== 0) return totalDelta
    return left.displayName.localeCompare(right.displayName)
  })
}

function CrownIcon() {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="summary-crown-fallback" aria-label={CROWN_ICON_ALT}>*</span>
  return <img className="summary-crown-icon" src={CROWN_ICON_SRC} alt={CROWN_ICON_ALT} onError={() => setFailed(true)} />
}

export default function SummaryPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [summary, setSummary] = useState<EventSummaryResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!eventId) return
    getEventSummary(eventId).then(setSummary).catch((err: Error) => setError(err.message))
  }, [eventId])

  if (error) return <div className="panel">{error}</div>
  if (!summary) return <div className="panel">Loading summary...</div>

  const crownedPlayers =
    summary.mode === "final" ? toCrownedPlayerSet(summary.crownedPlayerIds) : new Set<string>()
  const showCrown = showCrownForSummaryMode(summary.mode)
  const orderedRows = sortRowsByRank(summary.playerRows)
  const displayColumns = getSummaryColumnsWithRank(summary.columns)

  if (summary.mode === "progress") {
    return (
      <section className="page-shell" aria-label="Summary page">
        <header className="page-header panel">
          <h2 className="page-title">Progress Summary</h2>
          <p className="page-subtitle">Track current event progress without finalizing results.</p>
        </header>

        <section className="panel list-stack">
          <h3 className="summary-rank">Player Progress Matrix</h3>
          <div className="summary-matrix-wrap">
            <table className="summary-matrix">
              <thead>
                <tr>
                  {displayColumns.map((column) => (
                    <th key={column.id} scope="col">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderedRows.map((row, index) => (
                  <tr key={row.playerId}>
                    <td className="summary-rank-cell">{getRowRank(row, index)}</td>
                    <td>{row.displayName}</td>
                    {row.cells.map((cell) => (
                      <td key={cell.columnId}>{getProgressCellDisplay(cell.value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <button className={withInteractiveSurface("button-secondary")} type="button" onClick={() => navigate(getSummaryBackPath(eventId))}>
            Back to Run Event
          </button>
        </section>
      </section>
    )
  }

  return (
    <section className="page-shell" aria-label="Summary page">
      <header className="page-header panel">
        <h2 className="page-title">Summary</h2>
        <p className="page-subtitle">{getFinalSummarySubtitle()}</p>
      </header>

      <section className="panel list-stack">
        <h3 className="summary-rank">Final Player Stats</h3>
        <div className="summary-matrix-wrap">
          <table className="summary-matrix">
              <thead>
                <tr>
                  {displayColumns.map((column) => (
                    <th key={column.id} scope="col">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderedRows.map((row, index) => (
                  <tr key={row.playerId}>
                    <td className="summary-rank-cell">{getRowRank(row, index)}</td>
                    <td className="summary-player-cell">
                      <span className="summary-player-name">
                        <span className="summary-player-label">{row.displayName}</span>
                        {showCrown && isPlayerCrowned(crownedPlayers, row.playerId) ? <CrownIcon /> : null}
                      </span>
                    </td>
                  {row.cells.map((cell) => (
                    <td key={cell.columnId}>{getProgressCellDisplay(cell.value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
