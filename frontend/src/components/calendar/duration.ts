import type { DurationOption } from "./calendarEventModel"

const ALLOWED_DURATIONS: DurationOption[] = [60, 90, 120]

export function normalizeDurationMinutes(value: number): DurationOption {
  if (!Number.isFinite(value)) return 60
  let best: DurationOption = 60
  let bestDistance = Number.POSITIVE_INFINITY
  for (const option of ALLOWED_DURATIONS) {
    const distance = Math.abs(option - value)
    if (distance < bestDistance) {
      best = option
      bestDistance = distance
    }
  }
  return best
}

export function isDurationOption(value: number): value is DurationOption {
  return ALLOWED_DURATIONS.includes(value as DurationOption)
}

export function formatDurationLabel(minutes: DurationOption): string {
  return `${minutes} min`
}
