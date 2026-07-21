import { describe, expect, it } from 'vitest'

import {
  clampPitch,
  createSkillSphereWireframe,
  decayVelocity,
  fibonacciSphere,
  projectPoint,
  rotatePoint,
  spreadSkillSphereOrder,
} from './skill-sphere'

describe('skill sphere geometry', () => {
  it('builds 28 unique skill intersections from four rings and seven meridians', () => {
    const wireframe = createSkillSphereWireframe(7, 4)
    const positions = new Set(wireframe.points.map(({ x, y, z }) => (
      `${x.toFixed(9)}:${y.toFixed(9)}:${z.toFixed(9)}`
    )))

    expect(wireframe.points).toHaveLength(28)
    expect(wireframe.nodes).toHaveLength(42)
    expect(wireframe.edges).toHaveLength(77)
    expect(positions.size).toBe(28)
    expect(wireframe.topCapStartIndex).toBe(28)
    expect(wireframe.bottomCapStartIndex).toBe(35)

    for (const point of [...wireframe.nodes, ...wireframe.edges.map(({ control }) => control)]) {
      expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(1, 9)
    }

    const topCap = wireframe.nodes.slice(28, 35)
    const bottomCap = wireframe.nodes.slice(35, 42)
    const skillY = wireframe.points.map(({ y }) => y)
    expect(Math.min(...topCap.map(({ y }) => y))).toBeGreaterThan(Math.max(...skillY))
    expect(Math.max(...bottomCap.map(({ y }) => y))).toBeLessThan(Math.min(...skillY))
    expect(new Set(topCap.map(({ x, z }) => `${x.toFixed(9)}:${z.toFixed(9)}`)).size).toBe(7)
    expect(new Set(bottomCap.map(({ x, z }) => `${x.toFixed(9)}:${z.toFixed(9)}`)).size).toBe(7)
  })

  it('connects every skill to one latitude ring and one complete meridian strand', () => {
    const wireframe = createSkillSphereWireframe(7, 4)

    wireframe.edges.forEach((edge) => {
      expect(edge.from).toBeGreaterThanOrEqual(0)
      expect(edge.from).toBeLessThan(wireframe.nodes.length)
      expect(edge.to).toBeGreaterThanOrEqual(0)
      expect(edge.to).toBeLessThan(wireframe.nodes.length)
      if (edge.kind === 'latitude') {
        expect(edge.row).toBeGreaterThanOrEqual(0)
        expect(edge.row).toBeLessThan(4)
        expect(edge.column).toBeNull()
      } else if (edge.kind === 'meridian') {
        expect(edge.column).toBeGreaterThanOrEqual(0)
        expect(edge.column).toBeLessThan(7)
        expect(edge.row).toBeNull()
      } else {
        expect(edge.column).toBeNull()
        expect(edge.row).toBeNull()
      }
    })

    for (let index = 0; index < wireframe.points.length; index += 1) {
      const incident = wireframe.edges.filter(({ from, to }) => from === index || to === index)
      expect(incident.filter(({ kind }) => kind === 'latitude')).toHaveLength(2)
      expect(incident.filter(({ kind }) => kind === 'meridian')).toHaveLength(2)
    }

    for (let row = 0; row < 4; row += 1) {
      expect(wireframe.edges.filter((edge) => edge.row === row)).toHaveLength(7)
    }
    for (let column = 0; column < 7; column += 1) {
      expect(wireframe.edges.filter((edge) => edge.column === column)).toHaveLength(5)
    }
    expect(wireframe.edges.filter(({ kind }) => kind === 'cap')).toHaveLength(14)
  })

  it('spreads catalog neighbors into a stable, complete row-major order', () => {
    const order = spreadSkillSphereOrder(28)

    expect(order).toHaveLength(28)
    expect(new Set(order).size).toBe(28)
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 28 }, (_, index) => index),
    )
    expect(order).not.toEqual(Array.from({ length: 28 }, (_, index) => index))
    expect(spreadSkillSphereOrder(0)).toEqual([])

    const reactSlot = order.indexOf(10)
    const reactNativeSlot = order.indexOf(13)
    const rowDistance = Math.abs(Math.floor(reactSlot / 7) - Math.floor(reactNativeSlot / 7))
    const columnDistance = Math.abs((reactSlot % 7) - (reactNativeSlot % 7))
    expect(rowDistance + columnDistance).toBeGreaterThanOrEqual(3)
  })

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
