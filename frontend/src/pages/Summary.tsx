import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { finishEvent } from "../lib/api"

export default function SummaryPage() {
  const { eventId = "" } = useParams()
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!eventId) return
    finishEvent(eventId).then(setSummary).catch((err: Error) => setError(err.message))
  }, [eventId])

  if (error) return <div>{error}</div>
  if (!summary) return <div>Loading summary...</div>

  return (
    <section>
      <h2>Summary</h2>
      <h3>Final Standings</h3>
      <ol>
        {summary.finalStandings.map((s: any) => (
          <li key={s.playerId}>
            {s.displayName} - {s.totalScore}
          </li>
        ))}
      </ol>
      <h3>Matches</h3>
      <ul>
        {summary.matches.map((m: any) => (
          <li key={m.matchId}>Court {m.courtNumber}</li>
        ))}
      </ul>
    </section>
  )
}
