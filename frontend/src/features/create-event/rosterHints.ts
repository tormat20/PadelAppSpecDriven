export type RosterHints = {
  /** Show "Choose courts" hint — true when no courts are selected */
  showChooseCourts: boolean
  /** Show "Assign players" hint — true when courts are selected but player count doesn't match */
  showAssignPlayers: boolean
}

/**
 * Derives inline roster validation hints for the Create Event Roster step.
 *
 * @param courts          Array of selected court identifiers (any type)
 * @param assignedPlayers Array of assigned player identifiers (any type)
 * @returns Hint visibility flags
 */
export function getRosterHints(
  courts: unknown[],
  assignedPlayers: unknown[],
): RosterHints {
  const courtCount = courts.length
  const playerCount = assignedPlayers.length
  const requiredPlayers = courtCount * 4

  return {
    showChooseCourts: courtCount === 0,
    showAssignPlayers: courtCount > 0 && playerCount !== requiredPlayers,
  }
}
