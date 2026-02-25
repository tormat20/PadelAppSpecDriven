type Props = {
  selectedCourts: number[]
  onChange: (next: number[]) => void
}

export function CourtSelector({ selectedCourts, onChange }: Props) {
  const toggle = (court: number) => {
    const exists = selectedCourts.includes(court)
    onChange(exists ? selectedCourts.filter((c) => c !== court) : [...selectedCourts, court])
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
      {Array.from({ length: 7 }, (_, i) => i + 1).map((court) => (
        <button
          key={court}
          onClick={() => toggle(court)}
          style={{
            borderRadius: 10,
            border: "1px solid #ccd9e8",
            background: selectedCourts.includes(court) ? "#1b6ca8" : "white",
            color: selectedCourts.includes(court) ? "white" : "#14334d",
            padding: "10px 0",
          }}
        >
          {court}
        </button>
      ))}
    </div>
  )
}
