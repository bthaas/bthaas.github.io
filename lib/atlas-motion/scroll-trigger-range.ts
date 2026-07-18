export interface ViewportEntryRangeInput {
  readonly elementTop: number
  readonly endViewportRatio: number
  readonly startViewportRatio: number
  readonly viewportHeight: number
}

export interface ElementTraversalRangeInput {
  readonly elementHeight: number
  readonly elementTop: number
  readonly viewportHeight: number
}

export interface ScrollTriggerRange {
  readonly end: number
  readonly start: number
}

function orderedRange(start: number, end: number): ScrollTriggerRange {
  const normalizedStart = Math.max(0, start)
  return {
    end: Math.max(normalizedStart + 1, end),
    start: normalizedStart,
  }
}

export function getViewportEntryRange({
  elementTop,
  endViewportRatio,
  startViewportRatio,
  viewportHeight,
}: ViewportEntryRangeInput): ScrollTriggerRange {
  return orderedRange(
    elementTop - viewportHeight * startViewportRatio,
    elementTop - viewportHeight * endViewportRatio,
  )
}

export function getElementTraversalRange({
  elementHeight,
  elementTop,
  viewportHeight,
}: ElementTraversalRangeInput): ScrollTriggerRange {
  return orderedRange(elementTop - viewportHeight, elementTop + elementHeight)
}
