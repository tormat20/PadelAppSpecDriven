import type { ProgressSummaryPlayerRow } from "../../lib/types"

export function getRowRank(row: ProgressSummaryPlayerRow, index: number): number {
  return typeof row.rank === "number" ? row.rank : index + 1
}

export function sortRowsByRank(rows: ProgressSummaryPlayerRow[]): ProgressSummaryPlayerRow[] {
  return [...rows].sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank
    return left.displayName.localeCompare(right.displayName)
  })
}

export function getSummaryColumnsWithRank(columns: { id: string; label: string }[]): { id: string; label: string }[] {
  return [
    { id: "rank", label: "Rank" },
    { id: "player", label: "Player" },
    ...columns,
  ]
}
