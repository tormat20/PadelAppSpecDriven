import { describe, expect, it } from "vitest"

import { appRoutes } from "./routes"

describe("router smoke", () => {
  it("keeps primary workflow paths registered", () => {
    const root = appRoutes.find((r) => r.path === "/")!
    // Collect all paths from the AppShell route tree, flattening one level of
    // nested wrapper routes (e.g. ProtectedRoute has no path but has children)
    function collectPaths(routes: typeof root["children"]): string[] {
      if (!routes) return []
      const paths: string[] = []
      for (const r of routes) {
        if (r.path) paths.push(r.path)
        if ((r as { index?: boolean }).index) paths.push("index")
        if (r.children) paths.push(...collectPaths(r.children))
      }
      return paths
    }

    const allPaths = collectPaths(root.children)

    expect(allPaths).toContain("index")
    expect(allPaths).toContain("events/create")
    expect(allPaths).toContain("events/:eventId/preview")
    expect(allPaths).toContain("events/:eventId/run")
    expect(allPaths).toContain("events/:eventId/summary")
  })

  it("registers /login and /create-account outside AppShell", () => {
    const loginRoute = appRoutes.find((r) => r.path === "/login")
    const createRoute = appRoutes.find((r) => r.path === "/create-account")
    expect(loginRoute).toBeDefined()
    expect(createRoute).toBeDefined()
  })
})
