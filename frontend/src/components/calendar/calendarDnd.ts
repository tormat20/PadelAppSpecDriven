import { GRID_START_HOUR, GRID_TOTAL_MINUTES, PX_PER_MINUTE, SNAP_MINUTES } from "./calendarConstants"
import type React from "react"
import {
  CALENDAR_TEMPLATE_DRAG_TYPE,
  isCalendarTemplateId,
  type CalendarTemplateId,
} from "./calendarTemplateTypes"

export const CALENDAR_EVENT_DRAG_TYPE = "calendar-event-id"

export type CalendarDropTarget = {
  dayIndex: number
  minutesFromGridStart: number
  resolvedTime24h: string
}

export function setDragEventId(e: React.DragEvent, eventId: string): void {
  e.dataTransfer.setData(CALENDAR_EVENT_DRAG_TYPE, eventId)
  e.dataTransfer.effectAllowed = "move"
}

export function getDragEventId(e: React.DragEvent): string {
  return e.dataTransfer.getData(CALENDAR_EVENT_DRAG_TYPE)
}

export function getTemplateDropId(e: React.DragEvent): CalendarTemplateId | null {
  const raw = e.dataTransfer.getData(CALENDAR_TEMPLATE_DRAG_TYPE)
  if (!raw || !isCalendarTemplateId(raw)) return null
  return raw
}

export function resolveDropTarget(dayIndex: number, clientY: number, gridTop: number): CalendarDropTarget {
  const rawMinutes = (clientY - gridTop) / PX_PER_MINUTE
  const boundedMinutes = Math.min(Math.max(rawMinutes, 0), GRID_TOTAL_MINUTES)
  const snappedMinutes = localSnapToGrid(boundedMinutes)
  return {
    dayIndex: Math.min(Math.max(dayIndex, 0), 6),
    minutesFromGridStart: snappedMinutes,
    resolvedTime24h: localMinutesToTime24h(snappedMinutes),
  }
}

export function dropPreviewLabel(time24h: string): string {
  return `Drop at ${time24h} (${SNAP_MINUTES}m grid)`
}

function localSnapToGrid(rawMinutes: number): number {
  const snapped = Math.floor((rawMinutes + SNAP_MINUTES / 2 - 1) / SNAP_MINUTES) * SNAP_MINUTES
  return Math.min(Math.max(snapped, 0), 960)
}

function localMinutesToTime24h(totalMinutes: number): string {
  if (totalMinutes >= GRID_TOTAL_MINUTES) return "00:00"
  const absoluteMinutes = GRID_START_HOUR * 60 + totalMinutes
  const h = Math.floor(absoluteMinutes / 60) % 24
  const m = absoluteMinutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
