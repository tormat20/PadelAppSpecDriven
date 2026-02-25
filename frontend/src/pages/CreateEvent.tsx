import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { CourtSelector } from "../components/courts/CourtSelector"
import { ModeAccordion } from "../components/mode/ModeAccordion"
import { PlayerSelector } from "../components/players/PlayerSelector"
import { createEvent } from "../lib/api"

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventType, setEventType] = useState<"Americano" | "Mexicano" | "BeatTheBox">("Americano")
  const [courts, setCourts] = useState<number[]>([])
  const [playerIds, setPlayerIds] = useState<string[]>([])

  const submit = async () => {
    const event = await createEvent({
      eventName,
      eventType,
      eventDate,
      selectedCourts: courts,
      playerIds,
    })
    navigate(`/events/${event.id}/preview`)
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2>Create Event</h2>
      <ModeAccordion selected={eventType} onSelect={setEventType} />
      <input placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      <CourtSelector selectedCourts={courts} onChange={setCourts} />
      <PlayerSelector selectedPlayerIds={playerIds} onChange={setPlayerIds} />
      <button onClick={submit}>Create Event</button>
    </section>
  )
}
