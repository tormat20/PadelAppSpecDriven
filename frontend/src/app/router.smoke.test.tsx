import { describe, expect, it } from "vitest"

import { appRoutes } from "./routes"

describe("router smoke", () => {
  it("keeps primary workflow paths registered", () => {
    const root = appRoutes[0]
    const childPaths = (root.children ?? []).map((r) => r.path ?? "index")

    expect(childPaths).toContain("index")
    expect(childPaths).toContain("events/create")
    expect(childPaths).toContain("events/:eventId/preview")
    expect(childPaths).toContain("events/:eventId/run")
    expect(childPaths).toContain("events/:eventId/summary")
  })
})
