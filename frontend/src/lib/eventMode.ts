import type { EventType } from "./types"

export function getEventModeLabel(mode: EventType): string {
  if (mode === "Americano") return "Winners Court"
  return mode
}
