import type { EventType, ProgressSummaryPlayerRow } from "../../lib/types"

export type PodiumSlot = {
  place: 1 | 2 | 3
  label: string
  players: string[]
  heightClass: "podium-slot--first" | "podium-slot--second" | "podium-slot--third"
}

const PLACE_LABELS: Record<1 | 2 | 3, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
}

const HEIGHT_CLASSES: Record<1 | 2 | 3, PodiumSlot["heightClass"]> = {
  1: "podium-slot--first",
  2: "podium-slot--second",
  3: "podium-slot--third",
}

/**
 * Derives podium slots from ranked player rows.
 *
 * - Mexicano:     1 player per slot (ranks 1, 2, 3)
 * - WinnersCourt: 2 players per slot (ranks 1–2, 3–4, 5–6)
 * - BeatTheBox:   empty array (no podium)
 *
 * Slots with no available players are omitted.
 */
export function buildPodiumSlots(
  eventType: EventType,
  playerRows: ProgressSummaryPlayerRow[],
): PodiumSlot[] {
  if (eventType === "BeatTheBox") return []

  const sorted = [...playerRows].sort((a, b) => {
    const rankDiff = a.rank - b.rank
    if (rankDiff !== 0) return rankDiff
    return a.displayName.localeCompare(b.displayName)
  })

  if (eventType === "Mexicano") {
    return buildSlots(sorted, [
      { place: 1, rankRange: [1, 1] },
      { place: 2, rankRange: [2, 2] },
      { place: 3, rankRange: [3, 3] },
    ])
  }

  // WinnersCourt
  return buildSlots(sorted, [
    { place: 1, rankRange: [1, 2] },
    { place: 2, rankRange: [3, 4] },
    { place: 3, rankRange: [5, 6] },
  ])
}

type SlotSpec = { place: 1 | 2 | 3; rankRange: [number, number] }

function buildSlots(
  sorted: ProgressSummaryPlayerRow[],
  specs: SlotSpec[],
): PodiumSlot[] {
  const slots: PodiumSlot[] = []

  for (const { place, rankRange } of specs) {
    const [minRank, maxRank] = rankRange
    const players = sorted
      .filter((row) => row.rank >= minRank && row.rank <= maxRank)
      .map((row) => row.displayName)

    if (players.length > 0) {
      slots.push({
        place,
        label: PLACE_LABELS[place],
        players,
        heightClass: HEIGHT_CLASSES[place],
      })
    }
  }

  return slots
}
