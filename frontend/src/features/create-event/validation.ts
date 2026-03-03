const TIME_24H_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function pad2(value: number): string {
  return value.toString().padStart(2, "0")
}

export function getTodayDateISO(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = pad2(now.getMonth() + 1)
  const day = pad2(now.getDate())
  return `${year}-${month}-${day}`
}

export function getRequiredPlayerCount(courts: number[]): number {
  return courts.length * 4
}

export function normalizeEventDate(value: string): string {
  return value.trim()
}

export function normalizeEventTime24h(value: string): string {
  return value.trim()
}

export function isValidEventTime24h(value: string): boolean {
  return TIME_24H_PATTERN.test(normalizeEventTime24h(value))
}

export function isValidEventSchedule(input: { eventDate: string; eventTime24h: string }): boolean {
  const date = normalizeEventDate(input.eventDate)
  const time = normalizeEventTime24h(input.eventTime24h)
  return date.length > 0 && isValidEventTime24h(time)
}

export function isPastSchedule(input: { eventDate: string; eventTime24h: string }, now: Date = new Date()): boolean {
  if (!isValidEventSchedule(input)) return false
  const schedule = new Date(`${normalizeEventDate(input.eventDate)}T${normalizeEventTime24h(input.eventTime24h)}:00`)
  return schedule.getTime() < now.getTime()
}

export function normalizeEventSchedule(input: { eventDate: string; eventTime24h: string }): string {
  const date = normalizeEventDate(input.eventDate)
  const time = normalizeEventTime24h(input.eventTime24h)
  if (!isValidEventSchedule({ eventDate: date, eventTime24h: time })) {
    return ""
  }

  return `${date}T${time}`
}

export function getRecommendedEventName(input: { eventDate: string; modeLabel: string; eventTime24h?: string }): string {
  const date = normalizeEventDate(input.eventDate)
  const modeLabel = input.modeLabel.trim()
  if (!modeLabel) return ""

  const match = DATE_ISO_PATTERN.exec(date)
  if (!match) return ""

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()]

  const time = normalizeEventTime24h(input.eventTime24h ?? "")
  if (isValidEventTime24h(time)) {
    return `${weekday} ${modeLabel} - ${time}`
  }

  return `${weekday} ${modeLabel}`
}

export function isCreateEventDisabled(input: {
  eventName: string
  eventDate: string
  eventTime24h?: string
  courts: number[]
  playerIds: string[]
}) {
  const hasScheduleTime = Object.prototype.hasOwnProperty.call(input, "eventTime24h")
  const hasInvalidSchedule = hasScheduleTime
    ? !isValidEventSchedule({ eventDate: input.eventDate, eventTime24h: input.eventTime24h ?? "" })
    : !input.eventDate

  return (
    input.eventName.trim().length < 2 ||
    hasInvalidSchedule
  )
}

export function isStrictCreateEventDisabled(input: {
  eventName: string
  eventDate: string
  eventTime24h?: string
  courts: number[]
  playerIds: string[]
}) {
  if (isCreateEventDisabled(input)) {
    return true
  }

  return input.courts.length === 0 || input.playerIds.length !== getRequiredPlayerCount(input.courts)
}
