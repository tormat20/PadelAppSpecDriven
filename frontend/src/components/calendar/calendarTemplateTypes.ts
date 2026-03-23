import type { EventType } from "../../lib/types"

export type CalendarTemplateId =
  | "Americano"
  | "Mexicano"
  | "TeamMexicano"
  | "WinnersCourt"
  | "RankedBox"

export type CalendarTemplateType = {
  templateId: CalendarTemplateId
  displayLabel: string
  eventType: EventType
  isTeamMexicano: boolean
}

export const CALENDAR_TEMPLATE_DRAG_TYPE = "calendar-template-type"

export const CALENDAR_TEMPLATE_TYPES: CalendarTemplateType[] = [
  { templateId: "Americano", displayLabel: "Americano", eventType: "Americano", isTeamMexicano: false },
  { templateId: "Mexicano", displayLabel: "Mexicano", eventType: "Mexicano", isTeamMexicano: false },
  {
    templateId: "TeamMexicano",
    displayLabel: "Team Mexicano",
    eventType: "Mexicano",
    isTeamMexicano: true,
  },
  {
    templateId: "WinnersCourt",
    displayLabel: "Winners Court",
    eventType: "WinnersCourt",
    isTeamMexicano: false,
  },
  { templateId: "RankedBox", displayLabel: "Ranked Box", eventType: "RankedBox", isTeamMexicano: false },
]

export function isCalendarTemplateId(value: string): value is CalendarTemplateId {
  return CALENDAR_TEMPLATE_TYPES.some((template) => template.templateId === value)
}

export function templateById(templateId: CalendarTemplateId): CalendarTemplateType {
  const template = CALENDAR_TEMPLATE_TYPES.find((candidate) => candidate.templateId === templateId)
  if (!template) {
    throw new Error(`Unknown calendar template: ${templateId}`)
  }
  return template
}
