export interface AxisScale {
  x: number
  y: number
}

export interface HeroLiquidFrame {
  bulge: number
  uvShift: number
}

export interface MastheadScatter {
  x: number
  y: number
  rotation: number
}

export interface KineticBandFrame {
  direction: 1 | -1
  skew: number
  timeScale: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum)

const round = (value: number) => Math.round(value * 1000) / 1000

export function getTextureCoverScale(
  sourceAspect: number,
  viewportAspect: number,
  target: AxisScale = { x: 1, y: 1 },
): AxisScale {
  if (viewportAspect > sourceAspect) {
    target.x = 1
    target.y = round(sourceAspect / viewportAspect)
    return target
  }

  target.x = round(viewportAspect / sourceAspect)
  target.y = 1
  return target
}

export function getHeroLiquidFrame(
  velocity: number,
  target: HeroLiquidFrame = { bulge: 0, uvShift: 0 },
): HeroLiquidFrame {
  const displacement = round(clamp(velocity / 120, -1, 1) * 0.006)

  target.bulge = displacement
  target.uvShift = displacement
  return target
}

function seededOffset(index: number) {
  return Math.sin((index + 1) * 12.9898) * 43758.5453 % 1
}

export function getMastheadScatter(index: number, total: number): MastheadScatter {
  const normalized = total <= 1 ? 0 : (index / (total - 1)) * 2 - 1
  const offset = seededOffset(index)
  const side = index % 2 === 0 ? -1 : 1

  return {
    x: round(normalized * 140 + offset * 18),
    y: round(side * (48 + Math.abs(normalized) * 54 + Math.abs(offset) * 10)),
    rotation: round(clamp(normalized * 14 + offset * 5, -18, 18)),
  }
}

export function getKineticBandFrame(
  velocity: number,
  baseDirection: 1 | -1,
): KineticBandFrame {
  const velocityDirection = velocity === 0 ? 1 : velocity > 0 ? 1 : -1
  const strength = clamp(Math.abs(velocity) / 120, 0, 1)

  return {
    direction: (baseDirection * velocityDirection) as 1 | -1,
    skew: round(clamp(velocity / 15, -8, 8)),
    timeScale: round(1 + strength * 2.4),
  }
}
