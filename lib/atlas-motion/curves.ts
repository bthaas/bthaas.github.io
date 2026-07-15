export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function smoothstep(value: number): number {
  const bounded = clampProgress(value)
  return bounded * bounded * (3 - 2 * bounded)
}

export function steppedProgress(value: number, steps: number): number {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError('steps must be a positive integer')
  }

  const bounded = clampProgress(value)
  if (bounded === 1) return 1
  return Math.floor(bounded * steps) / steps
}
