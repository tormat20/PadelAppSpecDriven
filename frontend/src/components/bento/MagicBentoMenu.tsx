import { useNavigate } from "react-router-dom"

const cards = [
  { title: "Create Event", to: "/events/create" },
  { title: "Resume Event", to: "/events/run" },
  { title: "Players", to: "/events/create" },
]

export function MagicBentoMenu() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => navigate(card.to)}
          style={{
            borderRadius: 20,
            border: "1px solid #c5d5e8",
            background: "white",
            padding: 24,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>{card.title}</div>
          <div style={{ opacity: 0.6, marginTop: 8 }}>Host workflow navigation</div>
        </button>
      ))}
    </div>
  )
}
