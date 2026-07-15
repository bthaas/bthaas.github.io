import { clampProgress } from './curves'
import { mapProgress } from './progress'

export interface CraftViewMetrics {
  readonly elementHeight: number
  readonly elementTop: number
  readonly scrollY: number
  readonly viewportHeight: number
}

export interface CraftMotion {
  readonly clipBottomPercent: number
  readonly ghostTranslatePixels: number
  readonly imageTranslatePercent: number
}

const roundMotion = (value: number): number => Number(value.toFixed(3))

export function getCraftViewProgress({
  elementHeight,
  elementTop,
  scrollY,
  viewportHeight,
}: CraftViewMetrics): number {
  const entryScroll = elementTop - viewportHeight
  const coverScroll = elementTop + elementHeight * 0.45
  if (coverScroll <= entryScroll) return scrollY >= coverScroll ? 1 : 0
  return mapProgress(scrollY, entryScroll, coverScroll)
}

export function getCraftMotion(progress: number): CraftMotion {
  const bounded = clampProgress(progress)
  return {
    clipBottomPercent: roundMotion(100 * (1 - bounded)),
    ghostTranslatePixels: roundMotion(28 - 56 * bounded),
    imageTranslatePercent: roundMotion(-4 + 8 * bounded),
  }
}
