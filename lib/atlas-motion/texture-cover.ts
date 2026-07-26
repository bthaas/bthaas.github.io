export interface AxisScale {
  x: number
  y: number
}

const round = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? 0 : rounded
}

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
