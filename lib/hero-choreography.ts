export const wingClusterNames = [
  'wingL_root',
  'wingL_mid',
  'wingL_tip',
  'wingR_root',
  'wingR_mid',
  'wingR_tip',
] as const

export type WingClusterName = (typeof wingClusterNames)[number]

export interface HeroChoreography {
  readonly cameraZ: number
  readonly backgroundLift: number
  readonly clusterDetachments: Readonly<Record<WingClusterName, number>>
}

const clusterWindows: Readonly<Record<WingClusterName, readonly [number, number]>> = {
  wingR_tip: [0.04, 0.35],
  wingR_mid: [0.14, 0.52],
  wingL_tip: [0.28, 0.69],
  wingR_root: [0.42, 0.78],
  wingL_mid: [0.56, 0.9],
  wingL_root: [0.74, 1],
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smoothRange(progress: number, start: number, end: number): number {
  const normalized = clamp01((progress - start) / (end - start))
  return normalized * normalized * (3 - 2 * normalized)
}

export function getHeroChoreography(progress: number): HeroChoreography {
  const clampedProgress = clamp01(progress)
  const clusterDetachments = Object.fromEntries(
    wingClusterNames.map((name) => {
      const [start, end] = clusterWindows[name]
      return [name, smoothRange(clampedProgress, start, end)]
    }),
  ) as Record<WingClusterName, number>

  return {
    cameraZ: 12.2 - clampedProgress * 4.35,
    backgroundLift: clampedProgress * 0.08,
    clusterDetachments,
  }
}
