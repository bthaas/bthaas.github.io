export interface CloudTransitionState {
  readonly whiteout: number
  readonly outgoing: number
  readonly incoming: number
}

export interface DescentLighting {
  readonly warmth: number
  readonly exposure: number
  readonly fogNear: number
}

export interface ExperienceLighting {
  readonly darknessOpacity: number
  readonly warmthOpacity: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (value: number) => {
  const bounded = clamp01(value)
  return bounded * bounded * (3 - 2 * bounded)
}

export function getCloudTransition(progress: number): CloudTransitionState {
  const bounded = clamp01(progress)
  const whiteout = 1 - Math.abs(bounded * 2 - 1)
  return {
    whiteout: Number(smoothstep(whiteout).toFixed(4)),
    outgoing: Number((1 - smoothstep(bounded * 2)).toFixed(4)),
    incoming: Number(smoothstep((bounded - 0.5) * 2).toFixed(4)),
  }
}

export function getLandingProgress(progress: number, index: number): number {
  const start = index * 0.235
  const duration = index === 3 ? 0.295 : 0.3
  return Number(smoothstep((clamp01(progress) - start) / duration).toFixed(4))
}

export function getDescentLighting(progress: number): DescentLighting {
  const bounded = smoothstep(progress)
  return {
    warmth: Number((1 - bounded * 0.82).toFixed(4)),
    exposure: Number((0.82 - bounded * 0.18).toFixed(4)),
    fogNear: Number((8 - bounded * 2.5).toFixed(4)),
  }
}

export function getExperienceLighting(progress: number): ExperienceLighting {
  const { warmth } = getDescentLighting(progress)
  const descentProgress = (1 - warmth) / 0.82

  return {
    darknessOpacity: Number((descentProgress * 0.35).toFixed(4)),
    warmthOpacity: Number((0.06 + descentProgress * 0.12).toFixed(4)),
  }
}
