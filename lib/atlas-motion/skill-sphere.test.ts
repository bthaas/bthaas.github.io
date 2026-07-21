import { describe, expect, it } from 'vitest'

import {
  clampPitch,
  decayVelocity,
  fibonacciSphere,
  projectPoint,
  rotatePoint,
} from './skill-sphere'

describe('skill sphere geometry', () => {
  it('distributes any positive count as unique unit vectors', () => {
    const points = fibonacciSphere(28)
    const positions = new Set(points.map(({ x, y, z }) => (
      `${x.toFixed(9)}:${y.toFixed(9)}:${z.toFixed(9)}`
    )))

    expect(points).toHaveLength(28)
    expect(positions.size).toBe(28)
    points.forEach((point) => {
      expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(1, 9)
    })
    expect(fibonacciSphere(0)).toEqual([])
    expect(fibonacciSphere(-4)).toEqual([])
  })

  it('rotates around yaw and pitch while preserving radius', () => {
    const yawed = rotatePoint({ x: 1, y: 0, z: 0 }, Math.PI / 2, 0)
    const pitched = rotatePoint({ x: 0, y: 1, z: 0 }, 0, Math.PI / 2)

    expect(yawed.x).toBeCloseTo(0, 9)
    expect(yawed.z).toBeCloseTo(-1, 9)
    expect(pitched.y).toBeCloseTo(0, 9)
    expect(pitched.z).toBeCloseTo(1, 9)
    expect(Math.hypot(pitched.x, pitched.y, pitched.z)).toBeCloseTo(1, 9)
  })

  it('projects far and near points into documented scale, opacity, and depth ranges', () => {
    const far = projectPoint({ x: 0, y: 0, z: -1 }, 180, 500)
    const near = projectPoint({ x: 0, y: 0, z: 1 }, 180, 500)
    const edge = projectPoint({ x: 1, y: -1, z: 0 }, 180, 500)

    expect(far).toMatchObject({ x: 250, y: 250, scale: 0.55, opacity: 0.3, z: 0 })
    expect(near).toMatchObject({ x: 250, y: 250, scale: 1, opacity: 1, z: 200 })
    expect(edge.x).toBe(430)
    expect(edge.y).toBe(70)

    for (const projection of [far, near, edge]) {
      expect(projection.scale).toBeGreaterThanOrEqual(0.55)
      expect(projection.scale).toBeLessThanOrEqual(1)
      expect(projection.opacity).toBeGreaterThanOrEqual(0.3)
      expect(projection.opacity).toBeLessThanOrEqual(1)
      expect(projection.z).toBeGreaterThanOrEqual(0)
      expect(projection.z).toBeLessThanOrEqual(200)
    }
  })

  it('clamps pitch without allowing the sphere to flip', () => {
    expect(clampPitch(-4)).toBe(-1.5)
    expect(clampPitch(0.4)).toBe(0.4)
    expect(clampPitch(4)).toBe(1.5)
  })

  it('decays momentum monotonically toward the requested idle floor', () => {
    let yawVelocity = 0.2
    for (let frame = 0; frame < 80; frame += 1) {
      const next = decayVelocity(yawVelocity, 0.006)
      expect(next).toBeLessThanOrEqual(yawVelocity)
      expect(next).toBeGreaterThanOrEqual(0.006)
      yawVelocity = next
    }

    let reverseVelocity = -0.08
    for (let frame = 0; frame < 80; frame += 1) {
      const next = decayVelocity(reverseVelocity, 0.006)
      expect(Math.abs(0.006 - next)).toBeLessThanOrEqual(Math.abs(0.006 - reverseVelocity))
      reverseVelocity = next
    }

    expect(Math.abs(decayVelocity(-0.08))).toBeLessThan(0.08)
    expect(decayVelocity(0)).toBe(0)
  })
})
