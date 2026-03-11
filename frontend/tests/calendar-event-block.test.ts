import { describe, it, expect, vi } from "vitest"
import EventBlock from "../src/components/calendar/EventBlock"
import type { EventRecord } from "../src/lib/types"

// ---------------------------------------------------------------------------
// Minimal EventRecord factory
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
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
})
