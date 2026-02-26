import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { getEventSummary } from "../lib/api"
import type { EventSummaryResponse } from "../lib/types"

export function getProgressCellDisplay(value: string | null | undefined): string {
  return value && value.trim() ? value : "-"
}

export function getSummaryBackPath(eventId: string): string {
  return `/events/${eventId}/run`
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
                  <th>Player</th>
                  {summary.columns.map((column) => (
                    <th key={column.id}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.playerRows.map((row) => (
                  <tr key={row.playerId}>
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
          <button className="button-secondary" type="button" onClick={() => navigate(getSummaryBackPath(eventId))}>
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
        <p className="page-subtitle">Final player stats by match and total.</p>
      </header>

      <section className="panel list-stack">
        <h3 className="summary-rank">Final Player Stats</h3>
        <div className="summary-matrix-wrap">
          <table className="summary-matrix">
            <thead>
              <tr>
                <th>Player</th>
                {summary.columns.map((column) => (
                  <th key={column.id}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.playerRows.map((row) => (
                <tr key={row.playerId}>
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
    </section>
  )
}
