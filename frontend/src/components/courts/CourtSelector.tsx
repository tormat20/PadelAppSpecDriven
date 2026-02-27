import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

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
    <div className="court-list" aria-label="Court selector">
      {Array.from({ length: 7 }, (_, i) => i + 1).map((court) => (
        <button
          key={court}
          type="button"
          className={withInteractiveSurface("court-button")}
          data-selected={selectedCourts.includes(court)}
          onClick={() => toggle(court)}
        >
          {court}
        </button>
      ))}
    </div>
  )
}
