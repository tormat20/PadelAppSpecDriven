import type { EventType } from "../../lib/types"

export type RosterHints = {
  /** Show "Choose courts" hint — true when no courts are selected */
  showChooseCourts: boolean
  /** Show "Assign players" hint — true when courts are selected but player count doesn't match */
  showAssignPlayers: boolean
  /** Show Americano minimum-courts warning — true when Americano mode and fewer than 2 courts */
  showAmericanoMinCourts: boolean
}

/**
 * Derives inline roster validation hints for the Create Event Roster step.
 *
 * @param courts          Array of selected court identifiers (any type)
 * @param assignedPlayers Array of assigned player identifiers (any type)
 * @param eventType       The currently selected event mode (optional)
 * @returns Hint visibility flags
 */
export function getRosterHints(
  courts: unknown[],
  assignedPlayers: unknown[],
  eventType?: EventType,
): RosterHints {
  const courtCount = courts.length
  const playerCount = assignedPlayers.length
  const requiredPlayers = courtCount * 4

  return {
    showChooseCourts: courtCount === 0,
    showAssignPlayers: courtCount > 0 && playerCount !== requiredPlayers,
    showAmericanoMinCourts: eventType === "Americano" && courtCount > 0 && courtCount < 2,
  }
}
