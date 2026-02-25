import { submitResult } from "../../lib/api"

export async function submitAmericanoWin(matchId: string, winningTeam: 1 | 2) {
  await submitResult(matchId, { mode: "Americano", winningTeam })
}
