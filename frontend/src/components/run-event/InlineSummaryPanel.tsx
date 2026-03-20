import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import type { InlineSummaryView } from "../../lib/types"

type InlineSummaryPanelProps = {
  summary: InlineSummaryView
  onClose: () => void
}

export default function InlineSummaryPanel({ summary, onClose }: InlineSummaryPanelProps) {
  return (
    <section className="panel inline-summary-panel" aria-label="Inline summary panel">
      <div className="inline-summary-header">
        <h3 className="inline-summary-title">View Summary</h3>
        <button type="button" className={withInteractiveSurface("button-secondary")} onClick={onClose}>
          Close
        </button>
      </div>

      <div className="inline-summary-grid">
        <table className="summary-matrix">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              {summary.columns.map((column) => (
                <th key={column.id}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.playerRows.map((row) => (
              <tr key={row.playerId}>
                <td>{row.rank}</td>
                <td>
                  <span>{row.displayName}</span>
                </td>
                {row.cells.map((cell) => (
                  <td key={`${row.playerId}-${cell.columnId}`}>
                    {cell.isWinner ? <span className="inline-summary-winner">{cell.value}</span> : cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
