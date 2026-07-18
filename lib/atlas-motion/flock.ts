export interface FlockBird {
  readonly colorIndex: 0 | 1
  readonly phase: number
  readonly size: number
  readonly vx: number
  readonly vy: number
  readonly x: number
  readonly y: number
}

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(maximum, value))
)

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

export function getFlockFrameDelta(
  previousTime: number,
  currentTime: number,
  targetFps = 60,
): number | null {
  const elapsed = Math.max(0, currentTime - previousTime)
  if (elapsed < 1_000 / targetFps) return null
  return Math.min(elapsed / 1_000, 0.05)
}

export function createFlock(count: number, seed: number): FlockBird[] {
  const random = createRandom(seed)
  return Array.from({ length: count }, (_, index) => ({
    colorIndex: (index % 2) as 0 | 1,
    phase: random() * Math.PI * 2,
    size: 0.65 + random() * 0.7,
    vx: 0.028 + random() * 0.026,
    vy: (random() - 0.5) * 0.018,
    x: random(),
    y: 0.12 + random() * 0.56,
  }))
}

export function stepFlock(flock: readonly FlockBird[], deltaSeconds: number): FlockBird[] {
  const delta = clamp(deltaSeconds, 0, 0.05)

  return flock.map((bird, index) => {
    let neighbors = 0
    let alignmentX = 0
    let alignmentY = 0
    let centerX = 0
    let centerY = 0
    let separationX = 0
    let separationY = 0

    flock.forEach((other, otherIndex) => {
      if (index === otherIndex) return
      const dx = other.x - bird.x
      const dy = other.y - bird.y
      const distance = Math.hypot(dx, dy)
      if (distance > 0.18) return
      neighbors += 1
      alignmentX += other.vx
      alignmentY += other.vy
      centerX += other.x
      centerY += other.y
      if (distance > 0 && distance < 0.045) {
        separationX -= dx / distance
        separationY -= dy / distance
      }
    })

    let vx = bird.vx + 0.0015 * delta
    let vy = bird.vy + Math.sin(bird.phase) * 0.012 * delta
    if (neighbors > 0) {
      alignmentX /= neighbors
      alignmentY /= neighbors
      centerX /= neighbors
      centerY /= neighbors
      vx += ((alignmentX - bird.vx) * 0.42 + (centerX - bird.x) * 0.1) * delta
      vy += ((alignmentY - bird.vy) * 0.42 + (centerY - bird.y) * 0.1) * delta
      vx += separationX * 0.035 * delta
      vy += separationY * 0.035 * delta
    }

    const speed = Math.hypot(vx, vy)
    if (speed > 0.09) {
      vx = (vx / speed) * 0.09
      vy = (vy / speed) * 0.09
    }

    let x = bird.x + vx * delta
    let y = bird.y + vy * delta
    if (x > 1.05) x = -0.05
    if (x < -0.05) x = 1.05
    if (y < 0.08 || y > 0.72) {
      y = clamp(y, 0.08, 0.72)
      vy *= -0.75
    }

    return {
      ...bird,
      phase: bird.phase + delta * (1.2 + bird.size * 0.35),
      vx,
      vy,
      x,
      y,
    }
  })
}
