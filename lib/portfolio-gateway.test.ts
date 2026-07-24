import { describe, expect, it } from 'vitest'

import {
  GATEWAY_CATEGORIES,
  getGatewayDragRotation,
  getGatewayRotation,
  getGatewayStepDeltaFromDrag,
  getWrappedGatewayIndex,
} from './portfolio-gateway'

describe('portfolio gateway choreography', () => {
  it('defines the requested categories in page order', () => {
    expect(GATEWAY_CATEGORIES.map(({ label, href }) => [label, href])).toEqual([
      ['Experience', '#experience'],
      ['Projects', '#projects'],
      ['Skills', '#craft'],
    ])
  })

  it('wraps previous and next category indexes', () => {
    expect(getWrappedGatewayIndex(-1)).toBe(2)
    expect(getWrappedGatewayIndex(0)).toBe(0)
    expect(getWrappedGatewayIndex(3)).toBe(0)
    expect(getWrappedGatewayIndex(7)).toBe(1)
  })

  it('maps every category to one exact 120 degree carousel step', () => {
    expect(getGatewayRotation(-1)).toBe(120)
    expect(getGatewayRotation(0)).toBe(0)
    expect(getGatewayRotation(1)).toBe(-120)
    expect(getGatewayRotation(2)).toBe(-240)
    expect(getGatewayRotation(3)).toBe(-360)
  })

  it('maps horizontal dragging to a continuous turn and nearest category step', () => {
    expect(getGatewayDragRotation(-320, 800)).toBe(-72)
    expect(getGatewayDragRotation(320, 800)).toBe(72)
    expect(getGatewayDragRotation(120, 0)).toBe(0)

    expect(getGatewayStepDeltaFromDrag(-200, 800)).toBe(1)
    expect(getGatewayStepDeltaFromDrag(200, 800)).toBe(-1)
    expect(getGatewayStepDeltaFromDrag(60, 800)).toBe(0)
    expect(getGatewayStepDeltaFromDrag(-700, 800)).toBe(2)
  })
})
