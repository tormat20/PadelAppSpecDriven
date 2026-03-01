import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { CourtSelector } from "../components/courts/CourtSelector"
import { ModeAccordion } from "../components/mode/ModeAccordion"
import { PlayerSelector } from "../components/players/PlayerSelector"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { clearDraftPlayers, loadDraftPlayers, saveDraftPlayers } from "../features/create-event/draftPlayers"
import {
  getRequiredPlayerCount,
  getTodayDateISO,
  isCreateEventDisabled,
  normalizeEventSchedule,
} from "../features/create-event/validation"
import { createEvent } from "../lib/api"

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime24h, setEventTime24h] = useState("")
  const [eventType, setEventType] = useState<"Americano" | "Mexicano" | "BeatTheBox">("Americano")
  const [courts, setCourts] = useState<number[]>([])
  const [assignedPlayers, setAssignedPlayers] = useState(loadDraftPlayers)

  const playerIds = useMemo(() => assignedPlayers.map((player) => player.id), [assignedPlayers])
  const requiredPlayers = getRequiredPlayerCount(courts)

  useEffect(() => {
    saveDraftPlayers(assignedPlayers)
  }, [assignedPlayers])

  const submit = async () => {
    const normalizedSchedule = normalizeEventSchedule({ eventDate, eventTime24h })
    const event = await createEvent({
      eventName,
      eventType,
      eventDate,
      eventTime24h,
      eventSchedule: normalizedSchedule,
      selectedCourts: courts,
      playerIds,
    })
    clearDraftPlayers()
    navigate(`/events/${event.id}/preview`)
  }

  const submitDisabled = isCreateEventDisabled({ eventName, eventDate, eventTime24h, courts, playerIds })

  return (
    <section className="page-shell" aria-label="Create event page">
      <header className="page-header panel">
        <h2 className="page-title">Create Event</h2>
        <p className="page-subtitle">Pick mode, date, courts, and players before generating pairings.</p>
      </header>

      <section className="grid-columns-2 create-event-grid">
        <div className="panel form-grid">
          <ModeAccordion selected={eventType} onSelect={setEventType} />
          <input
            className="input"
            placeholder="Event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <div className="event-schedule-row" aria-label="Event schedule">
            <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <input
              className="input"
              type="time"
              step={60}
              value={eventTime24h}
              onChange={(e) => setEventTime24h(e.target.value)}
              aria-label="Event time"
            />
          </div>
          <button
            className="today-date-link"
            type="button"
            onClick={() => setEventDate(getTodayDateISO())}
          >
            Today's date
          </button>
          <CourtSelector selectedCourts={courts} onChange={setCourts} />
          <button className={withInteractiveSurface("button")} onClick={submit} disabled={submitDisabled}>
            Create Event
          </button>
          <p className="muted">
            Select date, 24-hour time, and exactly {requiredPlayers} players ({courts.length} courts x 4).
          </p>
        </div>

        <div className="panel">
          <PlayerSelector
            assignedPlayers={assignedPlayers}
            totalPlayersRequired={requiredPlayers}
            onAssignedPlayersChange={setAssignedPlayers}
          />
        </div>
      </section>
    </section>
  )
}
