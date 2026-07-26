import { describe, expect, it } from 'vitest'

import { GATEWAY_CYLINDER_SEGMENTS } from './portfolio-gateway'
import {
  GATEWAY_ENTRANCE_DURATION_SECONDS,
  getGatewaySliceEntrance,
  isGatewayEntranceInteractive,
  shouldRunGatewayEntrance,
} from './portfolio-gateway-entrance'

describe('Skyfall gateway entrance choreography', () => {
  it('keeps the complete assembly inside the approved duration window', () => {
    expect(GATEWAY_ENTRANCE_DURATION_SECONDS).toBeGreaterThanOrEqual(2.4)
    expect(GATEWAY_ENTRANCE_DURATION_SECONDS).toBeLessThanOrEqual(2.8)
  })

  it('builds all 48 slices deterministically from the rear arc toward the front', () => {
    const viewportHeight = 900
    const firstPass = GATEWAY_CYLINDER_SEGMENTS.map((segment, index) => (
      getGatewaySliceEntrance(index, segment.angle, viewportHeight)
    ))
    const secondPass = GATEWAY_CYLINDER_SEGMENTS.map((segment, index) => (
      getGatewaySliceEntrance(index, segment.angle, viewportHeight)
    ))

    expect(firstPass).toEqual(secondPass)
    expect(firstPass).toHaveLength(48)
    expect(firstPass.every((slice) => (
      Number.isFinite(slice.delay)
      && slice.fallDistance >= viewportHeight * 0.82
      && slice.fallDistance <= viewportHeight * 1.28
      && Math.abs(slice.x) <= 96
      && Math.abs(slice.rotationX) <= 16
      && Math.abs(slice.rotationY) <= 22
      && Math.abs(slice.rotationZ) <= 12
      && slice.scale >= 0.9
      && slice.scale <= 1
    ))).toBe(true)

    const normalizedAngle = (angle: number) => (
      ((angle + 180) % 360 + 360) % 360 - 180
    )
    const rearDelays = firstPass
      .filter((_, index) => Math.abs(normalizedAngle(
        GATEWAY_CYLINDER_SEGMENTS[index].angle,
      )) >= 135)
      .map((slice) => slice.delay)
    const frontDelays = firstPass
      .filter((_, index) => Math.abs(normalizedAngle(
        GATEWAY_CYLINDER_SEGMENTS[index].angle,
      )) <= 45)
      .map((slice) => slice.delay)

    expect(Math.max(...rearDelays)).toBeLessThan(Math.min(...frontDelays))
  })

  it('runs only on an unseen motion-capable session', () => {
    expect(shouldRunGatewayEntrance({ reducedMotion: false, seen: false })).toBe(true)
    expect(shouldRunGatewayEntrance({ reducedMotion: false, seen: true })).toBe(false)
    expect(shouldRunGatewayEntrance({ reducedMotion: true, seen: false })).toBe(false)
  })

  it('keeps pointer and keyboard interaction locked until the final state', () => {
    expect(isGatewayEntranceInteractive('settled')).toBe(true)
    expect(isGatewayEntranceInteractive('pending')).toBe(false)
    expect(isGatewayEntranceInteractive('entering')).toBe(false)
  })
})
