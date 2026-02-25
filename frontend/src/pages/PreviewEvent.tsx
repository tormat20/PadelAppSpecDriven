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

  if (!eventData) return <div>Loading preview...</div>

  return (
    <section>
      <h2>Preview Event</h2>
      <p>{eventData.eventName}</p>
      <p>{eventData.eventType}</p>
      <p>{eventData.eventDate}</p>
      <button onClick={onStart}>Start Event</button>
    </section>
  )
}
