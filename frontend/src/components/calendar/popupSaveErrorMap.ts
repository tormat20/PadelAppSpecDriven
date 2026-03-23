import { ApiError } from "../../lib/api"
import { POPUP_EDITOR_SAVE_ERROR_FALLBACK } from "./popupEditorCopy"

export function toPopupSaveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "EVENT_VERSION_CONFLICT") {
      return "This event was updated by another organizer. Refresh and retry."
    }
    return error.message || POPUP_EDITOR_SAVE_ERROR_FALLBACK
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message
  return POPUP_EDITOR_SAVE_ERROR_FALLBACK
}
