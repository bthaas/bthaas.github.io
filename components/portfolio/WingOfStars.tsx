'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  useId,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  CONSTELLATION_LABELS,
  CONSTELLATION_ORDER,
  getShootingStarDelayMs,
  WING_EDGES,
  WING_OUTLINE_PATH,
  WING_STAR_ORDER,
  WING_STARS,
  WING_VIEWBOX,
  type WingStarKey,
} from '@/lib/atlas-motion/wing-of-stars'

import type { SkillLogo } from './SkillLogos'

gsap.registerPlugin(
  useGSAP,
  DrawSVGPlugin,
  MotionPathPlugin,
  ScrambleTextPlugin,
  ScrollTrigger,
)

type StarStyle = CSSProperties & Readonly<Record<`--${string}`, string>>

const starPixels = { 1: 6, 2: 8, 3: 10 } as const

function isCoarseViewport(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 720
}

function skillStyle(
  logo: SkillLogo,
  star: (typeof WING_STARS)[WingStarKey],
): StarStyle {
  return {
    '--skill-color': `#${logo.hex}`,
    '--star-size': `${starPixels[star.size]}px`,
    '--star-x': `${(star.x / WING_VIEWBOX.width) * 100}%`,
    '--star-y': `${(star.y / WING_VIEWBOX.height) * 100}%`,
  }
}

export function WingOfStars({ logos }: { readonly logos: readonly SkillLogo[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const touchSelectionRef = useRef<WingStarKey | null>(null)
  const [activeSkill, setActiveSkill] = useState<WingStarKey | null>(null)
  const summaryId = useId()
  const logosByLabel = useMemo(
    () => new Map(logos.map((logo) => [logo.label, logo])),
    [logos],
  )

  useEffect(() => {
    const clearOutsideTouch = (event: PointerEvent) => {
      if (!isCoarseViewport()) return
      const root = rootRef.current
      if (root && event.target instanceof Node && root.contains(event.target)) return
      touchSelectionRef.current = null
      setActiveSkill(null)
    }
    document.addEventListener('pointerdown', clearOutsideTouch, true)
    return () => document.removeEventListener('pointerdown', clearOutsideTouch, true)
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      root.dataset.motion = reducedMotion ? 'reduced' : 'full'
      if (reducedMotion) return

      const outline = root.querySelector<SVGPathElement>('[data-wing-outline]')
      const asterisms = Array.from(
        root.querySelectorAll<SVGGElement>('[data-wing-asterism]'),
      )
      const stars = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-wing-star]'))
      const twinkles = Array.from(
        root.querySelectorAll<HTMLElement>('[data-wing-star-twinkle]'),
      )
      const shootingStar = root.querySelector<SVGGElement>('[data-wing-shooting-star]')
      const shootingPath = root.querySelector<SVGPathElement>('[data-wing-shooting-path]')
      if (!outline || stars.length === 0) return

      let idleTween: gsap.core.Tween | null = null
      let shootingTimer: gsap.core.Tween | null = null
      let shootingTimeline: gsap.core.Timeline | null = null
      let chartVisible = false
      const coarse = isCoarseViewport()

      const scheduleShootingStar = () => {
        if (coarse || !shootingStar || !shootingPath) return
        shootingTimer = gsap.delayedCall(getShootingStarDelayMs(Math.random()) / 1_000, () => {
          shootingTimeline = gsap.timeline({ onComplete: scheduleShootingStar })
          shootingTimeline.set(shootingStar, { opacity: 0 })
          shootingTimeline.to(shootingStar, { duration: 0.12, opacity: 1 }, 0)
          shootingTimeline.to(
            shootingStar,
            {
              duration: 0.7,
              ease: 'power1.in',
              motionPath: {
                align: shootingPath,
                alignOrigin: [0.5, 0.5],
                autoRotate: true,
                path: shootingPath,
              },
            },
            0,
          )
          shootingTimeline.to(shootingStar, { duration: 0.22, opacity: 0 }, 0.48)
        })
      }

      const startIdle = () => {
        idleTween = gsap.to(twinkles, {
          delay: (index) => (index % 7) * 0.19,
          duration: (index) => 2.8 + (index % 5) * 0.42,
          ease: 'sine.inOut',
          opacity: (index) => coarse ? 0.9 - (index % 3) * 0.025 : 0.82 - (index % 4) * 0.035,
          repeat: -1,
          scale: (index) => coarse ? 0.985 + (index % 2) * 0.025 : 0.94 + (index % 3) * 0.04,
          stagger: { each: 0.11, from: 'random' },
          yoyo: true,
        })
        scheduleShootingStar()
        if (!chartVisible) {
          idleTween.pause()
          shootingTimer?.pause()
        }
      }

      const entrance = gsap.timeline({
        onComplete: startIdle,
        paused: true,
      })
      entrance.to(outline, { drawSVG: '100%', duration: 0.72, ease: 'power1.out' }, 0)
      asterisms.forEach((asterism, index) => {
        entrance.to(
          asterism.querySelectorAll('[data-wing-edge]'),
          { drawSVG: '100%', duration: 0.5, ease: 'power1.out', stagger: 0.04 },
          0.14 + index * 0.14,
        )
      })
      entrance.to(
        stars,
        {
          duration: 0.46,
          ease: 'back.out(1.8)',
          opacity: 1,
          scale: 1,
          stagger: 0.04,
        },
        0.08,
      )

      let entranceStarted = false
      const playEntrance = () => {
        if (entranceStarted) return
        entranceStarted = true
        gsap.set(outline, { drawSVG: '0%' })
        asterisms.forEach((asterism) => {
          gsap.set(asterism.querySelectorAll('[data-wing-edge]'), { drawSVG: '0%' })
        })
        gsap.set(stars, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
        entrance.play(0)
      }
      const entranceTrigger = ScrollTrigger.create({
        onEnter: playEntrance,
        once: true,
        start: 'top 78%',
        trigger: root,
      })
      const entranceObserver = new IntersectionObserver(
        ([entry]) => {
          chartVisible = entry.isIntersecting
          if (chartVisible) {
            playEntrance()
            idleTween?.resume()
            shootingTimer?.resume()
            shootingTimeline?.resume()
          } else {
            idleTween?.pause()
            shootingTimer?.pause()
            shootingTimeline?.pause()
          }
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
      )
      entranceObserver.observe(root)

      if (!coarse) {
        const farStars = stars.filter((star) => star.dataset.depth === 'far')
        const nearStars = stars.filter((star) => star.dataset.depth === 'near')
        const farX = gsap.quickTo(farStars, 'x', { duration: 0.65, ease: 'power3.out' })
        const farY = gsap.quickTo(farStars, 'y', { duration: 0.65, ease: 'power3.out' })
        const nearX = gsap.quickTo(nearStars, 'x', { duration: 0.65, ease: 'power3.out' })
        const nearY = gsap.quickTo(nearStars, 'y', { duration: 0.65, ease: 'power3.out' })
        let bounds = root.getBoundingClientRect()
        const measure = () => {
          bounds = root.getBoundingClientRect()
        }
        const handlePointerMove = (event: PointerEvent) => {
          const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * 2
          const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5) * 2
          farX(x * 4)
          farY(y * 4)
          nearX(x * 8)
          nearY(y * 8)
        }
        const resetParallax = () => {
          farX(0)
          farY(0)
          nearX(0)
          nearY(0)
        }
        root.addEventListener('pointerenter', measure)
        root.addEventListener('pointermove', handlePointerMove, { passive: true })
        root.addEventListener('pointerleave', resetParallax)
        window.addEventListener('resize', measure, { passive: true })

        return () => {
          root.removeEventListener('pointerenter', measure)
          root.removeEventListener('pointermove', handlePointerMove)
          root.removeEventListener('pointerleave', resetParallax)
          window.removeEventListener('resize', measure)
          farX.tween.kill()
          farY.tween.kill()
          nearX.tween.kill()
          nearY.tween.kill()
          entranceObserver.disconnect()
          entranceTrigger.kill()
          entrance.kill()
          idleTween?.kill()
          shootingTimer?.kill()
          shootingTimeline?.kill()
        }
      }

      return () => {
        entranceObserver.disconnect()
        entranceTrigger.kill()
        entrance.kill()
        idleTween?.kill()
        shootingTimer?.kill()
        shootingTimeline?.kill()
      }
    },
    { scope: rootRef },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const stars = Array.from(root.querySelectorAll<HTMLElement>('[data-wing-star]'))
      const edges = Array.from(root.querySelectorAll<SVGLineElement>('[data-wing-edge]'))
      const glyphs = Array.from(root.querySelectorAll<HTMLElement>('[data-wing-star-glyph]'))
      const halos = Array.from(root.querySelectorAll<HTMLElement>('.wing-star__halo'))
      const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-wing-star-label]'))
      const flares = Array.from(root.querySelectorAll<HTMLElement>('[data-wing-star-flare]'))

      if (!activeSkill) {
        gsap.to(stars, { duration: 0.22, opacity: 1 })
        gsap.to(edges, { duration: 0.22, opacity: 0.58, stroke: 'rgb(255 253 245 / 48%)' })
        gsap.to(glyphs, { duration: 0.16, opacity: 0, scale: 0.58 })
        gsap.to(halos, { duration: 0.18, opacity: 0.76 })
        gsap.to(labels, { duration: 0.16, opacity: 0, x: 5 })
        gsap.to(flares, { duration: 0.22, scale: 1 })
        return
      }

      const activeConstellation = WING_STARS[activeSkill].constellation
      const activeStar = stars.find((star) => star.dataset.wingStar === activeSkill)
      const activeGlyph = activeStar?.querySelector<HTMLElement>('[data-wing-star-glyph]')
      const activeHalos = activeStar?.querySelectorAll<HTMLElement>('.wing-star__halo')
      const activeLabel = activeStar?.querySelector<HTMLElement>('[data-wing-star-label]')
      const activeFlare = activeStar?.querySelector<HTMLElement>('[data-wing-star-flare]')

      gsap.to(stars, {
        duration: 0.22,
        opacity: (_, target) => target === activeStar ? 1 : 0.35,
      })
      gsap.to(edges, {
        duration: 0.22,
        opacity: (_, target) => target.dataset.constellation === activeConstellation ? 1 : 0.35,
        stroke: (_, target) => target.dataset.constellation === activeConstellation
          ? 'rgb(255 253 245 / 92%)'
          : 'rgb(255 253 245 / 48%)',
      })
      gsap.to(glyphs, { duration: 0.16, opacity: 0, scale: 0.58 })
      gsap.to(halos, { duration: 0.18, opacity: 0.76 })
      gsap.to(labels, { duration: 0.16, opacity: 0, x: 5 })
      gsap.to(flares, { duration: 0.22, scale: 1 })
      if (activeFlare) {
        gsap.fromTo(
          activeFlare,
          { scale: 1 },
          { duration: 0.3, ease: 'back.out(2)', scale: 2.15 },
        )
      }
      if (activeGlyph) {
        gsap.fromTo(
          activeGlyph,
          { opacity: 0, scale: 0.58 },
          { duration: 0.24, ease: 'back.out(1.8)', opacity: 1, scale: 1 },
        )
      }
      if (activeHalos) gsap.to(activeHalos, { duration: 0.24, opacity: 1 })
      if (activeLabel) {
        gsap.fromTo(
          activeLabel,
          { opacity: 0, x: 5 },
          {
            duration: 0.35,
            ease: 'power2.out',
            opacity: 1,
            scrambleText: {
              chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
              text: activeSkill,
            },
            x: 0,
          },
        )
      }
    },
    { dependencies: [activeSkill], revertOnUpdate: true, scope: rootRef },
  )

  const clearSelection = () => {
    touchSelectionRef.current = null
    setActiveSkill(null)
  }

  const handleBackgroundPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('[data-wing-star]')) return
    clearSelection()
  }

  const handleClick = (key: WingStarKey) => {
    if (!isCoarseViewport()) {
      setActiveSkill(key)
      return
    }
    const next = touchSelectionRef.current === key ? null : key
    touchSelectionRef.current = next
    setActiveSkill(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    clearSelection()
    event.currentTarget.blur()
  }

  return (
    <figure
      ref={rootRef}
      className="wing-chart"
      role="region"
      aria-label="Wing of Stars skill chart"
      data-active-skill={activeSkill ?? undefined}
      data-motion="static"
      data-testid="wing-chart"
      data-wing-chart
      onPointerDown={handleBackgroundPointerDown}
    >
      <figcaption className="wing-chart__caption">
        <span>Chart 03 — Navigate by skill</span>
        <span>{CONSTELLATION_ORDER.map((key) => CONSTELLATION_LABELS[key]).join(' · ')}</span>
      </figcaption>
      <p className="sr-only" id={summaryId}>
        Skills: {logos.map(({ label }) => label).join(', ')}.
      </p>
      <div className="wing-chart__sky">
        <svg
          className="wing-chart__lines"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${WING_VIEWBOX.width} ${WING_VIEWBOX.height}`}
        >
          <path className="wing-chart__outline" d={WING_OUTLINE_PATH} data-wing-outline />
          {CONSTELLATION_ORDER.map((constellation) => (
            <g
              data-constellation={constellation}
              data-wing-asterism={constellation}
              key={constellation}
            >
              {WING_EDGES.filter((edge) => edge.constellation === constellation).map((edge) => (
                <line
                  className="wing-chart__edge"
                  data-active={
                    activeSkill && WING_STARS[activeSkill].constellation === constellation
                      ? 'true'
                      : undefined
                  }
                  data-constellation={constellation}
                  data-dimmed={
                    activeSkill && WING_STARS[activeSkill].constellation !== constellation
                      ? 'true'
                      : undefined
                  }
                  data-wing-edge
                  key={`${edge.from}-${edge.to}`}
                  x1={WING_STARS[edge.from].x}
                  x2={WING_STARS[edge.to].x}
                  y1={WING_STARS[edge.from].y}
                  y2={WING_STARS[edge.to].y}
                />
              ))}
            </g>
          ))}
          <path
            className="wing-chart__shooting-path"
            d="M 985 18 C 940 52 894 83 820 126"
            data-wing-shooting-path
          />
          <g
            className="wing-chart__shooting-star"
            data-wing-shooting-star
            aria-hidden="true"
          >
            <line x1="-32" x2="0" y1="0" y2="0" />
            <circle cx="0" cy="0" r="2.4" />
          </g>
        </svg>
        <ul
          className="wing-chart__stars"
          aria-describedby={summaryId}
          aria-label="Skills mapped as stars"
        >
          {WING_STAR_ORDER.flatMap((key) => {
            const logo = logosByLabel.get(key)
            if (!logo) return []
            const star = WING_STARS[key]
            const active = activeSkill === key
            const dimmed = Boolean(activeSkill && !active)
            return (
              <li key={key}>
                <button
                  className="wing-star"
                  type="button"
                  aria-label={logo.label}
                  aria-pressed={active}
                  data-active={active ? 'true' : undefined}
                  data-constellation={star.constellation}
                  data-depth={star.size === 3 ? 'near' : 'far'}
                  data-dimmed={dimmed ? 'true' : undefined}
                  data-label-side={star.x >= 760 ? 'left' : 'right'}
                  data-wing-star={key}
                  style={skillStyle(logo, star)}
                  onBlur={() => {
                    if (touchSelectionRef.current === key) return
                    clearSelection()
                  }}
                  onClick={() => handleClick(key)}
                  onFocus={() => setActiveSkill(key)}
                  onKeyDown={handleKeyDown}
                  onPointerEnter={() => {
                    if (!isCoarseViewport()) setActiveSkill(key)
                  }}
                  onPointerLeave={(event) => {
                    if (isCoarseViewport() || document.activeElement === event.currentTarget) return
                    setActiveSkill(null)
                  }}
                >
                  <span className="wing-star__flare" data-wing-star-flare aria-hidden="true">
                    <span className="wing-star__twinkle" data-wing-star-twinkle>
                      <span className="wing-star__halo wing-star__halo--outer" />
                      <span className="wing-star__halo wing-star__halo--inner" />
                      <span className="wing-star__core" />
                    </span>
                  </span>
                  <span className="wing-star__glyph" data-wing-star-glyph aria-hidden="true">
                    <svg focusable="false" viewBox="0 0 24 24">
                      <path d={logo.path} fill="currentColor" />
                    </svg>
                  </span>
                  <span className="wing-star__label" data-wing-star-label>
                    {logo.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </figure>
  )
}
