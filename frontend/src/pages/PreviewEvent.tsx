import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { getEvent, startEvent } from "../lib/api"

export default function PreviewEventPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [eventData, setEventData] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    getEvent(eventId).then(setEventData)
  }, [eventId])

  const onStart = async () => {
    await startEvent(eventId)
    navigate(`/events/${eventId}/run`)
  }

  if (!eventData) return <div className="panel">Loading preview...</div>

  return (
    <section className="page-shell" aria-label="Preview event page">
      <header className="page-header panel">
        <h2 className="page-title">Preview Event</h2>
        <p className="page-subtitle">Final check before publishing round one.</p>
      </header>
      <section className="panel list-stack">
        <div className="summary-row">
          <span className="muted">Event</span>
          <strong>{eventData.eventName}</strong>
        </div>
        <div className="summary-row">
          <span className="muted">Mode</span>
          <strong>{eventData.eventType}</strong>
        </div>
        <div className="summary-row">
          <span className="muted">Date</span>
          <strong>{eventData.eventDate}</strong>
        </div>
        <button className="button" onClick={onStart}>Start Event</button>
      </section>
    </section>
  )
}
