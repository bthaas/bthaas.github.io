import { clampProgress, smoothstep, steppedProgress } from './curves'

export interface CountUpTarget {
  readonly decimals: number
  readonly prefix: string
  readonly suffix: string
  readonly value: number
}

const TARGET_PATTERN = /^([^\d+-]*)([-+]?\d[\d,]*(?:\.\d+)?)(.*)$/

export function parseCountUpTarget(target: string): CountUpTarget {
  const match = target.trim().match(TARGET_PATTERN)
  if (!match) throw new TypeError(`Metric target has no numeric value: ${target}`)

  const [, prefix, numericText, suffix] = match
  const decimalText = numericText.split('.')[1]
  return {
    decimals: decimalText?.length ?? 0,
    prefix,
    suffix,
    value: Number(numericText.replaceAll(',', '')),
  }
}

export function formatCountUpFrame(target: string, progress: number, steps = 30): string {
  if (clampProgress(progress) === 1) return target

  const parsed = parseCountUpTarget(target)
  const frameProgress = steppedProgress(progress, steps)
  const precision = 10 ** parsed.decimals
  const frameValue = Math.round((parsed.value * frameProgress + Number.EPSILON) * precision) / precision
  return `${parsed.prefix}${frameValue.toFixed(parsed.decimals)}${parsed.suffix}`
}

export function getSequenceProgress(
  progress: number,
  index: number,
  total: number,
  spread = 0.45,
): number {
  if (total < 1 || index < 0 || index >= total) return 0
  const start = total === 1 ? 0 : (index / (total - 1)) * spread
  return smoothstep((clampProgress(progress) - start) / (1 - spread))
}
