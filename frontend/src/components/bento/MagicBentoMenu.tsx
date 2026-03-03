import { useNavigate } from "react-router-dom"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

export function getMenuCardClassName(): string {
  return withInteractiveSurface("menu-card")
}

const cards = [
  { title: "Create Event", to: "/events/create", subtitle: "Configure courts and players" },
  { title: "View Events", to: "/events", subtitle: "Browse and manage all events" },
  { title: "Register Player", to: "/players/register", subtitle: "Add a new player to the roster" },
]

export function MagicBentoMenu() {
  const navigate = useNavigate()
  return (
    <div className="menu-grid">
      {cards.map((card) => (
        <button
          key={card.title}
          className={getMenuCardClassName()}
          onClick={() => navigate(card.to)}
        >
          <p className="menu-card-title">{card.title}</p>
          <p className="menu-card-copy">{card.subtitle}</p>
        </button>
      ))}
    </div>
  )
}
