export const CROWN_ICON_SRC = "/images/icons/crown.png"
export const CROWN_ICON_ALT = "Crowned winner"

export function toCrownedPlayerSet(playerIds: string[] | undefined): Set<string> {
  if (!Array.isArray(playerIds)) return new Set<string>()
  return new Set(playerIds)
}

export function isPlayerCrowned(crownedPlayerIds: Set<string>, playerId: string): boolean {
  return crownedPlayerIds.has(playerId)
}

export function showCrownForSummaryMode(mode: "progress" | "final"): boolean {
  return mode === "final"
}
