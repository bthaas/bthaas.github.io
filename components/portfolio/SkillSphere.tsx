'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  clampPitch,
  createSkillSphereWireframe,
  decayVelocity,
  projectPoint,
  projectSpherePointInto,
  rotatePoint,
  spreadSkillSphereOrder,
  type MutableSphereProjection,
  type SkillSphereWireframeEdge,
  type SphereVector,
} from '@/lib/atlas-motion/skill-sphere'

import type { SkillLogo } from './SkillLogos'

const INITIAL_YAW = -0.58
const INITIAL_PITCH = -0.16
const POINTER_SENSITIVITY = 0.0045
const DESKTOP_IDLE_SPEED = 0.006
const MOBILE_IDLE_SPEED = 0.0038
const SKILL_SPHERE_COLUMNS = 7
const SKILL_SPHERE_ROWS = 4
const MIN_LINE_OPACITY = 0.14
const MAX_LINE_OPACITY = 0.5

type SphereItemStyle = CSSProperties & Readonly<Record<`--${string}`, string>>

interface MotionState {
  dragging: boolean
  lastX: number
  lastY: number
  pitch: number
  pitchVelocity: number
  pointerId: number | null
  yaw: number
  yawVelocity: number
}

const cssNumber = (value: number) => value.toFixed(6)

function initialItemStyle(
  point: SphereVector,
  logo: SkillLogo,
): SphereItemStyle {
  const rotated = rotatePoint(point, INITIAL_YAW, INITIAL_PITCH)
  const projection = projectPoint(rotated, 0, 100)
  return {
    '--sphere-initial-left': `${cssNumber(50 + rotated.x * 15.5)}%`,
    '--sphere-initial-opacity': cssNumber(projection.opacity),
    '--sphere-initial-scale': cssNumber(projection.scale),
    '--sphere-initial-top': `${cssNumber(50 + rotated.y * 31)}%`,
    '--sphere-initial-z': String(projection.z),
    '--sphere-mobile-left': `${cssNumber(50 + rotated.x * 36)}%`,
    '--sphere-mobile-top': `${cssNumber(50 + rotated.y * 28.8)}%`,
    '--skill-color': `#${logo.hex}`,
  }
}

function initialMeshProjection(point: SphereVector) {
  const rotated = rotatePoint(point, INITIAL_YAW, INITIAL_PITCH)
  return {
    x: 50 + rotated.x * 15.5,
    y: 50 + rotated.y * 31,
    z: Math.round(((rotated.z + 1) / 2) * 200),
  }
}

function edgePath(
  edge: SkillSphereWireframeEdge,
  nodes: readonly MutableSphereProjection[],
  control: MutableSphereProjection,
): string {
  const from = nodes[edge.from]
  const to = nodes[edge.to]
  return `M ${cssNumber(from.x)} ${cssNumber(from.y)} Q ${cssNumber(control.x)} ${cssNumber(control.y)} ${cssNumber(to.x)} ${cssNumber(to.y)}`
}

function initialEdgePath(
  edge: SkillSphereWireframeEdge,
  nodes: readonly SphereVector[],
): string {
  const from = initialMeshProjection(nodes[edge.from])
  const control = initialMeshProjection(edge.control)
  const to = initialMeshProjection(nodes[edge.to])
  return `M ${cssNumber(from.x)} ${cssNumber(from.y)} Q ${cssNumber(control.x)} ${cssNumber(control.y)} ${cssNumber(to.x)} ${cssNumber(to.y)}`
}

function lineOpacity(
  from: Pick<MutableSphereProjection, 'z'>,
  control: Pick<MutableSphereProjection, 'z'>,
  to: Pick<MutableSphereProjection, 'z'>,
): number {
  const depth = (from.z + control.z + to.z) / 600
  return MIN_LINE_OPACITY + (MAX_LINE_OPACITY - MIN_LINE_OPACITY) * depth
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 720
}

export function SkillSphere({ logos }: { readonly logos: readonly SkillLogo[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const meshRef = useRef<SVGSVGElement>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const edgeRefs = useRef<Array<SVGPathElement | null>>([])
  const renderProjectionRef = useRef<(() => void) | null>(null)
  const touchSelectionRef = useRef<string | null>(null)
  const pausedRef = useRef(false)
  const visibleRef = useRef(false)
  const reducedMotionRef = useRef(true)
  const didDragRef = useRef(false)
  const motionRef = useRef<MotionState>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    pitch: INITIAL_PITCH,
    pitchVelocity: 0,
    pointerId: null,
    yaw: INITIAL_YAW,
    yawVelocity: 0,
  })
  const summaryId = useId()
  const wireframe = useMemo(
    () => createSkillSphereWireframe(SKILL_SPHERE_COLUMNS, SKILL_SPHERE_ROWS),
    [],
  )
  const skillOrder = useMemo(() => spreadSkillSphereOrder(logos.length), [logos.length])
  const positionedLogos = useMemo(
    () => skillOrder.map((catalogIndex) => logos[catalogIndex]),
    [logos, skillOrder],
  )
  const points = wireframe.points
  const nodeProjections = useMemo<MutableSphereProjection[]>(() => wireframe.nodes.map(() => ({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    z: 100,
  })), [wireframe.nodes])
  const controlProjections = useMemo<MutableSphereProjection[]>(() => wireframe.edges.map(() => ({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    z: 100,
  })), [wireframe.edges])
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)

  const setSelection = useCallback((label: string, persistForTouch = false) => {
    if (persistForTouch) touchSelectionRef.current = label
    pausedRef.current = true
    setPaused(true)
    setActiveSkill(label)
  }, [])

  const clearSelection = useCallback(() => {
    touchSelectionRef.current = null
    pausedRef.current = false
    setPaused(false)
    setActiveSkill(null)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotionRef.current = media.matches
      if (media.matches) {
        motionRef.current.yawVelocity = 0
        motionRef.current.pitchVelocity = 0
      }
      setReducedMotion(media.matches)
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const size = { centerX: 400, centerY: 250, radius: 180 }
    let frame = 0
    let frameCount = 0
    let lastSample = performance.now()
    let lastFrame = lastSample
    let disposed = false

    const renderProjection = () => {
      const state = motionRef.current
      for (let index = 0; index < wireframe.nodes.length; index += 1) {
        projectSpherePointInto(
          wireframe.nodes[index],
          state.yaw,
          state.pitch,
          size.radius,
          size.centerX,
          size.centerY,
          nodeProjections[index],
        )
      }
      for (let index = 0; index < positionedLogos.length; index += 1) {
        const item = itemRefs.current[index]
        if (!item) continue
        const projection = nodeProjections[index]
        item.style.setProperty('--sphere-opacity', String(projection.opacity))
        item.style.setProperty(
          '--sphere-transform',
          `translate3d(${projection.x - size.centerX}px, ${projection.y - size.centerY}px, 0) scale(${projection.scale})`,
        )
        item.style.setProperty('--sphere-z', String(projection.z))
      }
      for (let index = 0; index < wireframe.edges.length; index += 1) {
        const path = edgeRefs.current[index]
        if (!path) continue
        const edge = wireframe.edges[index]
        const control = projectSpherePointInto(
          edge.control,
          state.yaw,
          state.pitch,
          size.radius,
          size.centerX,
          size.centerY,
          controlProjections[index],
        )
        const from = nodeProjections[edge.from]
        const to = nodeProjections[edge.to]
        path.setAttribute('d', edgePath(edge, nodeProjections, control))
        path.style.setProperty(
          '--sphere-line-opacity',
          cssNumber(lineOpacity(from, control, to)),
        )
      }
    }
    renderProjectionRef.current = renderProjection

    const measure = () => {
      const bounds = scene.getBoundingClientRect()
      const width = bounds.width || 800
      const height = bounds.height || 500
      size.centerX = width / 2
      size.centerY = height / 2
      size.radius = Math.min(width, height) * (window.innerWidth <= 720 ? 0.36 : 0.31)
      meshRef.current?.setAttribute('viewBox', `0 0 ${width} ${height}`)
      itemRefs.current.forEach((item) => {
        if (!item) return
        item.style.setProperty('--sphere-left', '50%')
        item.style.setProperty('--sphere-top', '50%')
      })
      renderProjection()
    }

    const idleSpeed = isCoarsePointer() ? MOBILE_IDLE_SPEED : DESKTOP_IDLE_SPEED
    const animate = (time: number) => {
      frame = 0
      if (disposed || !visibleRef.current || reducedMotion) return

      const state = motionRef.current
      const frameScale = Math.min(2, Math.max(0.25, (time - lastFrame) / (1000 / 60)))
      lastFrame = time

      if (!state.dragging && !pausedRef.current) {
        const decay = 0.95 ** frameScale
        state.yawVelocity = decayVelocity(state.yawVelocity, idleSpeed, decay)
        state.pitchVelocity = decayVelocity(state.pitchVelocity, 0, decay)
        state.yaw += state.yawVelocity * frameScale
        state.pitch = clampPitch(state.pitch + state.pitchVelocity * frameScale)
        renderProjection()
      }

      frameCount += 1
      if (time - lastSample >= 1000) {
        rootRef.current?.setAttribute(
          'data-skill-sphere-fps',
          String(Math.round((frameCount * 1000) / (time - lastSample))),
        )
        frameCount = 0
        lastSample = time
      }
      frame = requestAnimationFrame(animate)
    }
    const stopAnimation = () => {
      if (!frame) return
      cancelAnimationFrame(frame)
      frame = 0
    }
    const startAnimation = () => {
      if (reducedMotion || disposed || frame || !visibleRef.current) return
      lastFrame = performance.now()
      lastSample = lastFrame
      frameCount = 0
      frame = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(scene)
    const visibilityObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          const visible = entry?.isIntersecting ?? true
          if (visible === visibleRef.current) return
          visibleRef.current = visible
          if (visible) {
            renderProjection()
            startAnimation()
          } else {
            stopAnimation()
          }
        }, { rootMargin: '10% 0px' })
    visibleRef.current = visibilityObserver === null
    visibilityObserver?.observe(scene)
    measure()
    startAnimation()

    return () => {
      disposed = true
      renderProjectionRef.current = null
      observer.disconnect()
      visibilityObserver?.disconnect()
      stopAnimation()
    }
  }, [controlProjections, nodeProjections, positionedLogos.length, reducedMotion, wireframe])

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = motionRef.current
    if (!state.dragging || state.pointerId !== event.pointerId) return
    state.dragging = false
    state.pointerId = null
    if (reducedMotionRef.current) {
      state.yawVelocity = 0
      state.pitchVelocity = 0
    }
    setDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // The pointer may already be released after a native cancellation.
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const target = event.target
    if (target instanceof Element && !target.closest('[data-skill-sphere-chip]')) {
      clearSelection()
    }
    const state = motionRef.current
    state.dragging = true
    state.lastX = event.clientX
    state.lastY = event.clientY
    state.pointerId = event.pointerId
    didDragRef.current = false
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = motionRef.current
    if (!state.dragging || state.pointerId !== event.pointerId) return
    const deltaX = event.clientX - state.lastX
    const deltaY = event.clientY - state.lastY
    state.lastX = event.clientX
    state.lastY = event.clientY
    state.yawVelocity = deltaX * POINTER_SENSITIVITY
    state.pitchVelocity = deltaY * POINTER_SENSITIVITY
    state.yaw += state.yawVelocity
    state.pitch = clampPitch(state.pitch + state.pitchVelocity)
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) didDragRef.current = true
    renderProjectionRef.current?.()
  }

  const handleChipClick = (label: string) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    if (!isCoarsePointer()) {
      setSelection(label)
      return
    }
    if (touchSelectionRef.current === label) {
      clearSelection()
      return
    }
    setSelection(label, true)
  }

  const activeIndex = activeSkill === null
    ? -1
    : positionedLogos.findIndex(({ label }) => label === activeSkill)
  const activeRow = activeIndex < 0 ? -1 : Math.floor(activeIndex / wireframe.columnCount)
  const activeColumn = activeIndex < 0 ? -1 : activeIndex % wireframe.columnCount

  return (
    <figure
      ref={rootRef}
      className="skill-sphere"
      role="region"
      aria-label="Interactive skill sphere"
      data-active-skill={activeSkill ?? undefined}
      data-auto-rotate={!reducedMotion && !paused && !dragging ? 'true' : 'false'}
      data-dragging={dragging ? 'true' : 'false'}
      data-motion={reducedMotion ? 'reduced' : 'full'}
      data-paused={paused ? 'true' : 'false'}
      data-skill-sphere
      data-testid="skill-sphere"
    >
      <p className="sr-only" id={summaryId}>
        Skills: {logos.map(({ label }) => label).join(', ')}.
      </p>
      <div
        ref={sceneRef}
        className="skill-sphere__scene"
        data-skill-sphere-scene
        data-testid="skill-sphere-scene"
        onLostPointerCapture={finishDrag}
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
      >
        <figcaption className="skill-sphere__caption" aria-hidden="true">
          Fig. 5 — The skill sphere
        </figcaption>
        <span className="skill-sphere__hint" aria-hidden="true">
          drag to navigate
        </span>
        <span className="skill-sphere__halo" aria-hidden="true" />
        <svg
          ref={meshRef}
          className="skill-sphere__mesh"
          aria-hidden="true"
          data-skill-sphere-mesh
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {wireframe.edges.map((edge, index) => {
            const active = edge.row === activeRow || edge.column === activeColumn
            const from = initialMeshProjection(wireframe.nodes[edge.from])
            const control = initialMeshProjection(edge.control)
            const to = initialMeshProjection(wireframe.nodes[edge.to])
            return (
              <path
                ref={(element) => { edgeRefs.current[index] = element }}
                className="skill-sphere__edge"
                d={initialEdgePath(edge, wireframe.nodes)}
                data-active={active ? 'true' : undefined}
                data-edge-kind={edge.kind}
                data-skill-sphere-edge
                key={`${edge.kind}-${edge.row ?? edge.column}-${edge.from}-${edge.to}`}
                style={{
                  '--sphere-line-opacity': cssNumber(lineOpacity(from, control, to)),
                } as SphereItemStyle}
              />
            )
          })}
        </svg>
        <ul
          className="skill-sphere__list"
          aria-describedby={summaryId}
          aria-label="Skills on the sphere"
        >
          {positionedLogos.map((logo, index) => {
            const active = activeSkill === logo.label
            return (
              <li
                ref={(element) => { itemRefs.current[index] = element }}
                className="skill-sphere__item"
                key={logo.label}
                style={initialItemStyle(points[index], logo)}
                data-sphere-meridian={index % wireframe.columnCount}
                data-sphere-row={Math.floor(index / wireframe.columnCount)}
              >
                <button
                  className="skill-sphere__chip"
                  type="button"
                  aria-label={logo.label}
                  aria-pressed={active}
                  data-active={active ? 'true' : undefined}
                  data-skill-sphere-chip={logo.label}
                  onBlur={() => {
                    if (touchSelectionRef.current === logo.label) return
                    clearSelection()
                  }}
                  onClick={() => handleChipClick(logo.label)}
                  onFocus={() => setSelection(logo.label)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Escape') return
                    event.preventDefault()
                    clearSelection()
                    event.currentTarget.blur()
                  }}
                  onPointerEnter={() => {
                    if (!isCoarsePointer()) setSelection(logo.label)
                  }}
                  onPointerLeave={(event) => {
                    if (
                      isCoarsePointer()
                      || document.activeElement === event.currentTarget
                    ) return
                    clearSelection()
                  }}
                >
                  <span className="skill-sphere__chip-face" aria-hidden="true">
                    <svg
                      className="skill-sphere__glyph"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d={logo.path} />
                    </svg>
                  </span>
                  <span className="skill-sphere__label" aria-hidden="true">
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
