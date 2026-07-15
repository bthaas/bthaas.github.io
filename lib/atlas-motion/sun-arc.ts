import { clampProgress } from './curves'

export const SUN_ARC_END_X = 224
export const SUN_ARC_HEIGHT = 14
export const SUN_ARC_LANDING_PROGRESS = 0.98

export interface SectionApexMetrics {
  readonly scrollHeight: number
  readonly sectionHeight: number
  readonly sectionTop: number
  readonly viewportHeight: number
}

export interface SunArcPosition {
  readonly landed: boolean
  readonly progress: number
  readonly x: number
  readonly y: number
}

const roundPosition = (value: number): number => {
  const rounded = Number(value.toFixed(3))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function getSectionApexProgress({
  scrollHeight,
  sectionHeight,
  sectionTop,
  viewportHeight,
}: SectionApexMetrics): number {
  const scrollableDistance = scrollHeight - viewportHeight
  if (scrollableDistance <= 0) return 0
  const centeredSectionScroll = sectionTop + sectionHeight / 2 - viewportHeight / 2
  return roundPosition(clampProgress(centeredSectionScroll / scrollableDistance))
}

export function getSunArcPosition(
  documentProgress: number,
  trajectoryApexProgress: number,
): SunArcPosition {
  const progress = clampProgress(documentProgress)
  const apex = Math.min(
    SUN_ARC_LANDING_PROGRESS - 0.01,
    Math.max(0.01, trajectoryApexProgress),
  )
  const landed = progress >= SUN_ARC_LANDING_PROGRESS

  let x = SUN_ARC_END_X
  let y = 0
  if (!landed && progress <= apex) {
    x = (SUN_ARC_END_X / 2) * (progress / apex)
    y = -SUN_ARC_HEIGHT * Math.sin((progress / apex) * Math.PI / 2)
  } else if (!landed) {
    const descent = (progress - apex) / (SUN_ARC_LANDING_PROGRESS - apex)
    x = SUN_ARC_END_X / 2 + (SUN_ARC_END_X / 2) * descent
    y = -SUN_ARC_HEIGHT * Math.cos(descent * Math.PI / 2)
  }

  return {
    landed,
    progress,
    x: roundPosition(x),
    y: roundPosition(y),
  }
}
