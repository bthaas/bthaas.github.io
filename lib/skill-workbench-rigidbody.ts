import Matter from 'matter-js'

const {
  Bodies,
  Body,
  Composite,
  Engine,
  Query,
  Sleeping,
} = Matter

const LAYOUT_EDGE_GAP = 8
const LAYOUT_TOKEN_GAP = 9
const LAYOUT_HEIGHT_RATIO = 0.72
const MAX_LAYOUT_ATTEMPTS = 4_000
const MAX_DRAG_SWEEP_STEP_PX = 32
const MIN_DRAG_SWEEP_STEP_PX = 16
const MAX_PHYSICS_STEP_MS = 1000 / 60
const WALL_THICKNESS = 120

export interface SkillTokenSize {
  readonly height: number
  readonly width: number
}

export interface SkillTokenPlacement {
  readonly angle: number
  readonly x: number
  readonly y: number
}

export interface SkillRigidBodySnapshot extends SkillTokenPlacement {
  readonly isSleeping: boolean
  readonly isStatic: boolean
}

interface SkillRigidBodyWorldOptions {
  readonly arenaHeight: number
  readonly arenaWidth: number
  readonly seed: number
  readonly tokenSizes: readonly SkillTokenSize[]
}

interface SolverBody extends Matter.Body {
  readonly positionImpulse: Matter.Vector
}

export interface SkillRigidBodyWorld {
  beginDrag(index: number): void
  destroy(): void
  dragBody(index: number, x: number, y: number, angle: number): void
  drop(): void
  endDrag(
    index: number,
    velocityX: number,
    velocityY: number,
    angularVelocity: number,
  ): void
  getHomes(): readonly SkillTokenPlacement[]
  getSnapshots(): readonly SkillRigidBodySnapshot[]
  isMoving(): boolean
  nudge(index: number, deltaX: number, deltaY: number): void
  resetBody(index: number): void
  step(deltaMs: number): void
  stick(): void
}

export function createDragSweep(
  from: SkillTokenPlacement,
  to: SkillTokenPlacement,
  maxStep = MAX_DRAG_SWEEP_STEP_PX,
): readonly SkillTokenPlacement[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  const stepCount = Math.max(1, Math.ceil(distance / Math.max(1, maxStep)))

  return Array.from({ length: stepCount }, (_, index) => {
    if (index === stepCount - 1) return { ...to }

    const progress = (index + 1) / stepCount

    return {
      angle: from.angle + (to.angle - from.angle) * progress,
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
    }
  })
}

function createRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function rangesOverlap(
  firstCenter: number,
  firstSize: number,
  secondCenter: number,
  secondSize: number,
  gap: number,
) {
  return Math.abs(firstCenter - secondCenter) < (
    (firstSize + secondSize) / 2 + gap
  )
}

function placementOverlaps(
  placement: SkillTokenPlacement,
  size: SkillTokenSize,
  placements: readonly (SkillTokenPlacement | undefined)[],
  tokenSizes: readonly SkillTokenSize[],
) {
  return placements.some((candidate, candidateIndex) => (
    candidate
    && rangesOverlap(
      placement.x,
      size.width,
      candidate.x,
      tokenSizes[candidateIndex].width,
      LAYOUT_TOKEN_GAP,
    )
    && rangesOverlap(
      placement.y,
      size.height,
      candidate.y,
      tokenSizes[candidateIndex].height,
      LAYOUT_TOKEN_GAP,
    )
  ))
}

function createJitteredGridLayout(
  arenaWidth: number,
  arenaHeight: number,
  seed: number,
  tokenSizes: readonly SkillTokenSize[],
) {
  const random = createRandom(seed ^ 0xc12f8a3d)
  const columns = Math.min(7, tokenSizes.length)
  const rows = Math.ceil(tokenSizes.length / columns)
  const usableHeight = arenaHeight * LAYOUT_HEIGHT_RATIO
  const cellWidth = arenaWidth / columns
  const cellHeight = usableHeight / rows
  const cells = Array.from({ length: rows * columns }, (_, index) => index)

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const cell = cells[index]
    cells[index] = cells[swapIndex]
    cells[swapIndex] = cell
  }

  return tokenSizes.map((size, index) => {
    const cell = cells[index]
    const column = cell % columns
    const row = Math.floor(cell / columns)
    const jitterX = Math.max(
      0,
      (cellWidth - size.width - LAYOUT_TOKEN_GAP * 2) / 2,
    )
    const jitterY = Math.max(
      0,
      (cellHeight - size.height - LAYOUT_TOKEN_GAP * 2) / 2,
    )

    return {
      angle: (random() - 0.5) * 0.18,
      x: (column + 0.5) * cellWidth + (random() - 0.5) * jitterX * 2,
      y: (row + 0.5) * cellHeight + (random() - 0.5) * jitterY * 2,
    }
  })
}

export function createScatteredLayout({
  arenaHeight,
  arenaWidth,
  seed,
  tokenSizes,
}: SkillRigidBodyWorldOptions): readonly SkillTokenPlacement[] {
  const random = createRandom(seed)
  const placements: Array<SkillTokenPlacement | undefined> = Array.from({
    length: tokenSizes.length,
  })
  const placementOrder = tokenSizes
    .map((size, index) => ({ index, area: size.width * size.height }))
    .sort((first, second) => second.area - first.area)
  let didExhaustAttempts = false

  placementOrder.forEach(({ index }) => {
    if (didExhaustAttempts) return
    const size = tokenSizes[index]
    const minX = size.width / 2 + LAYOUT_EDGE_GAP
    const maxX = arenaWidth - size.width / 2 - LAYOUT_EDGE_GAP
    const minY = size.height / 2 + LAYOUT_EDGE_GAP
    const maxY = Math.max(minY, arenaHeight * LAYOUT_HEIGHT_RATIO)
    let placement: SkillTokenPlacement | undefined

    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      const candidate = {
        angle: (random() - 0.5) * 0.18,
        x: minX + random() * Math.max(0, maxX - minX),
        y: minY + random() * Math.max(0, maxY - minY),
      }

      if (!placementOverlaps(candidate, size, placements, tokenSizes)) {
        placement = candidate
        break
      }
    }

    if (!placement) {
      didExhaustAttempts = true
      return
    }
    placements[index] = placement
  })

  if (didExhaustAttempts) {
    return createJitteredGridLayout(
      arenaWidth,
      arenaHeight,
      seed,
      tokenSizes,
    )
  }

  return placements as readonly SkillTokenPlacement[]
}

export function createSkillRigidBodyWorld({
  arenaHeight,
  arenaWidth,
  seed,
  tokenSizes,
}: SkillRigidBodyWorldOptions): SkillRigidBodyWorld {
  const engine = Engine.create({ enableSleeping: true })
  engine.gravity.y = 1.08
  engine.gravity.scale = 0.001

  const homes = createScatteredLayout({
    arenaHeight,
    arenaWidth,
    seed,
    tokenSizes,
  })
  const random = createRandom(seed ^ 0xa53c9e17)
  const shortestTokenSide = Math.min(
    ...tokenSizes.map(({ height, width }) => Math.min(height, width)),
  )
  const dragSweepStep = Math.max(
    MIN_DRAG_SWEEP_STEP_PX,
    Math.min(MAX_DRAG_SWEEP_STEP_PX, shortestTokenSide * 0.75),
  )
  const bodies = homes.map((home, index) => {
    const size = tokenSizes[index]
    const body = Bodies.rectangle(home.x, home.y, size.width, size.height, {
      angle: home.angle,
      chamfer: { radius: Math.min(16, size.height * 0.28) },
      friction: 0.62,
      frictionAir: 0.014,
      frictionStatic: 0.82,
      restitution: 0.22,
      sleepThreshold: 48,
    })
    body.label = `skill-token-${index}`
    Body.setStatic(body, true)

    return body
  })
  const walls = [
    Bodies.rectangle(
      arenaWidth / 2,
      arenaHeight + WALL_THICKNESS / 2,
      arenaWidth + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true },
    ),
    Bodies.rectangle(
      arenaWidth / 2,
      -WALL_THICKNESS / 2,
      arenaWidth + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true },
    ),
    Bodies.rectangle(
      -WALL_THICKNESS / 2,
      arenaHeight / 2,
      WALL_THICKNESS,
      arenaHeight + WALL_THICKNESS * 2,
      { isStatic: true },
    ),
    Bodies.rectangle(
      arenaWidth + WALL_THICKNESS / 2,
      arenaHeight / 2,
      WALL_THICKNESS,
      arenaHeight + WALL_THICKNESS * 2,
      { isStatic: true },
    ),
  ]
  let isStuck = true

  Composite.add(engine.world, [...walls, ...bodies])

  function wake(body: Matter.Body) {
    Sleeping.set(body, false)
  }

  function clearPositionImpulse(body: Matter.Body) {
    const positionImpulse = (body as SolverBody).positionImpulse
    positionImpulse.x = 0
    positionImpulse.y = 0
  }

  function resetBody(index: number) {
    const body = bodies[index]
    const home = homes[index]
    if (!body || !home) return

    Body.setPosition(body, { x: home.x, y: home.y })
    Body.setAngle(body, home.angle)
    Body.setVelocity(body, { x: 0, y: 0 })
    Body.setAngularVelocity(body, 0)
    Body.setSpeed(body, 0)
    Body.setAngularSpeed(body, 0)
    body.force.x = 0
    body.force.y = 0
    body.torque = 0
    wake(body)
  }

  return {
    beginDrag(index) {
      const body = bodies[index]
      if (!body) return
      wake(body)
      clearPositionImpulse(body)
      Body.setStatic(body, true)
    },

    destroy() {
      Composite.clear(engine.world, false, true)
      Engine.clear(engine)
    },

    dragBody(index, x, y, angle) {
      const body = bodies[index]
      const size = tokenSizes[index]
      if (!body || !size) return

      const halfWidth = size.width / 2
      const halfHeight = size.height / 2
      const target = {
        angle,
        x: Math.max(halfWidth, Math.min(arenaWidth - halfWidth, x)),
        y: Math.max(halfHeight, Math.min(arenaHeight - halfHeight, y)),
      }
      const sweep = createDragSweep({
        angle: body.angle,
        x: body.position.x,
        y: body.position.y,
      }, target, dragSweepStep)
      const otherBodies = bodies.filter((_, bodyIndex) => bodyIndex !== index)

      sweep.forEach((waypoint) => {
        Body.setPosition(body, waypoint)
        Body.setAngle(body, waypoint.angle)
        wake(body)

        const collisions = Query.collides(body, otherBodies)
        if (collisions.length === 0) return

        collisions.forEach(({ parentA, parentB }) => {
          if (parentA !== body) wake(parentA)
          if (parentB !== body) wake(parentB)
        })

        // Resolve only occupied waypoints without advancing gravity. This wakes
        // settled obstacles while keeping a long pointer jump off the hot path
        // when it crosses empty space.
        Engine.update(engine, 0)
      })
    },

    drop() {
      isStuck = false
      bodies.forEach((body) => {
        Body.setStatic(body, false)
        wake(body)
        Body.setVelocity(body, {
          x: (random() - 0.5) * 1.65,
          y: -random() * 0.32,
        })
        Body.setAngularVelocity(body, (random() - 0.5) * 0.085)
      })
    },

    endDrag(index, velocityX, velocityY, angularVelocity) {
      const body = bodies[index]
      if (!body) return

      Body.setStatic(body, false)
      wake(body)
      Body.setVelocity(body, {
        x: Math.max(-18, Math.min(18, velocityX)),
        y: Math.max(-18, Math.min(18, velocityY)),
      })
      Body.setAngularVelocity(
        body,
        Math.max(-0.22, Math.min(0.22, angularVelocity)),
      )
    },

    getHomes() {
      return homes.map((home) => ({ ...home }))
    },

    getSnapshots() {
      if (isStuck) {
        return homes.map((home) => ({
          ...home,
          isSleeping: false,
          isStatic: true,
        }))
      }

      return bodies.map((body) => ({
        angle: body.angle,
        isSleeping: body.isSleeping,
        isStatic: body.isStatic,
        x: body.position.x,
        y: body.position.y,
      }))
    },

    isMoving() {
      if (isStuck) return false
      return bodies.some((body) => (
        !body.isStatic
        && (!body.isSleeping || body.speed > 0.04 || body.angularSpeed > 0.002)
      ))
    },

    nudge(index, deltaX, deltaY) {
      const body = bodies[index]
      if (!body || body.isStatic) return

      wake(body)
      Body.setPosition(body, {
        x: body.position.x + deltaX,
        y: body.position.y + deltaY,
      })
      Body.setVelocity(body, {
        x: deltaX * 0.08,
        y: deltaY * 0.08,
      })
      Body.setAngularVelocity(body, deltaX * 0.002)
    },

    resetBody(index) {
      const body = bodies[index]
      if (!body) return
      const wasStatic = body.isStatic
      resetBody(index)
      Body.setStatic(body, wasStatic)
      wake(body)
    },

    step(deltaMs) {
      let remainingMs = Math.max(0, Math.min(50, deltaMs))

      while (remainingMs > 0) {
        const stepMs = Math.min(MAX_PHYSICS_STEP_MS, remainingMs)
        Engine.update(engine, stepMs)
        remainingMs -= stepMs
      }
    },

    stick() {
      isStuck = true
      bodies.forEach((body, index) => {
        Body.setStatic(body, true)
        resetBody(index)
        Body.setStatic(body, true)
        wake(body)
      })
    },
  }
}
