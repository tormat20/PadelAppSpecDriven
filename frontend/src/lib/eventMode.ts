import type { EventType } from "./types"

export function getEventModeLabel(mode: EventType): string {
  if (mode === "WinnersCourt") return "Winners Court"
  if (mode === "RankedBox") return "Ranked Box"
  return mode
}
