import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { deleteEvent, getEvent, startEvent } from "../lib/api"
import { getEventModeLabel } from "../lib/eventMode"
import type { EventRecord } from "../lib/types"

function resolveLifecycleStatus(event: Pick<EventRecord, "lifecycleStatus" | "status" | "setupStatus">): "planned" | "ready" | "ongoing" | "finished" {
  if (event.lifecycleStatus) return event.lifecycleStatus
  if (event.status === "Finished") return "finished"
  if (event.status === "Running") return "ongoing"
  return event.setupStatus === "ready" ? "ready" : "planned"
}

export function canStartEvent(event: Pick<EventRecord, "lifecycleStatus" | "status" | "setupStatus">): boolean {
  return resolveLifecycleStatus(event) === "ready"
}

function getPrimaryAction(event: EventRecord): { label: string; disabled: boolean } {
  const lifecycleStatus = resolveLifecycleStatus(event)
  if (lifecycleStatus === "ongoing") {
    return { label: "Resume Event", disabled: false }
  }
  if (lifecycleStatus === "finished") {
    return { label: "View Summary", disabled: false }
  }
  return { label: "Start Event", disabled: !canStartEvent(event) }
}

export default function PreviewEventPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [eventData, setEventData] = useState<EventRecord | null>(null)
  const [startError, setStartError] = useState("")
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (!eventId) return
    getEvent(eventId).then(setEventData)
  }, [eventId])

  const onStart = async () => {
    setStartError("")
    setPopupBlocked(false)
    try {
      await startEvent(eventId)
      const win = window.open(`/events/${eventId}/run`, "_blank")
      if (win === null) {
        setPopupBlocked(true)
        navigate(`/events/${eventId}/run`)
      }
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Failed to start event")
    }
  }

  const onEdit = () => {
    navigate(`/events/create?editEventId=${eventId}`)
  }

  const onDelete = async () => {
    setDeleteError("")
    try {
      await deleteEvent(eventId)
      navigate("/")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete event")
    }
  }

  const onMainMenu = () => {
    navigate("/")
  }

  if (!eventData) return <div className="panel">Loading preview...</div>

  const primaryAction = getPrimaryAction(eventData)
  const showStartHelp = primaryAction.label === "Start Event" && primaryAction.disabled
  const onPrimaryAction = async () => {
    const lifecycleStatus = resolveLifecycleStatus(eventData)
    if (lifecycleStatus === "ongoing") {
      navigate(`/events/${eventId}/run`)
      return
    }
    if (lifecycleStatus === "finished") {
      navigate(`/events/${eventId}/summary`)
      return
    }
    await onStart()
  }

  return (
    <section className="page-shell" aria-label="Preview event page">
      <header className="page-header panel">
        <div className="preview-header-row">
          <h2 className="page-title">Preview Event</h2>
          <button className={withInteractiveSurface("button-secondary")} onClick={() => setShowDeleteDialog(true)}>
            Delete
          </button>
        </div>
        <p className="page-subtitle">Final check before publishing round one.</p>
      </header>
      <section className="panel list-stack">
        <div className="summary-row">
          <span className="muted">Event</span>
          <strong>{eventData.eventName}</strong>
        </div>
        <div className="summary-row">
          <span className="muted">Mode</span>
          <strong>{getEventModeLabel(eventData.eventType)}</strong>
        </div>
        <div className="summary-row">
          <span className="muted">Date</span>
          <strong>{eventData.eventDate}</strong>
        </div>
        <button
          className={withInteractiveSurface("button")}
          onClick={() => void onPrimaryAction()}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </button>
        {showStartHelp && <p className="warning-text">Add players and courts to start event</p>}
        {eventData.isTeamMexicano && eventData.missingRequirements.includes("team_mexicano_odd_players") && (
          <p className="warning-text">
            Team Mexicano requires an even number of players. Add or remove a player before starting.
          </p>
        )}
        {popupBlocked && (
          <p className="warning-text">
            Popup blocked — opening in the current tab instead. Allow popups for this site to open the event in a new window.
          </p>
        )}
        <button className={withInteractiveSurface("button-secondary")} onClick={onEdit}>
          Edit Event
        </button>
        <button className={withInteractiveSurface("button-secondary")} onClick={onMainMenu}>
          Main Menu
        </button>
        {startError && <p className="warning-text">{startError}</p>}
      </section>

      {showDeleteDialog && (
        <div className="result-modal-backdrop" role="presentation" onClick={() => setShowDeleteDialog(false)}>
          <div
            className="result-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete event"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="result-modal-header">
              <h3 className="match-title">Delete event?</h3>
            </header>
            <p className="muted">This removes the event and all rounds, matches, and setup data.</p>
            <section className="grid-columns-2">
              <button className={withInteractiveSurface("button")} onClick={() => void onDelete()}>
                Delete
              </button>
              <button
                className={withInteractiveSurface("button-secondary")}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
            </section>
            {deleteError && <p className="warning-text">{deleteError}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
