export interface FeatherFrame {
  density: number
  fallSpeed: number
  opacity: number
  scatter: number
  settle: number
  streak: number
  tumble: number
  wind: number
}

export interface FeatherSeed {
  readonly activation: number
  readonly drift: number
  readonly index: number
  readonly layer: 0 | 1
  readonly phase: number
  readonly readability: number
  readonly size: number
  readonly tumbleDirection: -1 | 1
  readonly variant: 0 | 1 | 2
  readonly x: number
  readonly y: number
  readonly z: number
}

interface FeatherKeyframe {
  readonly density: number
  readonly fallSpeed: number
  readonly opacity: number
  readonly progress: number
  readonly scatter: number
  readonly settle: number
  readonly tumble: number
}

const keyframes: readonly FeatherKeyframe[] = [
  { progress: 0, density: 0.14, fallSpeed: 0.18, tumble: 0.2, scatter: 0.08, settle: 0, opacity: 0.72 },
  { progress: 0.12, density: 0.2, fallSpeed: 0.25, tumble: 0.28, scatter: 0.14, settle: 0, opacity: 0.76 },
  { progress: 0.2, density: 0.4, fallSpeed: 0.52, tumble: 0.58, scatter: 0.32, settle: 0, opacity: 0.82 },
  { progress: 0.36, density: 1, fallSpeed: 1, tumble: 1, scatter: 0.76, settle: 0, opacity: 1 },
  { progress: 0.48, density: 0.72, fallSpeed: 0.72, tumble: 0.78, scatter: 0.54, settle: 0, opacity: 0.88 },
  { progress: 0.72, density: 0.4, fallSpeed: 0.4, tumble: 0.48, scatter: 0.3, settle: 0, opacity: 0.7 },
  { progress: 0.82, density: 0.26, fallSpeed: 0.28, tumble: 0.32, scatter: 0.2, settle: 0.15, opacity: 0.58 },
  { progress: 0.94, density: 0.1, fallSpeed: 0.12, tumble: 0.14, scatter: 0.08, settle: 0.92, opacity: 0.3 },
  { progress: 1, density: 0, fallSpeed: 0, tumble: 0, scatter: 0, settle: 1, opacity: 0 },
]

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value))

const mix = (from: number, to: number, progress: number) => from + (to - from) * progress

const smoothstep = (progress: number) => {
  const bounded = clamp(progress)
  return bounded * bounded * (3 - 2 * bounded)
}

export function shouldUseConstrainedFeatherTier(
  rendererConstrained: boolean,
  userAgent: string,
) {
  return rendererConstrained || /firefox\//i.test(userAgent)
}

export function createFeatherFrame(): FeatherFrame {
  return {
    density: 0,
    fallSpeed: 0,
    opacity: 0,
    scatter: 0,
    settle: 0,
    streak: 0,
    tumble: 0,
    wind: 0,
  }
}

export function writeFeatherFrame(
  documentProgress: number,
  scrollVelocity: number,
  target: FeatherFrame,
): FeatherFrame {
  const progress = clamp(documentProgress)
  let from = keyframes[0]
  let to = keyframes[keyframes.length - 1]
  for (let index = 1; index < keyframes.length; index += 1) {
    to = keyframes[index]
    if (progress <= to.progress) break
    from = to
  }
  const span = Math.max(0.0001, to.progress - from.progress)
  const localProgress = smoothstep((progress - from.progress) / span)
  const velocityStrength = clamp(Math.abs(scrollVelocity) / 120)
  target.density = mix(from.density, to.density, localProgress)
  target.fallSpeed = mix(from.fallSpeed, to.fallSpeed, localProgress)
  target.opacity = mix(from.opacity, to.opacity, localProgress)
  target.scatter = clamp(
    mix(from.scatter, to.scatter, localProgress) + velocityStrength * 0.28,
  )
  target.settle = mix(from.settle, to.settle, localProgress)
  target.streak = velocityStrength
  target.tumble = mix(from.tumble, to.tumble, localProgress)
  target.wind = clamp(scrollVelocity / 120, -1, 1)
  return target
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4_294_967_296
  }
}

export function createFeatherSeeds(count: number, seed: number): readonly FeatherSeed[] {
  const random = createRandom(seed)
  const nearCount = Math.round(count * 0.42)
  return Array.from({ length: count }, (_, index) => {
    const layer: 0 | 1 = index < nearCount ? 0 : 1
    const x = random() * 2.3 - 1.15
    const centrality = 1 - clamp(Math.abs(x) / 0.58)
    return {
      activation: random(),
      drift: 0.55 + random() * 0.9,
      index,
      layer,
      phase: random() * Math.PI * 2,
      readability: clamp(0.98 - centrality * 0.64, 0.34, 1),
      size: (layer === 0 ? 0.78 : 0.48) + random() * (layer === 0 ? 0.74 : 0.42),
      tumbleDirection: random() > 0.5 ? 1 : -1,
      variant: (index % 3) as 0 | 1 | 2,
      x,
      y: random() * 2.5 - 1.25,
      z: layer === 0 ? 0.15 + random() * 0.3 : -0.9 - random() * 0.5,
    }
  })
}

export function getVisibleFeatherCount(total: number, density: number): number {
  return Math.round(Math.max(0, total) * clamp(density))
}

export function getPointerGustStrength(
  pointerVelocity: number,
  distance: number,
  radius: number,
): number {
  if (radius <= 0 || distance >= radius) return 0
  const velocity = clamp((pointerVelocity - 500) / 600)
  if (velocity === 0) return 0
  const proximity = 1 - clamp(distance / radius)
  return clamp(velocity * smoothstep(proximity))
}
