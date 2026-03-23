import type { EventType, UpdateEventPayload } from "../../lib/types"

export type PopupEditorMode = "edit" | "readonly" | "create"

export type PopupEditorFormValues = {
  eventName: string
  eventType: EventType
  eventDate: string
  eventTime24h: string
  durationMinutes: 60 | 90 | 120
  courts: number[]
}

export type PopupSaveState = {
  isSaving: boolean
  saveError: string | null
}

export type PopupImmediateSaveInput = {
  eventId: string
  payload: UpdateEventPayload
}
