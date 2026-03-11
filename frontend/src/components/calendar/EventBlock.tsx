import type { EventRecord } from "../../lib/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventBlockProps = {
  event: EventRecord
  top: number       // px from grid top
  height: number    // px height
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
}

// ---------------------------------------------------------------------------
// EventBlock
// ---------------------------------------------------------------------------

export default function EventBlock({
  event,
  top,
  height,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: EventBlockProps) {
  const isLobby = event.status === "Lobby"
  const isRunningOrFinished = event.status === "Running" || event.status === "Finished"

  const statusLower = event.status.toLowerCase()
  const eventTypeLower = event.eventType.toLowerCase()

  const className = [
    "calendar-event-block",
    `calendar-event-block--${statusLower}`,
    `calendar-event-block--${eventTypeLower}`,
    isDragging ? "calendar-event-block--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      draggable={isLobby}
      style={{
        position: "absolute",
        top: `${top}px`,
        height: `${height}px`,
        left: 0,
        right: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: isLobby ? "grab" : "default",
      }}
      onDragStart={(e) => {
        if (isRunningOrFinished) {
          e.preventDefault()
          return
        }
        onDragStart(e)
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Event name */}
      <span className="calendar-event-block__name">{event.eventName}</span>

      {/* Event type badge */}
      <span className={`calendar-event-block__type-badge calendar-event-block__type-badge--${eventTypeLower}`}>
        {event.eventType}
      </span>

      {/* Courts label */}
      {event.selectedCourts.length > 0 && (
        <span className="calendar-event-block__courts">
          {event.selectedCourts.map((c) => `Court ${c}`).join(", ")}
        </span>
      )}

      {/* Status badge for Running/Finished */}
      {isRunningOrFinished && (
        <span className={`calendar-event-block__status-badge calendar-event-block__status-badge--${statusLower}`}>
          {event.status}
        </span>
      )}
    </div>
  )
}
