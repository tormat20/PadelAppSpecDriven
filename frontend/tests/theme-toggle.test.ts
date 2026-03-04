import { describe, it, expect, vi } from "vitest"

import {
  getInitialTheme,
  applyTheme,
  persistTheme,
  type Theme,
} from "../src/components/theme/ThemeToggle"

// ---------------------------------------------------------------------------
// Minimal localStorage stub — no DOM required
// ---------------------------------------------------------------------------
function makeStorage(initial: Record<string, string> = {}): Storage {
  const store: Record<string, string> = { ...initial }
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    get length() {
      return Object.keys(store).length
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage
}

// ---------------------------------------------------------------------------
// HTMLElement stub — avoids DOM dependency in a .ts test
// ---------------------------------------------------------------------------
function makeRootStub(): HTMLElement {
  const dataset: Record<string, string> = {}
  return {
    dataset: new Proxy(dataset, {
      set(target, prop: string, value: string) {
        target[prop] = value
        return true
      },
      deleteProperty(target, prop: string) {
        delete target[prop]
        return true
      },
      get(target, prop: string) {
        return target[prop]
      },
    }),
  } as unknown as HTMLElement
}

// ---------------------------------------------------------------------------
// getInitialTheme
// ---------------------------------------------------------------------------
describe("getInitialTheme", () => {
  it("returns stored 'dark' when localStorage has theme=dark", () => {
    const storage = makeStorage({ theme: "dark" })
    expect(getInitialTheme(storage)).toBe("dark")
  })

  it("returns stored 'light' when localStorage has theme=light", () => {
    const storage = makeStorage({ theme: "light" })
    expect(getInitialTheme(storage)).toBe("light")
  })

  it("ignores invalid stored value and falls back to light (no matchMedia in test env)", () => {
    const storage = makeStorage({ theme: "blue" })
    expect(getInitialTheme(storage)).toBe("light")
  })

  it("returns 'light' when no stored preference and no matchMedia support", () => {
    const storage = makeStorage()
    expect(getInitialTheme(storage)).toBe("light")
  })

  it("returns 'dark' when no stored preference but OS prefers dark (mocked)", () => {
    const storage = makeStorage()
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) })
    try {
      expect(getInitialTheme(storage)).toBe("dark")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("returns 'light' when no stored preference and OS prefers light (mocked)", () => {
    const storage = makeStorage()
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) })
    try {
      expect(getInitialTheme(storage)).toBe("light")
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

// ---------------------------------------------------------------------------
// applyTheme
// ---------------------------------------------------------------------------
describe("applyTheme", () => {
  it("sets data-theme=dark on the root element for dark theme", () => {
    const root = makeRootStub()
    applyTheme("dark", root)
    expect(root.dataset.theme).toBe("dark")
  })

  it("removes data-theme attribute for light theme", () => {
    const root = makeRootStub()
    root.dataset.theme = "dark"
    applyTheme("light", root)
    expect(root.dataset.theme).toBeUndefined()
  })

  it("is idempotent — applying light twice leaves no attribute", () => {
    const root = makeRootStub()
    applyTheme("light", root)
    applyTheme("light", root)
    expect(root.dataset.theme).toBeUndefined()
  })

  it("is idempotent — applying dark twice keeps data-theme=dark", () => {
    const root = makeRootStub()
    applyTheme("dark", root)
    applyTheme("dark", root)
    expect(root.dataset.theme).toBe("dark")
  })
})

// ---------------------------------------------------------------------------
// persistTheme
// ---------------------------------------------------------------------------
describe("persistTheme", () => {
  it("writes 'dark' to storage", () => {
    const storage = makeStorage()
    persistTheme("dark", storage)
    expect(storage.getItem("theme")).toBe("dark")
  })

  it("writes 'light' to storage", () => {
    const storage = makeStorage()
    persistTheme("light", storage)
    expect(storage.getItem("theme")).toBe("light")
  })

  it("overwrites a previous value", () => {
    const storage = makeStorage({ theme: "dark" })
    persistTheme("light", storage)
    expect(storage.getItem("theme")).toBe("light")
  })
})

// ---------------------------------------------------------------------------
// round-trip: persist then read back
// ---------------------------------------------------------------------------
describe("round-trip persist → getInitialTheme", () => {
  const themes: Theme[] = ["dark", "light"]

  for (const t of themes) {
    it(`stores and retrieves '${t}'`, () => {
      const storage = makeStorage()
      persistTheme(t, storage)
      expect(getInitialTheme(storage)).toBe(t)
    })
  }
})
