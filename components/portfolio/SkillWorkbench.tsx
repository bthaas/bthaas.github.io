'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import {
  SkillLogoGrid,
  type SkillCategory,
  type SkillLogo,
} from './SkillLogos'

interface TokenMotion {
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  dragging: boolean
  lastPointerX: number
  lastPointerY: number
  lastPointerTime: number
  pointerId: number | null
  velocityX: number
  velocityY: number
  x: number
  y: number
}

const EMPTY_BOUNDS = {
  minX: Number.NEGATIVE_INFINITY,
  maxX: Number.POSITIVE_INFINITY,
  minY: Number.NEGATIVE_INFINITY,
  maxY: Number.POSITIVE_INFINITY,
}

const FRAME_MS = 1000 / 60
const GRAVITY = 0.54
const AIR_DRAG = 0.986
const BOUNCE = 0.54
const KEYBOARD_NUDGE = 12

function createMotion(): TokenMotion {
  return {
    bounds: EMPTY_BOUNDS,
    dragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
    pointerId: null,
    velocityX: 0,
    velocityY: 0,
    x: 0,
    y: 0,
  }
}

function tokenAngle(index: number) {
  return `${((index * 7) % 9 - 4) * 0.32}deg`
}

function tokenTransform(motion: Pick<TokenMotion, 'x' | 'y'>) {
  const x = Math.round(motion.x * 100) / 100
  const y = Math.round(motion.y * 100) / 100

  return `translate3d(${x}px, ${y}px, 0) rotate(var(--skill-angle))`
}

function categoriesFrom(logos: readonly SkillLogo[]): readonly SkillCategory[] {
  const categories = new Map<string, SkillCategory>()

  logos.forEach((logo) => {
    if (categories.has(logo.categorySlug)) return
    categories.set(logo.categorySlug, {
      label: logo.category,
      slug: logo.categorySlug,
      color: logo.categoryColor,
    })
  })

  return [...categories.values()]
}

export function SkillWorkbench({ logos }: { readonly logos: readonly SkillLogo[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const arenaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([])
  const motionsRef = useRef<TokenMotion[]>(logos.map(() => createMotion()))
  const categories = useMemo(() => categoriesFrom(logos), [logos])

  const applyTransform = useCallback((index: number) => {
    const token = tokenRefs.current[index]
    const motion = motionsRef.current[index]

    if (token && motion) token.style.transform = tokenTransform(motion)
  }, [])

  const measureBounds = useCallback((index: number) => {
    const arena = arenaRef.current
    const token = tokenRefs.current[index]
    const motion = motionsRef.current[index]

    if (!arena || !token || !motion) return

    const arenaRect = arena.getBoundingClientRect()
    const tokenRect = token.getBoundingClientRect()
    motion.bounds = {
      minX: arenaRect.left - tokenRect.left + motion.x,
      maxX: arenaRect.right - tokenRect.right + motion.x,
      minY: arenaRect.top - tokenRect.top + motion.y,
      maxY: arenaRect.bottom - tokenRect.bottom + motion.y,
    }
  }, [])

  const animate = useCallback((timestamp: number) => {
    animationFrameRef.current = null
    const elapsed = lastFrameTimeRef.current
      ? Math.min((timestamp - lastFrameTimeRef.current) / FRAME_MS, 2)
      : 1
    lastFrameTimeRef.current = timestamp
    let hasMovingToken = false

    motionsRef.current.forEach((motion, index) => {
      if (motion.dragging) return
      if (Math.abs(motion.velocityX) < 0.01 && Math.abs(motion.velocityY) < 0.01) return

      motion.velocityY += GRAVITY * elapsed
      motion.velocityX *= Math.pow(AIR_DRAG, elapsed)
      motion.velocityY *= Math.pow(AIR_DRAG, elapsed)
      motion.x += motion.velocityX * elapsed
      motion.y += motion.velocityY * elapsed

      if (motion.x < motion.bounds.minX) {
        motion.x = motion.bounds.minX
        motion.velocityX = Math.abs(motion.velocityX) * BOUNCE
      } else if (motion.x > motion.bounds.maxX) {
        motion.x = motion.bounds.maxX
        motion.velocityX = -Math.abs(motion.velocityX) * BOUNCE
      }

      if (motion.y < motion.bounds.minY) {
        motion.y = motion.bounds.minY
        motion.velocityY = Math.abs(motion.velocityY) * BOUNCE
      } else if (motion.y > motion.bounds.maxY) {
        motion.y = motion.bounds.maxY
        motion.velocityY = -Math.abs(motion.velocityY) * BOUNCE
      }

      if (
        Math.abs(motion.velocityX) < 0.08
        && Math.abs(motion.velocityY) < 0.3
        && Math.abs(motion.y - motion.bounds.maxY) < 0.5
      ) {
        motion.velocityX = 0
        motion.velocityY = 0
      } else {
        hasMovingToken = true
      }

      applyTransform(index)
    })

    if (hasMovingToken) animationFrameRef.current = requestAnimationFrame(animate)
  }, [applyTransform])

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) return
    lastFrameTimeRef.current = 0
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [animate])

  const resetToken = useCallback((index: number) => {
    const motion = motionsRef.current[index]
    if (!motion) return

    Object.assign(motion, createMotion())
    applyTransform(index)
  }, [applyTransform])

  const resetAll = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    motionsRef.current.forEach((_, index) => resetToken(index))
    setActiveCategory(null)
    setDraggingLabel(null)
  }, [resetToken])

  useEffect(() => {
    const handleResize = () => resetAll()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [resetAll])

  function handlePointerDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const motion = motionsRef.current[index]
    if (!motion) return

    measureBounds(index)
    motion.dragging = true
    motion.pointerId = event.pointerId
    motion.lastPointerX = event.clientX
    motion.lastPointerY = event.clientY
    motion.lastPointerTime = event.timeStamp
    motion.velocityX = 0
    motion.velocityY = 0
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingLabel(logos[index].label)
  }

  function handlePointerMove(index: number, event: PointerEvent<HTMLButtonElement>) {
    const motion = motionsRef.current[index]
    if (!motion?.dragging || motion.pointerId !== event.pointerId) return

    const deltaX = event.clientX - motion.lastPointerX
    const deltaY = event.clientY - motion.lastPointerY
    const elapsed = Math.max(event.timeStamp - motion.lastPointerTime, 8)
    motion.x += deltaX
    motion.y += deltaY
    motion.velocityX = (deltaX / elapsed) * FRAME_MS
    motion.velocityY = (deltaY / elapsed) * FRAME_MS
    motion.lastPointerX = event.clientX
    motion.lastPointerY = event.clientY
    motion.lastPointerTime = event.timeStamp
    applyTransform(index)
  }

  function handlePointerEnd(index: number, event: PointerEvent<HTMLButtonElement>) {
    const motion = motionsRef.current[index]
    if (!motion?.dragging || motion.pointerId !== event.pointerId) return

    motion.dragging = false
    motion.pointerId = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDraggingLabel(null)
    startAnimation()
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const motion = motionsRef.current[index]
    if (!motion) return

    const nudges: Readonly<Record<string, readonly [number, number]>> = {
      ArrowDown: [0, KEYBOARD_NUDGE],
      ArrowLeft: [-KEYBOARD_NUDGE, 0],
      ArrowRight: [KEYBOARD_NUDGE, 0],
      ArrowUp: [0, -KEYBOARD_NUDGE],
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      resetToken(index)
      return
    }

    const nudge = nudges[event.key]
    if (!nudge) return

    event.preventDefault()
    motion.x += nudge[0]
    motion.y += nudge[1]
    motion.velocityX = 0
    motion.velocityY = 0
    applyTransform(index)
  }

  return (
    <div
      className="skill-workbench"
      data-active-category={activeCategory ?? undefined}
      data-dragging={draggingLabel ?? undefined}
      aria-label="Interactive skill workbench"
      role="region"
    >
      <div className="skill-workbench__header">
        <div>
          <p className="eyebrow">03 / Skills</p>
          <h2 id="craft-title">Pick up the stack.</h2>
        </div>
        <div className="skill-workbench__meta">
          <p>
            <strong>{logos.length}</strong>
            <span>movable tools</span>
          </p>
          <button className="skill-workbench__reset" type="button" onClick={resetAll}>
            <span aria-hidden="true">↺</span>
            Reset workbench
          </button>
        </div>
      </div>

      <div className="skill-workbench__interactive">
        <div className="skill-workbench__arena" ref={arenaRef}>
          <ul className="skill-workbench__list" aria-label="Movable technology tools">
            {logos.map((logo, index) => (
              <li
                className="skill-workbench__item"
                data-skill-category={logo.categorySlug}
                key={logo.label}
                style={{
                  '--skill-category-color': logo.categoryColor,
                  '--skill-angle': tokenAngle(index),
                } as CSSProperties}
              >
                <button
                  ref={(node) => {
                    tokenRefs.current[index] = node
                  }}
                  className="skill-workbench__token"
                  type="button"
                  aria-label={`${logo.label}, ${logo.category}`}
                  data-cursor="move"
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPointerCancel={(event) => handlePointerEnd(index, event)}
                  onPointerDown={(event) => handlePointerDown(index, event)}
                  onPointerMove={(event) => handlePointerMove(index, event)}
                  onPointerUp={(event) => handlePointerEnd(index, event)}
                  style={{ transform: tokenTransform(motionsRef.current[index]) }}
                >
                  <svg
                    className="skill-workbench__glyph"
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 24 24"
                    style={{ color: `#${logo.hex}` }}
                  >
                    <path fill="currentColor" d={logo.path} />
                  </svg>
                  <span>{logo.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="skill-workbench__hint" aria-hidden="true">
            Drag · toss · use arrow keys
          </p>
        </div>
      </div>

      <div
        className="skill-workbench__fallback"
        data-testid="skill-workbench-fallback"
      >
        <SkillLogoGrid logos={logos} />
      </div>

      <div
        className="skill-workbench__filters"
        aria-label="Filter skills by category"
        role="group"
      >
        {categories.map((category) => (
          <button
            type="button"
            aria-pressed={activeCategory === category.slug}
            key={category.slug}
            onClick={() => {
              setActiveCategory((current) => current === category.slug ? null : category.slug)
            }}
            style={{ '--skill-category-color': category.color } as CSSProperties}
          >
            <span aria-hidden="true" />
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
