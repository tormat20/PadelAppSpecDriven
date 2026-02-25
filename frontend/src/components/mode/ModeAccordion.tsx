type Props = {
  selected: string
  onSelect: (value: "Americano" | "Mexicano" | "BeatTheBox") => void
}

const modes: Array<{ key: "Americano" | "Mexicano" | "BeatTheBox"; blurb: string }> = [
  { key: "Americano", blurb: "Win/loss court movement" },
  { key: "Mexicano", blurb: "24-point score regrouping" },
  { key: "BeatTheBox", blurb: "3-round box rotations" },
]

export function ModeAccordion({ selected, onSelect }: Props) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {modes.map((mode) => {
        const active = selected === mode.key
        return (
          <button
            key={mode.key}
            onClick={() => onSelect(mode.key)}
            style={{
              borderRadius: 14,
              border: active ? "2px solid #1b6ca8" : "1px solid #c8d9e8",
              background: active ? "#eef6fd" : "white",
              padding: 14,
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 700 }}>{mode.key}</div>
            <div>{mode.blurb}</div>
          </button>
        )
      })}
    </div>
  )
}
