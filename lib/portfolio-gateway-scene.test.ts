import { describe, expect, it } from 'vitest'

import {
  GATEWAY_SCENE_LAYOUT,
  getGatewayVerticalNdcBounds,
} from './portfolio-gateway-scene'

describe('portfolio gateway scene framing', () => {
  it('keeps the complete spinning assembly inside the vertical camera frame', () => {
    const bounds = getGatewayVerticalNdcBounds(GATEWAY_SCENE_LAYOUT)

    expect(bounds.top).toBeLessThanOrEqual(0.95)
    expect(bounds.bottom).toBeGreaterThanOrEqual(-0.95)
    expect(bounds.topClearance).toBeGreaterThanOrEqual(0.05)
    expect(bounds.bottomClearance).toBeGreaterThanOrEqual(0.05)
  })

  it('frames the assembly below center to match the CSS gateway composition', () => {
    const bounds = getGatewayVerticalNdcBounds(GATEWAY_SCENE_LAYOUT)

    expect((bounds.top + bounds.bottom) / 2).toBeLessThan(-0.05)
    expect(GATEWAY_SCENE_LAYOUT.cameraZ).toBeGreaterThan(6.2)
  })
})
