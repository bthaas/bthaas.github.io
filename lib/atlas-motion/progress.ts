import { clampProgress } from './curves'

export interface DocumentProgressMetrics {
  readonly scrollY: number
  readonly scrollHeight: number
  readonly viewportHeight: number
}

export function getDocumentProgress({
  scrollY,
  scrollHeight,
  viewportHeight,
}: DocumentProgressMetrics): number {
  const scrollableDistance = scrollHeight - viewportHeight
  if (scrollableDistance <= 0) return 0
  return clampProgress(scrollY / scrollableDistance)
}

export function mapProgress(value: number, start: number, end: number): number {
  if (end <= start) throw new RangeError('end must be greater than start')
  return Number(clampProgress((value - start) / (end - start)).toFixed(6))
}
