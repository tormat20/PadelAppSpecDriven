import { describe, it, expect, vi } from "vitest"
import EventBlock, { formatEventTimeRange } from "../src/components/calendar/EventBlock"
import { getCalendarEventTypeLabel } from "../src/components/calendar/eventRecordMapping"
import type { CalendarEventViewModel } from "../src/components/calendar/calendarEventModel"
import { isInBottomResizeZone, RESIZE_ZONE_HEIGHT_PX } from "../src/components/calendar/interactionMode"
import { getEventTypeVisualClass } from "../src/components/calendar/eventTypeVisualMap"

// ---------------------------------------------------------------------------
// Minimal EventRecord factory
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CalendarEventViewModel> = {}): CalendarEventViewModel {
  return {
    id: "evt-test",
    eventName: "Test Event",
    eventType: "Americano",
    eventDate: "2026-03-09",
    eventTime24h: "10:00",
    status: "Lobby",
    setupStatus: "ready",
    missingRequirements: [],
    warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
    version: 1,
    selectedCourts: [1, 2],
    playerIds: [],
    currentRoundNumber: null,
    totalRounds: 3,
    roundDurationMinutes: 20,
    durationMinutes: 60,
    isTeamMexicano: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EventBlock — draggable attribute", () => {
  it("Lobby event has draggable=true", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    // The root div element's draggable prop should be true
    expect(block).toBeTruthy()
    expect(block?.props?.draggable).toBe(true)
  })

  it("Running event has draggable=false", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Running" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block).toBeTruthy()
    expect(block?.props?.draggable).toBe(false)
  })

  it("Finished event has draggable=false", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Finished" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block).toBeTruthy()
    expect(block?.props?.draggable).toBe(false)
  })
})

describe("EventBlock — isDragging opacity", () => {
  it("isDragging=false renders full opacity (1)", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.style?.opacity).toBe(1)
  })

  it("isDragging=true renders reduced opacity (0.4)", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: true,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.style?.opacity).toBe(0.4)
  })
})

describe("EventBlock — CSS classes", () => {
  it("includes calendar-event-block--lobby for Lobby events", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.className).toContain("calendar-event-block--lobby")
  })

  it("includes calendar-event-block--running for Running events", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Running" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.className).toContain("calendar-event-block--running")
  })

  it("includes calendar-event-block--finished for Finished events", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Finished" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.className).toContain("calendar-event-block--finished")
  })

  it("includes team mexicano visual class when applicable", () => {
    const block = EventBlock({
      event: makeEvent({ eventType: "Mexicano", isTeamMexicano: true }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.className).toContain("calendar-type-team-mexicano")
  })
})

describe("EventBlock — cursor style", () => {
  it("Lobby event has grab cursor", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.style?.cursor).toBe("grab")
  })

  it("Running event has default cursor", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Running" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.style?.cursor).toBe("default")
  })

  it("shows ns-resize cursor when resize is active", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      isResizeActive: true,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.style?.cursor).toBe("ns-resize")
  })
})

describe("EventBlock — event type label", () => {
  it("renders Team Mexicano label for mexicano team flag", () => {
    const label = getCalendarEventTypeLabel(
      makeEvent({
        eventType: "Mexicano",
        isTeamMexicano: true,
      }),
    )
    expect(label).toBe("Team Mexicano")
  })

  it("renders original type label for non-team mexicano", () => {
    const label = getCalendarEventTypeLabel(makeEvent({ eventType: "Americano" }))
    expect(label).toBe("Americano")
  })
})

describe("EventBlock — duration/time helpers", () => {
  it("formats scheduled time range based on duration", () => {
    expect(formatEventTimeRange("09:00", 90)).toBe("09:00 - 10:30")
  })

  it("returns Unscheduled for missing start time", () => {
    expect(formatEventTimeRange(null, 60)).toBe("Unscheduled")
  })
})

describe("EventBlock — interaction polish", () => {
  it("does not use interactive-surface class on calendar event blocks", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(block?.props?.className).not.toContain("interactive-surface")
  })

  it("uses a button for event name to support click-to-edit affordance", () => {
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    const nameButton = block?.props?.children?.[0]
    expect(nameButton?.type).toBe("button")
    expect(nameButton?.props?.className).toBe("calendar-event-block__name")
  })

  it("calls onNameClick when name is clicked", () => {
    const onNameClick = vi.fn()
    const block = EventBlock({
      event: makeEvent({ status: "Lobby" }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
      onNameClick,
    })
    const nameButton = block?.props?.children?.[0]
    nameButton.props.onClick({ stopPropagation: () => undefined })
    expect(onNameClick).toHaveBeenCalledTimes(1)
  })
})

describe("EventBlock — content tiers", () => {
  it("60-minute block omits time range and duration label", () => {
    const block = EventBlock({
      event: makeEvent({ durationMinutes: 60 }),
      top: 0,
      height: 60,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(JSON.stringify(block)).not.toContain("calendar-event-block__time-range")
    expect(JSON.stringify(block)).not.toContain("calendar-event-block__duration")
    expect(JSON.stringify(block)).not.toContain("calendar-event-block__duration-control")
  })

  it("90-minute block shows time range only", () => {
    const block = EventBlock({
      event: makeEvent({ durationMinutes: 90 }),
      top: 0,
      height: 90,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(JSON.stringify(block)).toContain("calendar-event-block__time-range")
    expect(JSON.stringify(block)).not.toContain("calendar-event-block__duration-control")
  })

  it("120-minute block shows duration label without duration dropdown", () => {
    const block = EventBlock({
      event: makeEvent({ durationMinutes: 120 }),
      top: 0,
      height: 120,
      isDragging: false,
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onClick: vi.fn(),
    })
    expect(JSON.stringify(block)).toContain("calendar-event-block__duration")
    expect(JSON.stringify(block)).not.toContain("calendar-event-block__duration-control")
  })
})

describe("event-type visual mapping consistency", () => {
  it("maps all event types to stable visual classes", () => {
    expect(getEventTypeVisualClass("Americano", false)).toBe("calendar-type-americano")
    expect(getEventTypeVisualClass("WinnersCourt", false)).toBe("calendar-type-winners-court")
    expect(getEventTypeVisualClass("RankedBox", false)).toBe("calendar-type-ranked-box")
    expect(getEventTypeVisualClass("Mexicano", false)).toBe("calendar-type-mexicano")
    expect(getEventTypeVisualClass("Mexicano", true)).toBe("calendar-type-team-mexicano")
  })
})

describe("resize-zone detection", () => {
  it("uses bottom 4px as resize zone", () => {
    expect(RESIZE_ZONE_HEIGHT_PX).toBe(4)
    expect(isInBottomResizeZone(60, 57)).toBe(true)
    expect(isInBottomResizeZone(60, 55)).toBe(false)
  })
})
