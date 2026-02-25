import { useState } from "react"

import { createPlayer, searchPlayers } from "../../lib/api"

type Player = { id: string; displayName: string }

type Props = {
  selectedPlayerIds: string[]
  onChange: (ids: string[]) => void
}

export function PlayerSelector({ selectedPlayerIds, onChange }: Props) {
  const [query, setQuery] = useState("")
  const [players, setPlayers] = useState<Player[]>([])

  const load = async (term: string) => {
    const data = await searchPlayers(term)
    setPlayers(data)
  }

  const addNew = async () => {
    if (!query.trim()) return
    const created = await createPlayer(query.trim())
    onChange([...selectedPlayerIds, created.id])
    setQuery("")
    await load("")
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or create player"
        />
        <button onClick={() => load(query)}>Search</button>
        <button onClick={addNew}>Add New</button>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {players.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={selectedPlayerIds.includes(p.id)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selectedPlayerIds, p.id])
                else onChange(selectedPlayerIds.filter((id) => id !== p.id))
              }}
            />
            {p.displayName}
          </label>
        ))}
      </div>
    </div>
  )
}
