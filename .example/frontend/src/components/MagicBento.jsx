import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import './MagicBento.css'

const DEFAULT_SPOTLIGHT_RADIUS = 400

function createRipple(container, x, y, glowColor) {
  const rect = container.getBoundingClientRect()
  const maxDistance = Math.max(
    Math.hypot(x, y),
    Math.hypot(x - rect.width, y),
    Math.hypot(x, y - rect.height),
    Math.hypot(x - rect.width, y - rect.height)
  )

  const ripple = document.createElement('div')
  ripple.className = 'magic-ripple'
  ripple.style.width = `${maxDistance * 2}px`
  ripple.style.height = `${maxDistance * 2}px`
  ripple.style.left = `${x - maxDistance}px`
  ripple.style.top = `${y - maxDistance}px`
  ripple.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%)`
  container.appendChild(ripple)

  gsap.fromTo(
    ripple,
    { scale: 0, opacity: 1 },
    {
      scale: 1,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => ripple.remove(),
    }
  )
}

export default function MagicBento({
  cards,
  onCardClick,
  textAutoHide = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = '42, 53, 131',
  disableAnimations = false,
}) {
  const sectionRef = useRef(null)
  const spotlightRef = useRef(null)

  const safeCards = useMemo(() => cards || [], [cards])

  useEffect(() => {
    if (disableAnimations || !enableSpotlight || !sectionRef.current) {
      return undefined
    }

    const section = sectionRef.current
    const spotlight = document.createElement('div')
    spotlight.className = 'magic-global-spotlight'
    spotlight.style.setProperty('--spot-rgb', glowColor)
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const handleMouseMove = (event) => {
      const rect = section.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!inside) {
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' })
        return
      }

      spotlight.style.width = `${spotlightRadius * 2}px`
      spotlight.style.height = `${spotlightRadius * 2}px`

      gsap.to(spotlight, {
        opacity: 0.75,
        left: event.clientX,
        top: event.clientY,
        duration: 0.15,
        ease: 'power2.out',
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (spotlightRef.current && spotlightRef.current.parentNode) {
        spotlightRef.current.parentNode.removeChild(spotlightRef.current)
      }
    }
  }, [disableAnimations, enableSpotlight, glowColor, spotlightRadius])

  return (
    <section ref={sectionRef} className="magic-bento-grid">
      {safeCards.map((card) => (
        <button
          key={card.id}
          type="button"
          className={`magic-bento-card ${textAutoHide ? 'magic-bento-card--text-autohide' : ''} ${
            enableBorderGlow ? 'magic-bento-card--border-glow' : ''
          }`}
          style={{ '--glow-rgb': glowColor }}
          onMouseMove={(event) => {
            if (disableAnimations) {
              return
            }

            const cardElement = event.currentTarget
            const rect = cardElement.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            cardElement.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`)
            cardElement.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`)
            cardElement.style.setProperty('--glow-intensity', '1')

            if (enableTilt) {
              const rotateX = ((y - centerY) / centerY) * -8
              const rotateY = ((x - centerX) / centerX) * 8
              gsap.to(cardElement, { rotateX, rotateY, duration: 0.1, ease: 'power2.out' })
            }

            if (enableMagnetism) {
              gsap.to(cardElement, {
                x: (x - centerX) * 0.04,
                y: (y - centerY) * 0.04,
                duration: 0.2,
                ease: 'power2.out',
              })
            }
          }}
          onMouseLeave={(event) => {
            const cardElement = event.currentTarget
            cardElement.style.setProperty('--glow-intensity', '0')
            if (!disableAnimations) {
              gsap.to(cardElement, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.25 })
            }
          }}
          onClick={(event) => {
            if (clickEffect && !disableAnimations) {
              const rect = event.currentTarget.getBoundingClientRect()
              createRipple(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top, glowColor)
            }
            onCardClick?.(card)
          }}
        >
          <div className="magic-bento-card__label">{card.label}</div>
          <div className="magic-bento-card__content">
            <h3 className="magic-bento-card__title">{card.title}</h3>
            <p className="magic-bento-card__description">{card.description}</p>
          </div>
        </button>
      ))}
    </section>
  )
}
