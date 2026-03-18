import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { createPortal } from "react-dom"

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: "default" | "danger"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmClass =
    variant === "danger"
      ? withInteractiveSurface("button--danger")
      : withInteractiveSurface("button")

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      className="result-modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="result-modal confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {title}
        </h2>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
