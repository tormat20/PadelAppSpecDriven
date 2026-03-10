import type { EventRecord } from "../../lib/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UnscheduledStripProps = {
  events: EventRecord[]
  onBlockClick: (event: EventRecord) => void
}

// ---------------------------------------------------------------------------
// UnscheduledStrip
// ---------------------------------------------------------------------------

export default function UnscheduledStrip({ events, onBlockClick }: UnscheduledStripProps) {
  return (
    <div className="calendar-unscheduled-strip panel" aria-label="Unscheduled events">
      <span className="calendar-unscheduled-strip__label">Unscheduled</span>
      <div className="calendar-unscheduled-strip__chips" role="list">
        {events.map((event) => (
          <button
            key={event.id}
            className={`calendar-unscheduled-chip calendar-unscheduled-chip--${event.status.toLowerCase()}`}
            role="listitem"
            onClick={() => onBlockClick(event)}
            type="button"
          >
            {event.eventName}
          </button>
        ))}
      </div>
    </div>
  )
}
