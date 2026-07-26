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
      ['Experience', '/experience'],
      ['Projects', '/projects'],
      ['Skills', '/skills'],
      ['Contact', '/contact'],
    ])
  })

  it('wraps previous and next category indexes', () => {
    expect(getWrappedGatewayIndex(-1)).toBe(3)
    expect(getWrappedGatewayIndex(0)).toBe(0)
    expect(getWrappedGatewayIndex(3)).toBe(3)
    expect(getWrappedGatewayIndex(4)).toBe(0)
    expect(getWrappedGatewayIndex(7)).toBe(3)
  })

  it('maps every category to one exact 90 degree carousel step', () => {
    expect(getGatewayRotation(-1)).toBe(90)
    expect(getGatewayRotation(0)).toBe(0)
    expect(getGatewayRotation(1)).toBe(-90)
    expect(getGatewayRotation(2)).toBe(-180)
    expect(getGatewayRotation(3)).toBe(-270)
    expect(getGatewayRotation(4)).toBe(-360)
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

  it('maps all four images onto 88 degree faces with two degree paper seams', () => {
    expect(GATEWAY_SEGMENTS_PER_CATEGORY).toBe(12)
    expect(GATEWAY_CYLINDER_SEGMENTS).toHaveLength(48)

    for (const [categoryIndex, category] of GATEWAY_CATEGORIES.entries()) {
      const categorySegments = GATEWAY_CYLINDER_SEGMENTS.filter(
        (segment) => segment.categoryId === category.id,
      )
      expect(categorySegments).toHaveLength(12)
      expect(categorySegments[0].angle).toBeCloseTo(categoryIndex * 90 - 40.333, 3)
      expect(categorySegments.at(-1)?.angle).toBeCloseTo(categoryIndex * 90 + 40.333, 3)
      expect(categorySegments.map((segment) => segment.segmentIndex)).toEqual(
        Array.from({ length: GATEWAY_SEGMENTS_PER_CATEGORY }, (_, index) => index),
      )
      expect(categorySegments[0].imagePosition).toBe(0)
      expect(categorySegments.at(-1)?.imagePosition).toBe(100)
    }

    const experienceLast = GATEWAY_CYLINDER_SEGMENTS[11]
    const projectsFirst = GATEWAY_CYLINDER_SEGMENTS[12]
    const segmentWidth = GATEWAY_CYLINDER_SEGMENTS[1].angle
      - GATEWAY_CYLINDER_SEGMENTS[0].angle
    expect(projectsFirst.angle - experienceLast.angle - segmentWidth).toBeCloseTo(2, 5)
  })
})
