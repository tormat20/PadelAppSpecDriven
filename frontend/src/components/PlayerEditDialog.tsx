import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"

type PlayerEditDialogProps = {
  title?: string
  initialDisplayName: string
  initialEmail?: string | null
  isSaving?: boolean
  onCancel: () => void
  onSave: (payload: { displayName: string; email: string | null }) => void
}

export default function PlayerEditDialog({
  title = "Edit player",
  initialDisplayName,
  initialEmail,
  isSaving = false,
  onCancel,
  onSave,
}: PlayerEditDialogProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [email, setEmail] = useState(initialEmail ?? "")
  const [error, setError] = useState("")

  useEffect(() => {
    setDisplayName(initialDisplayName)
    setEmail(initialEmail ?? "")
    setError("")
  }, [initialDisplayName, initialEmail])

  if (typeof document === "undefined") {
    return null
  }

  const handleSaveClick = () => {
    if (!displayName.trim()) {
      setError("Display name is required.")
      return
    }
    onSave({ displayName: displayName.trim(), email: email.trim() ? email.trim() : null })
  }

  return createPortal(
    <div
      className="result-modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-edit-dialog-title"
    >
      <div className="result-modal confirm-dialog player-edit-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 id="player-edit-dialog-title" className="confirm-dialog__title">{title}</h2>
        <div className="player-edit-dialog__fields">
          <label className="player-edit-dialog__field">
            <span className="player-edit-dialog__label">Display name</span>
            <input
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setError("")
              }}
              disabled={isSaving}
            />
          </label>
          <label className="player-edit-dialog__field">
            <span className="player-edit-dialog__label">Email</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              placeholder="Optional"
              disabled={isSaving}
            />
          </label>
          {error && (
            <p className="warning-text" role="alert">{error}</p>
          )}
        </div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={withInteractiveSurface("button")}
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
