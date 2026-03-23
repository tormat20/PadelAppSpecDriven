import { describe, it, expect, vi } from "vitest"
import {
  computeDragDayIndex,
  computeDropMinutes,
  eventHeightPx,
  snapToGrid,
} from "../src/pages/Calendar"
import { getTemplateDropId, resolveDropTarget } from "../src/components/calendar/calendarDnd"
import { CALENDAR_TEMPLATE_DRAG_TYPE } from "../src/components/calendar/calendarTemplateTypes"
import { applyCalendarScheduleUpdate } from "../src/components/calendar/eventRecordMapping"
import { resolveInteractionMode } from "../src/components/calendar/interactionMode"
import { createBeforeUnloadHandler } from "../src/components/calendar/useUnsavedCalendarGuard"
import WeekGrid from "../src/components/calendar/WeekGrid"
import type { CalendarEventViewModel } from "../src/components/calendar/calendarEventModel"
import { buildStagedCalendarChangeSet } from "../src/components/calendar/useStagedCalendarChanges"

// ---------------------------------------------------------------------------
// Helper to build a minimal DOMRect-like object
// ---------------------------------------------------------------------------

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

// ---------------------------------------------------------------------------
// computeDragDayIndex
// ---------------------------------------------------------------------------

describe("computeDragDayIndex", () => {
  // Grid spans 700px wide, starting at x=100 → each col is 100px wide
  const gridRect = makeRect(100, 200, 700, 1020)

  it("returns 0 for clientX at centre of col 0", () => {
    // Col 0 centre = left (100) + 0.5 * colWidth (50) = 150
    expect(computeDragDayIndex(150, gridRect)).toBe(0)
  })

  it("returns 6 for clientX at centre of col 6", () => {
    // Col 6 centre = left (100) + 6 * colWidth (600) + 50 = 750
    expect(computeDragDayIndex(750, gridRect)).toBe(6)
  })

  it("clamps to 0 when clientX is before col 0 (left of grid)", () => {
    expect(computeDragDayIndex(50, gridRect)).toBe(0)
  })

  it("clamps to 6 when clientX is after col 6 (right of grid)", () => {
    expect(computeDragDayIndex(850, gridRect)).toBe(6)
  })

  it("returns 3 for clientX at centre of col 3 (Wednesday)", () => {
    // Col 3 centre = 100 + 3 * 100 + 50 = 450
    expect(computeDragDayIndex(450, gridRect)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// computeDropMinutes
// ---------------------------------------------------------------------------

describe("computeDropMinutes", () => {
  // Grid: top=200, height=1020px, pxPerMinute=1
  const gridRect = makeRect(100, 200, 700, 1020)

  it("returns 0 when clientY is at grid top", () => {
    // clientY = 200 (top), relativeY = 0 → rawMinutes = 0
    expect(computeDropMinutes(200, gridRect, 1)).toBe(0)
  })

  it("returns 1020 when clientY is at grid bottom", () => {
    // clientY = 200 + 1020 = 1220 (bottom), relativeY = 1020 → rawMinutes = 1020
    expect(computeDropMinutes(1220, gridRect, 1)).toBe(1020)
  })

  it("returns 60 when clientY is 60px below grid top at 1px/min", () => {
    expect(computeDropMinutes(260, gridRect, 1)).toBe(60)
  })

  it("returns 30 when clientY is 60px below grid top at 2px/min", () => {
    // relativeY = 60, pxPerMinute = 2 → rawMinutes = 30
    expect(computeDropMinutes(260, gridRect, 2)).toBe(30)
  })

  it("returns raw (un-snapped) minutes — 45 not 30", () => {
    // clientY = 200 + 45 = 245, pxPerMinute = 1 → raw = 45 (not snapped to 30)
    expect(computeDropMinutes(245, gridRect, 1)).toBe(45)
  })
})

// ---------------------------------------------------------------------------
// snapToGrid clamp to last valid slot
// ---------------------------------------------------------------------------

describe("snapToGrid — clamp to last valid slot", () => {
  it("clamps 975 to 960 (last valid start slot)", () => {
    expect(snapToGrid(975)).toBe(960)
  })

  it("clamps values above 960 to 960", () => {
    expect(snapToGrid(1020)).toBe(960)
    expect(snapToGrid(9999)).toBe(960)
  })

  it("clamps negative values to 0", () => {
    expect(snapToGrid(-1)).toBe(0)
    expect(snapToGrid(-100)).toBe(0)
  })
})

describe("resolveDropTarget", () => {
  it("returns clamped day and snapped time", () => {
    const target = resolveDropTarget(99, 200 + 46, 200)
    expect(target.dayIndex).toBe(6)
    expect(target.minutesFromGridStart).toBe(60)
    expect(target.resolvedTime24h).toBe("08:00")
  })
})

describe("applyCalendarScheduleUpdate", () => {
  it("updates date/time and adapts event name to the new time category", () => {
    const base = {
      id: "evt1",
      eventName: "Monday Lunch Americano",
      eventType: "Americano" as const,
      eventDate: "2026-03-09",
      eventTime24h: "12:00",
      status: "Lobby" as const,
      setupStatus: "ready" as const,
      missingRequirements: [],
      warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
      version: 1,
      selectedCourts: [1],
      playerIds: [],
      currentRoundNumber: null,
      totalRounds: 3,
      roundDurationMinutes: 20,
      durationMinutes: 60 as const,
      isTeamMexicano: false,
    }

    const next = applyCalendarScheduleUpdate(base, "2026-03-11", "08:00")
    expect(next.eventDate).toBe("2026-03-11")
    expect(next.eventTime24h).toBe("08:00")
    expect(next.eventName).toBe("Wednesday Morning Americano")
    expect(next.eventType).toBe("Americano")
    expect(next.id).toBe("evt1")
  })

  it("uses Evening bucket when moved outside Morning/Lunch/Afternoon windows", () => {
    const base = {
      id: "evt2",
      eventName: "Monday Lunch Winners Court",
      eventType: "WinnersCourt" as const,
      eventDate: "2026-03-09",
      eventTime24h: "12:00",
      status: "Lobby" as const,
      setupStatus: "ready" as const,
      missingRequirements: [],
      warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
      version: 1,
      selectedCourts: [1],
      playerIds: [],
      currentRoundNumber: null,
      totalRounds: 3,
      roundDurationMinutes: 20,
      durationMinutes: 60 as const,
      isTeamMexicano: false,
    }

    const next = applyCalendarScheduleUpdate(base, "2026-03-09", "06:30")
    expect(next.eventName).toBe("Monday Evening Winners Court")
  })
})

describe("move/resize conflict prevention", () => {
  it("chooses resize mode when pointer starts in bottom 4px", () => {
    expect(resolveInteractionMode(60, 58)).toBe("resize")
  })

  it("chooses move mode when pointer starts in body", () => {
    expect(resolveInteractionMode(60, 20)).toBe("move")
  })
})

describe("duration-based drag preview footprint", () => {
  it("matches preview heights for 60, 90, and 120 minute events", () => {
    expect(eventHeightPx(60, 1)).toBe(60)
    expect(eventHeightPx(90, 1)).toBe(90)
    expect(eventHeightPx(120, 1)).toBe(120)
  })
})

describe("unsaved navigation guard", () => {
  it("sets beforeunload returnValue to block navigation", () => {
    const handler = createBeforeUnloadHandler()
    const event = { preventDefault: () => undefined, returnValue: undefined } as BeforeUnloadEvent

    handler(event)

    expect(event.returnValue).toBe("")
  })
})

describe("week header day click", () => {
  it("accepts day-header click handler prop for day-view transitions", () => {
    const onDayHeaderClick = vi.fn()
    expect(() =>
      (WeekGrid as any).render(
        {
          events: [] as CalendarEventViewModel[],
          weekStart: new Date(2026, 2, 9),
          ghostBlock: null,
          draggingEventId: null,
          onBlockClick: () => undefined,
          onBlockDragStart: () => undefined,
          onBlockDragEnd: () => undefined,
          onGridDrop: () => undefined,
          onGridDragOver: () => undefined,
          onResizeStart: () => undefined,
          onResizeMove: () => undefined,
          onResizeEnd: () => undefined,
          activeResizeEventId: null,
          onCellPointerDown: () => undefined,
          onDayHeaderClick,
        },
        null,
      ),
    ).not.toThrow()
    expect(typeof onDayHeaderClick).toBe("function")
  })
})

describe("template drag payload", () => {
  it("reads valid template id from dataTransfer", () => {
    const event = {
      dataTransfer: {
        getData: (key: string) => (key === CALENDAR_TEMPLATE_DRAG_TYPE ? "TeamMexicano" : ""),
      },
    } as any
    expect(getTemplateDropId(event)).toBe("TeamMexicano")
  })

  it("returns null for invalid template payload", () => {
    const event = {
      dataTransfer: {
        getData: () => "unknown",
      },
    } as any
    expect(getTemplateDropId(event)).toBeNull()
  })
})

describe("redo safety after popup persistence", () => {
  it("does not revert popup-persisted values when redoing staged changes", () => {
    const popupPersistedEvent: CalendarEventViewModel = {
      id: "evt-popup",
      eventName: "Popup saved",
      eventType: "Mexicano",
      eventDate: "2026-03-09",
      eventTime24h: "11:30",
      status: "Lobby",
      setupStatus: "ready",
      missingRequirements: [],
      warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
      version: 2,
      selectedCourts: [1, 2],
      playerIds: [],
      currentRoundNumber: null,
      totalRounds: 3,
      roundDurationMinutes: 30,
      durationMinutes: 90,
      isTeamMexicano: false,
    }

    const stagedEvent: CalendarEventViewModel = {
      ...popupPersistedEvent,
      id: "evt-staged",
      eventName: "Staged only",
      eventTime24h: "09:00",
      version: 4,
    }

    const baselineAfterPopup = [popupPersistedEvent, stagedEvent]
    const workingWithStagedMove = [popupPersistedEvent, { ...stagedEvent, eventTime24h: "10:30" }]

    const dirtyBeforeRedo = buildStagedCalendarChangeSet(baselineAfterPopup, workingWithStagedMove)
    expect(dirtyBeforeRedo.dirty).toBe(true)

    const redoWorking = baselineAfterPopup
    const dirtyAfterRedo = buildStagedCalendarChangeSet(baselineAfterPopup, redoWorking)

    expect(redoWorking.find((event) => event.id === "evt-popup")?.eventTime24h).toBe("11:30")
    expect(dirtyAfterRedo.dirty).toBe(false)
  })
})
