import { formatCountUpFrame } from '../../lib/atlas-motion/count-up'
import { getMetricCountProgress } from '../../lib/atlas-motion/hero-choreography'

export interface CountUpOptions {
  readonly durationMs?: number
  readonly steps?: number
}

export function countUp(
  element: HTMLElement,
  target: string,
  { durationMs = 900, steps = 30 }: CountUpOptions = {},
): () => void {
  if (durationMs <= 0) {
    element.textContent = target
    return () => undefined
  }

  let animationFrame = 0
  let startTime: number | undefined

  const render = (timestamp: number) => {
    startTime ??= timestamp
    const progress = Math.min(1, (timestamp - startTime) / durationMs)
    element.textContent = formatCountUpFrame(target, getMetricCountProgress(progress, steps), steps)
    if (progress < 1) animationFrame = requestAnimationFrame(render)
  }

  element.textContent = formatCountUpFrame(target, 0, steps)
  animationFrame = requestAnimationFrame(render)
  return () => cancelAnimationFrame(animationFrame)
}
