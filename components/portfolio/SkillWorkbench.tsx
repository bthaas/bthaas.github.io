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
import {
  constrainSkillBody,
  resolveSkillCollisions,
  type SkillArenaBody,
} from '@/lib/skill-workbench-physics'

interface TokenMotion extends SkillArenaBody {
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
const KEYBOARD_NUDGE = 12
const AUTO_DROP_DELAY_MS = 850
const COLLISION_PASSES = 4
const SETTLED_HORIZONTAL_SPEED = 0.08
const SETTLED_VERTICAL_SPEED = 0.22

type PhysicsMode = 'dropped' | 'stuck'

function createMotion(): TokenMotion {
  return {
    bounds: EMPTY_BOUNDS,
    dragging: false,
    height: 0,
    homeLeft: 0,
    homeTop: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
    pointerId: null,
    velocityX: 0,
    velocityY: 0,
    width: 0,
    x: 0,
    y: 0,
  }
}

function resetMotion(motion: TokenMotion) {
  motion.dragging = false
  motion.lastPointerX = 0
  motion.lastPointerY = 0
  motion.lastPointerTime = 0
  motion.pointerId = null
  motion.velocityX = 0
  motion.velocityY = 0
  motion.x = 0
  motion.y = 0
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
  const [physicsMode, setPhysicsMode] = useState<PhysicsMode>('stuck')
  const arenaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const autoDropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const lastFrameTimeRef = useRef(0)
  const physicsModeRef = useRef<PhysicsMode>('stuck')
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([])
  const motionsRef = useRef<TokenMotion[]>(logos.map(() => createMotion()))
  const categories = useMemo(() => categoriesFrom(logos), [logos])

  const applyTransform = useCallback((index: number) => {
    const token = tokenRefs.current[index]
    const motion = motionsRef.current[index]

    if (token && motion) token.style.transform = tokenTransform(motion)
  }, [])

  const measureAll = useCallback(() => {
    const arena = arenaRef.current
    if (!arena) return

    const arenaRect = arena.getBoundingClientRect()
    tokenRefs.current.forEach((token, index) => {
      const item = itemRefs.current[index]
      const motion = motionsRef.current[index]
      if (!item || !motion || !token) return

      const itemRect = item.getBoundingClientRect()
      const tokenRect = token.getBoundingClientRect()
      const width = tokenRect.width || token.offsetWidth
      const height = tokenRect.height || token.offsetHeight
      const homeLeft = itemRect.left - arenaRect.left + (itemRect.width - width) / 2
      const homeTop = itemRect.top - arenaRect.top + (itemRect.height - height) / 2

      motion.width = width
      motion.height = height
      motion.homeLeft = homeLeft
      motion.homeTop = homeTop
      motion.bounds = {
        minX: -homeLeft,
        maxX: arenaRect.width - homeLeft - width,
        minY: -homeTop,
        maxY: arenaRect.height - homeTop - height,
      }
    })
  }, [])

  const animate = useCallback((timestamp: number) => {
    animationFrameRef.current = null
    if (physicsModeRef.current === 'stuck') return

    const elapsed = lastFrameTimeRef.current
      ? Math.min((timestamp - lastFrameTimeRef.current) / FRAME_MS, 2)
      : 1
    lastFrameTimeRef.current = timestamp
    let hasMovingToken = false

    motionsRef.current.forEach((motion) => {
      if (motion.dragging) return

      motion.velocityY += GRAVITY * elapsed
      motion.velocityX *= Math.pow(AIR_DRAG, elapsed)
      motion.velocityY *= Math.pow(AIR_DRAG, elapsed)
      motion.x += motion.velocityX * elapsed
      motion.y += motion.velocityY * elapsed
      constrainSkillBody(motion)
    })

    for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
      resolveSkillCollisions(motionsRef.current)
    }

    motionsRef.current.forEach((motion, index) => {
      if (motion.dragging) return
      constrainSkillBody(motion)
      if (
        Math.abs(motion.velocityX) < SETTLED_HORIZONTAL_SPEED
        && Math.abs(motion.velocityY) < SETTLED_VERTICAL_SPEED
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

    resetMotion(motion)
    applyTransform(index)
  }, [applyTransform])

  const cancelAutoDrop = useCallback(() => {
    if (autoDropTimerRef.current === null) return
    clearTimeout(autoDropTimerRef.current)
    autoDropTimerRef.current = null
  }, [])

  const stickSkills = useCallback(() => {
    cancelAutoDrop()
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame?.(animationFrameRef.current)
      animationFrameRef.current = null
    }

    motionsRef.current.forEach((_, index) => resetToken(index))
    physicsModeRef.current = 'stuck'
    setPhysicsMode('stuck')
    setDraggingLabel(null)
  }, [cancelAutoDrop, resetToken])

  const dropSkills = useCallback(() => {
    cancelAutoDrop()
    measureAll()
    motionsRef.current.forEach((motion, index) => {
      if (motion.dragging) return
      motion.velocityX = (((index * 17) % 11) - 5) * 0.075
      motion.velocityY = 0
    })
    physicsModeRef.current = 'dropped'
    setPhysicsMode('dropped')
    startAnimation()
  }, [cancelAutoDrop, measureAll, startAnimation])

  useEffect(() => {
    measureAll()
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!prefersReducedMotion) {
      autoDropTimerRef.current = setTimeout(dropSkills, AUTO_DROP_DELAY_MS)
    }

    return cancelAutoDrop
  }, [cancelAutoDrop, dropSkills, measureAll])

  useEffect(() => {
    const handleResize = () => {
      const shouldDrop = physicsModeRef.current === 'dropped'
      stickSkills()
      measureAll()
      if (shouldDrop) dropSkills()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAutoDrop()
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame?.(animationFrameRef.current)
      }
    }
  }, [cancelAutoDrop, dropSkills, measureAll, stickSkills])

  function handlePointerDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (physicsModeRef.current === 'stuck') return

    const motion = motionsRef.current[index]
    if (!motion) return

    measureAll()
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
    constrainSkillBody(motion)
    for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
      resolveSkillCollisions(motionsRef.current)
    }
    applyTransform(index)
    motionsRef.current.forEach((candidate, candidateIndex) => {
      if (candidateIndex === index) return
      constrainSkillBody(candidate)
      applyTransform(candidateIndex)
    })
    startAnimation()
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
    if (!motion || physicsModeRef.current === 'stuck') return

    const nudges: Readonly<Record<string, readonly [number, number]>> = {
      ArrowDown: [0, KEYBOARD_NUDGE],
      ArrowLeft: [-KEYBOARD_NUDGE, 0],
      ArrowRight: [KEYBOARD_NUDGE, 0],
      ArrowUp: [0, -KEYBOARD_NUDGE],
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      resetToken(index)
      for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
        resolveSkillCollisions(motionsRef.current)
      }
      motionsRef.current.forEach((candidate, candidateIndex) => {
        constrainSkillBody(candidate)
        applyTransform(candidateIndex)
      })
      startAnimation()
      return
    }

    const nudge = nudges[event.key]
    if (!nudge) return

    event.preventDefault()
    motion.x += nudge[0]
    motion.y += nudge[1]
    motion.velocityX = 0
    motion.velocityY = 0
    constrainSkillBody(motion)
    for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
      resolveSkillCollisions(motionsRef.current)
    }
    applyTransform(index)
    motionsRef.current.forEach((candidate, candidateIndex) => {
      if (candidateIndex === index) return
      constrainSkillBody(candidate)
      applyTransform(candidateIndex)
    })
    startAnimation()
  }

  return (
    <div
      className="skill-workbench"
      data-active-category={activeCategory ?? undefined}
      data-dragging={draggingLabel ?? undefined}
      data-physics={physicsMode}
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
            <span aria-live="polite">
              {physicsMode === 'stuck' ? 'tools · held' : 'tools · colliding'}
            </span>
          </p>
          <button
            className="skill-workbench__mode"
            type="button"
            onClick={physicsMode === 'stuck' ? dropSkills : stickSkills}
          >
            <span aria-hidden="true">{physicsMode === 'stuck' ? '↓' : '⌁'}</span>
            {physicsMode === 'stuck' ? 'Drop skills' : 'Stick skills'}
          </button>
        </div>
      </div>

      <div className="skill-workbench__interactive">
        <div className="skill-workbench__arena" ref={arenaRef}>
          <ul className="skill-workbench__list" aria-label="Movable technology tools">
            {logos.map((logo, index) => (
              <li
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
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
                  aria-disabled={physicsMode === 'stuck'}
                  data-cursor={physicsMode === 'dropped' ? 'move' : undefined}
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
            {physicsMode === 'stuck'
              ? 'Drop to release gravity'
              : 'Collision on · drag · toss · arrow keys'}
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
