import { describe, it, expect } from "vitest"

import {
  getInitialAnimations,
  applyAnimations,
  persistAnimations,
  type AnimationsPref,
} from "../src/components/theme/AnimationsToggle"

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
// getInitialAnimations
// ---------------------------------------------------------------------------
describe("getInitialAnimations", () => {
  it("returns stored 'on' when localStorage has animations=on", () => {
    const storage = makeStorage({ animations: "on" })
    expect(getInitialAnimations(storage)).toBe("on")
  })

  it("returns stored 'off' when localStorage has animations=off", () => {
    const storage = makeStorage({ animations: "off" })
    expect(getInitialAnimations(storage)).toBe("off")
  })

  it("ignores invalid stored value and defaults to 'on'", () => {
    const storage = makeStorage({ animations: "maybe" })
    expect(getInitialAnimations(storage)).toBe("on")
  })

  it("returns 'on' when no stored preference", () => {
    const storage = makeStorage()
    expect(getInitialAnimations(storage)).toBe("on")
  })
})

// ---------------------------------------------------------------------------
// applyAnimations
// ---------------------------------------------------------------------------
describe("applyAnimations", () => {
  it("sets data-animations=off on the root element when pref is off", () => {
    const root = makeRootStub()
    applyAnimations("off", root)
    expect(root.dataset.animations).toBe("off")
  })

  it("removes data-animations attribute when pref is on", () => {
    const root = makeRootStub()
    root.dataset.animations = "off"
    applyAnimations("on", root)
    expect(root.dataset.animations).toBeUndefined()
  })

  it("is idempotent — applying 'on' twice leaves no attribute", () => {
    const root = makeRootStub()
    applyAnimations("on", root)
    applyAnimations("on", root)
    expect(root.dataset.animations).toBeUndefined()
  })

  it("is idempotent — applying 'off' twice keeps data-animations=off", () => {
    const root = makeRootStub()
    applyAnimations("off", root)
    applyAnimations("off", root)
    expect(root.dataset.animations).toBe("off")
  })
})

// ---------------------------------------------------------------------------
// persistAnimations
// ---------------------------------------------------------------------------
describe("persistAnimations", () => {
  it("writes 'on' to storage", () => {
    const storage = makeStorage()
    persistAnimations("on", storage)
    expect(storage.getItem("animations")).toBe("on")
  })

  it("writes 'off' to storage", () => {
    const storage = makeStorage()
    persistAnimations("off", storage)
    expect(storage.getItem("animations")).toBe("off")
  })

  it("overwrites a previous value", () => {
    const storage = makeStorage({ animations: "on" })
    persistAnimations("off", storage)
    expect(storage.getItem("animations")).toBe("off")
  })
})

// ---------------------------------------------------------------------------
// round-trip: persist then read back
// ---------------------------------------------------------------------------
describe("round-trip persist → getInitialAnimations", () => {
  const prefs: AnimationsPref[] = ["on", "off"]

  for (const p of prefs) {
    it(`stores and retrieves '${p}'`, () => {
      const storage = makeStorage()
      persistAnimations(p, storage)
      expect(getInitialAnimations(storage)).toBe(p)
    })
  }
})
