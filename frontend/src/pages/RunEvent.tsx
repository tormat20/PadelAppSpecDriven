import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { ModeInputs } from "../features/run-event/modeInputs"
import { goToNextRound } from "../features/run-event/nextRound"
import { getCurrentRound, getEvent, submitResult } from "../lib/api"

export default function RunEventPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [eventData, setEventData] = useState<any>(null)
  const [roundData, setRoundData] = useState<any>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const load = async () => {
    const [eventRes, roundRes] = await Promise.all([getEvent(eventId), getCurrentRound(eventId)])
    setEventData(eventRes)
    setRoundData(roundRes)
  }

  useEffect(() => {
    if (eventId) void load()
  }, [eventId])

  const isComplete = useMemo(
    () => !!roundData && roundData.matches.every((m: any) => completed[m.matchId]),
    [completed, roundData],
  )

  const submit = async (matchId: string, payload: any) => {
    await submitResult(matchId, payload)
    setCompleted((prev) => ({ ...prev, [matchId]: true }))
  }

  const next = async () => {
    await goToNextRound(eventId)
    setCompleted({})
    await load()
  }

  if (!eventData || !roundData) return <div>Loading run view...</div>

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2>Run Event - Round {roundData.roundNumber}</h2>
      {roundData.matches.map((match: any) => (
        <article key={match.matchId} style={{ border: "1px solid #d0dce8", borderRadius: 12, padding: 12 }}>
          <h3>Court {match.courtNumber}</h3>
          <p>{match.team1.join(" + ")} vs {match.team2.join(" + ")}</p>
          <ModeInputs mode={eventData.eventType} onPayload={(payload) => submit(match.matchId, payload)} />
        </article>
      ))}
      <button onClick={next} disabled={!isComplete}>Next Match</button>
      <button onClick={() => navigate(`/events/${eventId}/summary`)}>Go to Summary</button>
    </section>
  )
}
