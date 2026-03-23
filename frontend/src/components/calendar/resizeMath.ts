import { normalizeDurationMinutes } from "./duration"
import type { DurationOption } from "./calendarEventModel"

export const RESIZE_STEP_PX = 30

export function durationFromResizeDelta(startDuration: DurationOption, deltaY: number): DurationOption {
  const steps = Math.round(deltaY / RESIZE_STEP_PX)
  const raw = startDuration + steps * 30
  return normalizeDurationMinutes(raw)
}
