import { describe, expect, it } from 'vitest'

import {
  GATEWAY_CATEGORIES,
  GATEWAY_CYLINDER_SEGMENTS,
  GATEWAY_SEGMENTS_PER_CATEGORY,
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

  it('maps all three images onto one evenly faceted 360 degree cylinder', () => {
    expect(GATEWAY_SEGMENTS_PER_CATEGORY).toBe(12)
    expect(GATEWAY_CYLINDER_SEGMENTS).toHaveLength(36)
    expect(GATEWAY_CYLINDER_SEGMENTS.map(({ angle }) => angle)).toEqual(
      Array.from({ length: 36 }, (_, index) => -55 + index * 10),
    )

    for (const category of GATEWAY_CATEGORIES) {
      const categorySegments = GATEWAY_CYLINDER_SEGMENTS.filter(
        (segment) => segment.categoryId === category.id,
      )
      expect(categorySegments).toHaveLength(12)
      expect(categorySegments[0].imagePosition).toBe(0)
      expect(categorySegments.at(-1)?.imagePosition).toBe(100)
    }
  })
})
