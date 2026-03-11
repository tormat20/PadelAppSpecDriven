import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { EventRecord, EventType, UpdateEventPayload } from "../../lib/types"
import type { DrawerState } from "../../pages/Calendar"
import { deriveDurationMinutes } from "../../pages/Calendar"

// ---------------------------------------------------------------------------
// DrawerFormValues — the shape of editable fields in the drawer
// ---------------------------------------------------------------------------

export type DrawerFormValues = {
  eventName: string
  eventType: EventType
  eventDate: string
  eventTime24h: string
  durationMinutes: number
  courts: number[]
}

// ---------------------------------------------------------------------------
// isDrawerDirty — returns true when any field has changed from original
// ---------------------------------------------------------------------------

export function isDrawerDirty(
  original: DrawerFormValues,
  current: DrawerFormValues
): boolean {
  if (original.eventName !== current.eventName) return true
  if (original.eventType !== current.eventType) return true
  if (original.eventDate !== current.eventDate) return true
  if (original.eventTime24h !== current.eventTime24h) return true
  if (original.durationMinutes !== current.durationMinutes) return true
  if (original.courts.length !== current.courts.length) return true
  for (let i = 0; i < original.courts.length; i++) {
    if (original.courts[i] !== current.courts[i]) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// EventDrawer props
// ---------------------------------------------------------------------------

type EventDrawerProps = {
  state: DrawerState
  onSave: (payload: UpdateEventPayload) => Promise<void>
  onDelete: (eventId: string, version: number) => Promise<void>
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_TYPES: EventType[] = ["WinnersCourt", "Mexicano", "RankedBox", "Americano"]

function eventToFormValues(event: EventRecord): DrawerFormValues {
  return {
    eventName: event.eventName,
    eventType: event.eventType,
    eventDate: event.eventDate,
    eventTime24h: event.eventTime24h ?? "",
    durationMinutes: deriveDurationMinutes(event),
    courts: [...event.selectedCourts],
  }
}

const DURATION_PRESETS = [60, 90, 120] as const

// ---------------------------------------------------------------------------
// EventDrawer component
// ---------------------------------------------------------------------------

export default function EventDrawer({ state, onSave, onDelete, onClose }: EventDrawerProps) {
  const isOpen = state.open
  const mode = isOpen ? state.mode : null
  const event =
    isOpen && state.open && (state.mode === "edit" || state.mode === "readonly")
      ? state.event
      : null

  // Form values
  const [form, setForm] = useState<DrawerFormValues>({
    eventName: "",
    eventType: "Mexicano",
    eventDate: "",
    eventTime24h: "",
    durationMinutes: 60,
    courts: [],
  })
  const [originalForm, setOriginalForm] = useState<DrawerFormValues>(form)

  // Custom duration input
  const [isCustomDuration, setIsCustomDuration] = useState(false)

  // Submission state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  // Sync form when drawer opens with an event
  useEffect(() => {
    if (isOpen && event) {
      const vals = eventToFormValues(event)
      setForm(vals)
      setOriginalForm(vals)
      setIsCustomDuration(!DURATION_PRESETS.includes(vals.durationMinutes as 60 | 90 | 120))
      setInlineError(null)
      setIsSaving(false)
      setIsDeleting(false)
    }
  }, [isOpen, event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleFieldChange<K extends keyof DrawerFormValues>(
    field: K,
    value: DrawerFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setInlineError(null)
  }

  function handleDurationSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === "custom") {
      setIsCustomDuration(true)
    } else {
      setIsCustomDuration(false)
      handleFieldChange("durationMinutes", parseInt(val, 10))
    }
  }

  function handleCourtsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const parsed = raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
    handleFieldChange("courts", parsed)
  }

  function handleCloseRequest() {
    if (mode === "edit" && isDrawerDirty(originalForm, form)) {
      if (!window.confirm("Discard changes?")) return
    }
    onClose()
  }

  async function handleSave() {
    if (!event) return
    setIsSaving(true)
    setInlineError(null)

    // Build payload with only changed fields
    const payload: UpdateEventPayload = { expectedVersion: event.version }
    if (form.eventName !== originalForm.eventName) payload.eventName = form.eventName
    if (form.eventType !== originalForm.eventType) payload.eventType = form.eventType
    if (form.eventDate !== originalForm.eventDate) payload.eventDate = form.eventDate
    if (form.eventTime24h !== originalForm.eventTime24h) payload.eventTime24h = form.eventTime24h
    if (JSON.stringify(form.courts) !== JSON.stringify(originalForm.courts)) {
      payload.selectedCourts = form.courts
    }

    try {
      await onSave(payload)
    } catch {
      setInlineError("Could not save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    if (!window.confirm("Delete this event? This cannot be undone.")) return
    setIsDeleting(true)
    setInlineError(null)
    try {
      await onDelete(event.id, event.version)
    } catch {
      setInlineError("Could not delete event. Please try again.")
      setIsDeleting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isReadOnly = mode === "readonly"

  const durationSelectValue = isCustomDuration
    ? "custom"
    : DURATION_PRESETS.includes(form.durationMinutes as 60 | 90 | 120)
    ? String(form.durationMinutes)
    : "custom"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="event-drawer"
          className="event-drawer"
          role="dialog"
          aria-label="Event details"
          data-testid="event-drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.22 }}
        >
          {/* Header */}
          <div className="event-drawer__header">
            <h2 className="event-drawer__title">
              {mode === "edit" ? "Edit Event" : mode === "create" ? "New Event" : "Event Details"}
            </h2>
            <button
              className="event-drawer__close"
              aria-label="Close drawer"
              onClick={handleCloseRequest}
              type="button"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="event-drawer__body">
            {/* Inline error */}
            {inlineError && (
              <p className="event-drawer__error" role="alert">
                {inlineError}
              </p>
            )}

            {/* Event name */}
            <label className="event-drawer__field">
              <span className="event-drawer__label">Event name</span>
              <input
                type="text"
                className="event-drawer__input"
                value={form.eventName}
                minLength={3}
                maxLength={120}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={(e) => handleFieldChange("eventName", e.target.value)}
                data-testid="drawer-event-name"
              />
            </label>

            {/* Event type */}
            <label className="event-drawer__field">
              <span className="event-drawer__label">Event type</span>
              <select
                className="event-drawer__select"
                value={form.eventType}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={(e) => handleFieldChange("eventType", e.target.value as EventType)}
                data-testid="drawer-event-type"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {/* Date */}
            <label className="event-drawer__field">
              <span className="event-drawer__label">Date</span>
              <input
                type="date"
                className="event-drawer__input"
                value={form.eventDate}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={(e) => handleFieldChange("eventDate", e.target.value)}
                data-testid="drawer-event-date"
              />
            </label>

            {/* Start time */}
            <label className="event-drawer__field">
              <span className="event-drawer__label">Start time</span>
              <input
                type="time"
                step={1800}
                className="event-drawer__input"
                value={form.eventTime24h}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={(e) => handleFieldChange("eventTime24h", e.target.value)}
                data-testid="drawer-event-time"
              />
            </label>

            {/* Duration */}
            <div className="event-drawer__field">
              <span className="event-drawer__label">Duration</span>
              <select
                className="event-drawer__select"
                value={durationSelectValue}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={handleDurationSelectChange}
                data-testid="drawer-duration-select"
              >
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
                <option value="custom">Custom…</option>
              </select>
              {isCustomDuration && (
                <input
                  type="number"
                  min={30}
                  step={30}
                  className="event-drawer__input event-drawer__input--inline"
                  value={form.durationMinutes}
                  disabled={isReadOnly || isSaving || isDeleting}
                  onChange={(e) =>
                    handleFieldChange("durationMinutes", parseInt(e.target.value, 10) || 60)
                  }
                  data-testid="drawer-duration-custom"
                />
              )}
            </div>

            {/* Courts */}
            <label className="event-drawer__field">
              <span className="event-drawer__label">Courts (comma-separated)</span>
              <input
                type="text"
                className="event-drawer__input"
                value={form.courts.join(", ")}
                disabled={isReadOnly || isSaving || isDeleting}
                onChange={handleCourtsChange}
                placeholder="e.g. 1, 2, 3"
                data-testid="drawer-courts"
              />
            </label>
          </div>

          {/* Footer actions */}
          {!isReadOnly && (
            <div className="event-drawer__footer">
              {mode === "edit" && (
                <>
                  <button
                    className="button-danger"
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={handleDelete}
                    data-testid="drawer-delete-btn"
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    className="button-primary"
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={handleSave}
                    data-testid="drawer-save-btn"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
