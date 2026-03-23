import type { EventType } from "../../lib/types"

export const EVENT_TYPE_VISUAL_CLASS: Record<EventType, string> = {
  Americano: "calendar-type-americano",
  Mexicano: "calendar-type-mexicano",
  WinnersCourt: "calendar-type-winners-court",
  RankedBox: "calendar-type-ranked-box",
}

export function getEventTypeVisualClass(eventType: EventType, isTeamMexicano: boolean): string {
  if (eventType === "Mexicano" && isTeamMexicano) {
    return "calendar-type-team-mexicano"
  }
  return EVENT_TYPE_VISUAL_CLASS[eventType]
}
