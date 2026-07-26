'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import {
  createSkillRigidBodyWorld,
  type SkillRigidBodySnapshot,
  type SkillRigidBodyWorld,
} from '@/lib/skill-workbench-rigidbody'
import { getSkillTokenSize } from '@/lib/skill-token-size'

import {
  SkillLogoGrid,
  type SkillCategory,
  type SkillLogo,
} from './SkillLogos'

const FRAME_MS = 1000 / 60
const KEYBOARD_NUDGE = 12
const AUTO_DROP_DELAY_MS = 850
const FALLBACK_ARENA_WIDTH = 1_280
const FALLBACK_ARENA_HEIGHT = 520
const FALLBACK_TOKEN_WIDTH = 150
const FALLBACK_TOKEN_HEIGHT = 48

type PhysicsMode = 'dropped' | 'stuck'

interface TokenOrigin {
  readonly x: number
  readonly y: number
}

interface DragState {
  angularVelocity: number
  index: number
  lastPointerTime: number
  lastPointerX: number
  lastPointerY: number
  pointerId: number
  velocityX: number
  velocityY: number
}

function tokenTransform(
  snapshot: Pick<SkillRigidBodySnapshot, 'angle' | 'x' | 'y'>,
  origin: TokenOrigin,
) {
  const x = Math.round((snapshot.x - origin.x) * 100) / 100
  const y = Math.round((snapshot.y - origin.y) * 100) / 100
  const angle = Math.round(snapshot.angle * 10_000) / 10_000

  return `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`
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

function createPageSeed() {
  const values = new Uint32Array(1)
  globalThis.crypto?.getRandomValues?.(values)

  return values[0] || (Date.now() ^ Math.round(performance.now() * 1_000))
}

export function SkillWorkbench({ logos }: { readonly logos: readonly SkillLogo[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [physicsMode, setPhysicsMode] = useState<PhysicsMode>('stuck')
  const animationFrameRef = useRef<number | null>(null)
  const arenaRef = useRef<HTMLDivElement>(null)
  const autoDropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const lastFrameTimeRef = useRef(0)
  const originsRef = useRef<TokenOrigin[]>([])
  const physicsModeRef = useRef<PhysicsMode>('stuck')
  const seedRef = useRef<number | null>(null)
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([])
  const worldRef = useRef<SkillRigidBodyWorld | null>(null)
  const categories = useMemo(() => categoriesFrom(logos), [logos])

  const applySnapshots = useCallback(() => {
    const snapshots = worldRef.current?.getSnapshots()
    if (!snapshots) return

    snapshots.forEach((snapshot, index) => {
      const token = tokenRefs.current[index]
      const origin = originsRef.current[index]
      if (token && origin) token.style.transform = tokenTransform(snapshot, origin)
    })
  }, [])

  const initializeWorld = useCallback((mode: PhysicsMode) => {
    const arena = arenaRef.current
    if (!arena) return

    const arenaRect = arena.getBoundingClientRect()
    const arenaWidth = arenaRect.width || arena.clientWidth || FALLBACK_ARENA_WIDTH
    const arenaHeight = arenaRect.height || arena.clientHeight || FALLBACK_ARENA_HEIGHT
    const tokenSizes = tokenRefs.current.map((token) => {
      const tokenRect = token?.getBoundingClientRect()

      return {
        height: token?.offsetHeight || tokenRect?.height || FALLBACK_TOKEN_HEIGHT,
        width: token?.offsetWidth || tokenRect?.width || FALLBACK_TOKEN_WIDTH,
      }
    })

    originsRef.current = itemRefs.current.map((item, index) => {
      const itemRect = item?.getBoundingClientRect()
      if (itemRect?.width || itemRect?.height) {
        return {
          x: itemRect.left - arenaRect.left + itemRect.width / 2,
          y: itemRect.top - arenaRect.top + itemRect.height / 2,
        }
      }

      const column = index % 7
      const row = Math.floor(index / 7)

      return {
        x: (column + 0.5) * (arenaWidth / 7),
        y: (row + 0.5) * (arenaHeight / 4),
      }
    })

    worldRef.current?.destroy()
    seedRef.current ??= createPageSeed()
    worldRef.current = createSkillRigidBodyWorld({
      arenaHeight,
      arenaWidth,
      seed: seedRef.current,
      tokenSizes,
    })
    if (mode === 'dropped') worldRef.current.drop()
    applySnapshots()
    setIsReady(true)
  }, [applySnapshots])

  const animate = useCallback((timestamp: number) => {
    animationFrameRef.current = null
    const world = worldRef.current
    if (!world || physicsModeRef.current === 'stuck') return

    const elapsed = lastFrameTimeRef.current
      ? timestamp - lastFrameTimeRef.current
      : FRAME_MS
    lastFrameTimeRef.current = timestamp
    world.step(elapsed)
    applySnapshots()

    if (world.isMoving() || dragRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [applySnapshots])

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) return
    lastFrameTimeRef.current = 0
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [animate])

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

    dragRef.current = null
    worldRef.current?.stick()
    applySnapshots()
    physicsModeRef.current = 'stuck'
    setPhysicsMode('stuck')
    setDraggingLabel(null)
  }, [applySnapshots, cancelAutoDrop])

  const dropSkills = useCallback(() => {
    cancelAutoDrop()
    if (!worldRef.current) initializeWorld('stuck')
    worldRef.current?.drop()
    physicsModeRef.current = 'dropped'
    setPhysicsMode('dropped')
    applySnapshots()
    startAnimation()
  }, [
    applySnapshots,
    cancelAutoDrop,
    initializeWorld,
    startAnimation,
  ])

  useLayoutEffect(() => {
    initializeWorld('stuck')
  }, [initializeWorld])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!prefersReducedMotion) {
      autoDropTimerRef.current = setTimeout(dropSkills, AUTO_DROP_DELAY_MS)
    }

    return cancelAutoDrop
  }, [cancelAutoDrop, dropSkills])

  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame?.(animationFrameRef.current)
        animationFrameRef.current = null
      }
      dragRef.current = null
      initializeWorld(physicsModeRef.current)
      if (physicsModeRef.current === 'dropped') startAnimation()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAutoDrop()
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame?.(animationFrameRef.current)
      }
      worldRef.current?.destroy()
      worldRef.current = null
    }
  }, [
    cancelAutoDrop,
    initializeWorld,
    startAnimation,
  ])

  function handlePointerDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (physicsModeRef.current === 'stuck') return

    const snapshot = worldRef.current?.getSnapshots()[index]
    if (!snapshot) return

    worldRef.current?.beginDrag(index)
    dragRef.current = {
      angularVelocity: 0,
      index,
      lastPointerX: event.clientX,
      lastPointerY: event.clientY,
      lastPointerTime: event.timeStamp,
      pointerId: event.pointerId,
      velocityX: 0,
      velocityY: 0,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingLabel(logos[index].label)
    startAnimation()
  }

  function handlePointerMove(index: number, event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.index !== index || drag.pointerId !== event.pointerId) return

    const snapshot = worldRef.current?.getSnapshots()[index]
    if (!snapshot) return

    const deltaX = event.clientX - drag.lastPointerX
    const deltaY = event.clientY - drag.lastPointerY
    const elapsed = Math.max(event.timeStamp - drag.lastPointerTime, 8)
    drag.velocityX = (deltaX / elapsed) * FRAME_MS
    drag.velocityY = (deltaY / elapsed) * FRAME_MS
    drag.angularVelocity = (deltaX / elapsed) * 0.018
    drag.lastPointerX = event.clientX
    drag.lastPointerY = event.clientY
    drag.lastPointerTime = event.timeStamp
    worldRef.current?.dragBody(
      index,
      snapshot.x + deltaX,
      snapshot.y + deltaY,
      snapshot.angle + deltaX * 0.004,
    )
    applySnapshots()
    startAnimation()
  }

  function handlePointerEnd(index: number, event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.index !== index || drag.pointerId !== event.pointerId) return

    worldRef.current?.endDrag(
      index,
      drag.velocityX,
      drag.velocityY,
      drag.angularVelocity,
    )
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDraggingLabel(null)
    startAnimation()
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    if (!worldRef.current || physicsModeRef.current === 'stuck') return

    const nudges: Readonly<Record<string, readonly [number, number]>> = {
      ArrowDown: [0, KEYBOARD_NUDGE],
      ArrowLeft: [-KEYBOARD_NUDGE, 0],
      ArrowRight: [KEYBOARD_NUDGE, 0],
      ArrowUp: [0, -KEYBOARD_NUDGE],
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      worldRef.current.resetBody(index)
      applySnapshots()
      startAnimation()
      return
    }

    const nudge = nudges[event.key]
    if (!nudge) return

    event.preventDefault()
    worldRef.current.nudge(index, nudge[0], nudge[1])
    worldRef.current.step(FRAME_MS)
    applySnapshots()
    startAnimation()
  }

  return (
    <div
      className="skill-workbench"
      data-active-category={activeCategory ?? undefined}
      data-dragging={draggingLabel ?? undefined}
      data-physics={physicsMode}
      data-ready={isReady || undefined}
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
                data-dragging={draggingLabel === logo.label || undefined}
                data-skill-category={logo.categorySlug}
                key={logo.label}
                style={{
                  '--skill-category-color': logo.categoryColor,
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
                  data-skill-size={getSkillTokenSize(logo.label)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPointerCancel={(event) => handlePointerEnd(index, event)}
                  onPointerDown={(event) => handlePointerDown(index, event)}
                  onPointerMove={(event) => handlePointerMove(index, event)}
                  onPointerUp={(event) => handlePointerEnd(index, event)}
                  style={{
                    transform: 'translate3d(0px, 0px, 0) rotate(0rad)',
                  }}
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
              : 'Rigid bodies · drag · toss · arrow keys'}
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
