import { clampProgress } from './curves'
import { mapProgress } from './progress'

export type ProjectDirection = 'ltr' | 'rtl'

export interface ProjectViewMetrics {
  readonly elementHeight: number
  readonly elementTop: number
  readonly scrollY: number
  readonly viewportHeight: number
}

const DIRECTIONS: readonly ProjectDirection[] = ['ltr', 'rtl', 'ltr']
const PAN_LIMIT_PERCENT = 6.522

export function getProjectDirection(index: number): ProjectDirection {
  return DIRECTIONS[index] ?? (index % 2 === 0 ? 'ltr' : 'rtl')
}

export function getProjectPan(progress: number, index: number): number {
  const bounded = clampProgress(progress)
  const direction = getProjectDirection(index) === 'ltr' ? 1 : -1
  return Number((direction * (-PAN_LIMIT_PERCENT + PAN_LIMIT_PERCENT * 2 * bounded)).toFixed(3))
}

export function getProjectViewProgress({
  elementHeight,
  elementTop,
  scrollY,
  viewportHeight,
}: ProjectViewMetrics): number {
  const entryScroll = elementTop - viewportHeight
  const exitScroll = elementTop + elementHeight
  if (exitScroll <= entryScroll) return scrollY >= exitScroll ? 1 : 0
  return mapProgress(scrollY, entryScroll, exitScroll)
}
