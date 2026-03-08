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
import { scheduleConfettiBursts } from "../features/summary/confetti"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { getEventSummary } from "../lib/api"
import type { EventSummaryResponse, EventType, ProgressSummaryPlayerRow } from "../lib/types"

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

// ── Podium helpers ────────────────────────────────────────────────────────────

export const PODIUM_RANK_LABEL = ["1ST", "2ND", "3RD"] as const

export type PodiumDisplaySlot = {
  /** 0 = 1st place, 1 = 2nd place, 2 = 3rd place */
  rank: 0 | 1 | 2
  playerIds: string[]
  playerNames: string[]
  score: number
}

/**
 * Builds up to 3 podium display slots from ranked player rows.
 *
 * - Mexicano:     1 player per slot (ranks 1, 2, 3)
 * - WinnersCourt: 2 players per slot (ranks 1–2, 3–4, 5–6)
 * - RankedBox:    empty array (no podium)
 *
 * Returns slots in VISUAL order: [2nd-place, 1st-place, 3rd-place]
 * so the 1st-place slot appears in the centre.
 */
export function getPodiumSlots(
  eventType: EventType,
  playerRows: ProgressSummaryPlayerRow[],
): PodiumDisplaySlot[] {
  if (eventType === "RankedBox") return []

  const sorted = [...playerRows].sort((a, b) => {
    const rankDiff = a.rank - b.rank
    if (rankDiff !== 0) return rankDiff
    return a.displayName.localeCompare(b.displayName)
  })

  type SlotSpec = { rank: 0 | 1 | 2; minRank: number; maxRank: number }

  const specs: SlotSpec[] =
    eventType === "Mexicano" || eventType === "Americano"
      ? [
          { rank: 0, minRank: 1, maxRank: 1 },
          { rank: 1, minRank: 2, maxRank: 2 },
          { rank: 2, minRank: 3, maxRank: 3 },
        ]
      : [
          // WinnersCourt
          { rank: 0, minRank: 1, maxRank: 2 },
          { rank: 1, minRank: 3, maxRank: 4 },
          { rank: 2, minRank: 5, maxRank: 6 },
        ]

  const filled: PodiumDisplaySlot[] = []

  for (const { rank, minRank, maxRank } of specs) {
    const rows = sorted.filter((r) => r.rank >= minRank && r.rank <= maxRank)
    if (rows.length === 0) continue
    filled.push({
      rank,
      playerIds: rows.map((r) => r.playerId),
      playerNames: rows.map((r) => r.displayName),
      score: getFinalRowTotal(rows[0].cells),
    })
  }

  if (filled.length === 0) return []

  // Reorder for visual display: 2nd left · 1st centre · 3rd right
  const slot1 = filled.find((s) => s.rank === 0)
  const slot2 = filled.find((s) => s.rank === 1)
  const slot3 = filled.find((s) => s.rank === 2)

  return [slot2, slot1, slot3].filter((s): s is PodiumDisplaySlot => s !== undefined)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CrownIcon() {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="summary-crown-fallback" aria-label={CROWN_ICON_ALT}>*</span>
  return <img className="summary-crown-icon" src={CROWN_ICON_SRC} alt={CROWN_ICON_ALT} onError={() => setFailed(true)} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [summary, setSummary] = useState<EventSummaryResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!eventId) return
    getEventSummary(eventId).then(setSummary).catch((err: Error) => setError(err.message))
  }, [eventId])

  // Confetti: fires once when final summary loads (progressive enhancement)
  useEffect(() => {
    if (!summary || summary.mode !== "final") return
    try {
      return scheduleConfettiBursts()
    } catch {
      // Confetti failure must never break the summary page
    }
  }, [summary?.mode])

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

  // ── Final summary ────────────────────────────────────────────────────────────

  const podiumSlots =
    summary.eventType !== "RankedBox"
      ? getPodiumSlots(summary.eventType, orderedRows)
      : []

  return (
    <section className="page-shell" aria-label="Summary page">
      <header className="page-header panel">
        <h2 className="page-title">Summary</h2>
        <p className="page-subtitle">{getFinalSummarySubtitle()}</p>
      </header>

      {podiumSlots.length > 0 && (
        <section className="podium-container panel" aria-label="Winner podium">
          {podiumSlots.map((slot) => {
            const crowned =
              showCrown && slot.playerIds.some((id) => isPlayerCrowned(crownedPlayers, id))
            return (
              <div key={slot.rank} className="podium-slot" data-rank={slot.rank + 1}>
                {crowned && (
                  <div className="podium-crown">
                    <CrownIcon />
                  </div>
                )}
                <div className="podium-rank-badge" data-rank={slot.rank + 1}>
                  {PODIUM_RANK_LABEL[slot.rank]}
                </div>
                {slot.playerNames.map((name) => (
                  <div key={name} className="podium-name">{name}</div>
                ))}
                <div className="podium-score">{slot.score} pts</div>
              </div>
            )
          })}
        </section>
      )}

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
