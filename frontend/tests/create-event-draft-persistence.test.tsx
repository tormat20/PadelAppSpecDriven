import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { clearDraftPlayers, loadDraftPlayers, saveDraftPlayers } from "../src/features/create-event/draftPlayers"

describe("create event draft player persistence", () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    const localStorageStub: Storage = {
      get length() {
        return store.size
      },
      clear: () => {
        store.clear()
      },
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => {
        store.delete(key)
      },
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }

    ;(globalThis as { window?: Window }).window = { localStorage: localStorageStub } as Window
  })

  afterEach(() => {
    clearDraftPlayers()
  })

  it("restores assigned players for the active draft", () => {
    const players = [
      { id: "p1", displayName: "Alberta" },
      { id: "p2", displayName: "Amelia" },
    ]

    saveDraftPlayers(players)
    expect(loadDraftPlayers()).toEqual(players)
  })
})
