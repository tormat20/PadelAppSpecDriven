import { nextRound } from "../../lib/api"

export async function goToNextRound(eventId: string) {
  return nextRound(eventId)
}
