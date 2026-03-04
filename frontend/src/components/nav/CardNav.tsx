import { gsap } from "gsap"
import { useLayoutEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import "./CardNav.css"

type GsapTimeline = gsap.core.Timeline
type GsapInstance = typeof gsap

// ── Card definitions ──────────────────────────────────────────────────────────

const NAV_CARDS = [
  {
    title: "Create Event",
    subtitle: "Configure courts and players",
    to: "/events/create",
    colorClass: "card-nav-card--create",
  },
  {
    title: "View Events",
    subtitle: "Browse and manage all events",
    to: "/events",
    colorClass: "card-nav-card--view",
  },
  {
    title: "Register Player",
    subtitle: "Add a new player to the roster",
    to: "/players/register",
    colorClass: "card-nav-card--register",
  },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLLAPSED_HEIGHT = 60 // px — height of the top bar strip

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function calculateExpandedHeight(navEl: HTMLElement): number {
  const isMobile = window.matchMedia("(max-width: 768px)").matches
  if (isMobile) {
    const content = navEl.querySelector<HTMLElement>(".card-nav-content")
    if (content) {
      const prev = {
        visibility: content.style.visibility,
        pointerEvents: content.style.pointerEvents,
        position: content.style.position,
        height: content.style.height,
      }
      content.style.visibility = "visible"
      content.style.pointerEvents = "auto"
      content.style.position = "static"
      content.style.height = "auto"
      void content.offsetHeight
      const measured = COLLAPSED_HEIGHT + content.scrollHeight + 8
      content.style.visibility = prev.visibility
      content.style.pointerEvents = prev.pointerEvents
      content.style.position = prev.position
      content.style.height = prev.height
      return measured
    }
  }
  return 260
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CardNavProps {
  logo: React.ReactNode
  controls: React.ReactNode  // theme toggle + animations toggle
}

export function CardNav({ logo, controls }: CardNavProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const tlRef = useRef<GsapTimeline | null>(null)

  const buildTimeline = () => {
    if (prefersReducedMotion()) return null
    const gsapModule = (globalThis as unknown as { gsap?: GsapInstance }).gsap
    if (!gsapModule || !navRef.current) return null

    const navEl = navRef.current
    gsapModule.set(navEl, { height: COLLAPSED_HEIGHT, overflow: "hidden" })
    gsapModule.set(cardsRef.current.filter(Boolean), { y: 40, opacity: 0 })

    const tl = gsapModule.timeline({ paused: true })
    tl.to(navEl, { height: () => calculateExpandedHeight(navEl), duration: 0.38, ease: "power3.out" })
    tl.to(
      cardsRef.current.filter(Boolean),
      { y: 0, opacity: 1, duration: 0.36, ease: "power3.out", stagger: 0.07 },
      "-=0.12",
    )
    return tl
  }

  useLayoutEffect(() => {
    let tl: GsapTimeline | null = null
    import("gsap").then(({ gsap }) => {
      ;(globalThis as unknown as Record<string, unknown>).gsap = gsap
      tl = buildTimeline()
      tlRef.current = tl
    })
    return () => {
      tl?.kill()
      tlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const handleResize = () => {
      const current = tlRef.current
      if (!current) return
      if (isOpen) {
        if (navRef.current) {
          const h = calculateExpandedHeight(navRef.current)
          const gsapModule = (globalThis as unknown as { gsap?: GsapInstance }).gsap
          gsapModule?.set(navRef.current, { height: h })
        }
        current.kill()
        const newTl = buildTimeline()
        if (newTl) { newTl.progress(1); tlRef.current = newTl }
      } else {
        current.kill()
        tlRef.current = buildTimeline() ?? null
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!isOpen) {
      setIsOpen(true)
      if (tl) {
        tl.play(0)
      } else if (navRef.current) {
        navRef.current.style.height = `${calculateExpandedHeight(navRef.current)}px`
      }
    } else {
      if (tl) {
        tl.eventCallback("onReverseComplete", () => {
          setIsOpen(false)
          tl.eventCallback("onReverseComplete", null)
        })
        tl.reverse()
      } else if (navRef.current) {
        navRef.current.style.height = `${COLLAPSED_HEIGHT}px`
        setIsOpen(false)
      }
    }
  }

  const handleCardClick = (to: string) => {
    const tl = tlRef.current
    const doNavigate = () => navigate(to)
    if (isOpen && tl) {
      tl.eventCallback("onReverseComplete", () => {
        setIsOpen(false)
        tl.eventCallback("onReverseComplete", null)
        doNavigate()
      })
      tl.reverse()
    } else {
      if (navRef.current) navRef.current.style.height = `${COLLAPSED_HEIGHT}px`
      setIsOpen(false)
      doNavigate()
    }
  }

  const setCardRef = (i: number) => (el: HTMLButtonElement | null) => {
    cardsRef.current[i] = el
  }

  return (
    <div className="card-nav-container">
      {/* ── Logo sidebar — always visible, floats above the bar ── */}
      <div className="card-nav-logo-sidebar">
        {logo}
      </div>

      {/* ── Animated nav panel (sits to the right of the logo) ── */}
      <nav
        ref={navRef}
        className={`card-nav${isOpen ? " card-nav--open" : ""}`}
        aria-label="Primary navigation"
      >
        {/* ── Top bar strip ── */}
        <div className="card-nav-top">
          <button
            type="button"
            className={`card-nav-hamburger${isOpen ? " card-nav-hamburger--open" : ""}`}
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className="card-nav-hamburger-line" />
            <span className="card-nav-hamburger-line" />
          </button>

          <div className="card-nav-end">{controls}</div>
        </div>

        {/* ── Expandable cards (drop down from the bar) ── */}
        <div className="card-nav-content" aria-hidden={!isOpen}>
          {NAV_CARDS.map((card, idx) => (
            <button
              key={card.title}
              ref={setCardRef(idx)}
              type="button"
              className={withInteractiveSurface(`menu-card card-nav-card ${card.colorClass}`)}
              onClick={() => handleCardClick(card.to)}
              tabIndex={isOpen ? 0 : -1}
            >
              <p className="menu-card-title">{card.title}</p>
              <p className="menu-card-copy">{card.subtitle}</p>
              <span className="card-nav-card-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
