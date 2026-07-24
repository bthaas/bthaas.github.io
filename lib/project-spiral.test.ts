import { describe, expect, it } from 'vitest'

import {
  getFrontProjectIndex,
  getProjectSpiralFrame,
  getProjectSpiralPhase,
} from './project-spiral'

describe('project spiral choreography', () => {
  it('places the active slot front and center', () => {
    const frame = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 0,
      velocity: 0,
    })

    expect(frame.x).toBeCloseTo(0, 5)
    expect(frame.y).toBeCloseTo(0, 5)
    expect(frame.depth).toBeCloseTo(1, 5)
    expect(frame.scale).toBeGreaterThan(1)
    expect(frame.rotationY).toBeCloseTo(0, 5)
  })

  it('wraps the final slot directly below the active slot', () => {
    const firstNeighbor = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 1,
      velocity: 0,
    })
    const wrappedNeighbor = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 8,
      velocity: 0,
    })

    expect(firstNeighbor.x).toBeGreaterThan(0)
    expect(firstNeighbor.y).toBeLessThan(0)
    expect(wrappedNeighbor.x).toBeLessThan(0)
    expect(wrappedNeighbor.y).toBeGreaterThan(0)
    expect(wrappedNeighbor.depth).toBeCloseTo(firstNeighbor.depth, 5)
  })

  it('advances the next slot to the front after one phase step', () => {
    const frame = getProjectSpiralFrame({
      phase: 1,
      slotCount: 9,
      slotIndex: 1,
      velocity: 0,
    })

    expect(frame.x).toBeCloseTo(0, 5)
    expect(frame.y).toBeCloseTo(0, 5)
    expect(frame.depth).toBeCloseTo(1, 5)
  })

  it('maps section progress to two complete revolutions', () => {
    expect(getProjectSpiralPhase(0, 9)).toBe(0)
    expect(getProjectSpiralPhase(0.5, 9)).toBe(9)
    expect(getProjectSpiralPhase(1, 9)).toBe(18)
  })

  it('keeps front labels synchronized with the repeated project order', () => {
    expect(getFrontProjectIndex(0, 9, 3)).toBe(0)
    expect(getFrontProjectIndex(1.1, 9, 3)).toBe(1)
    expect(getFrontProjectIndex(2.6, 9, 3)).toBe(2)
    expect(getFrontProjectIndex(-1, 9, 3)).toBe(1)
  })

  it('caps velocity deformation while preserving direction', () => {
    const fast = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 0,
      velocity: 100,
    })
    const reverse = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 0,
      velocity: -100,
    })

    expect(fast.velocitySkew).toBeCloseTo(0.14, 5)
    expect(reverse.velocitySkew).toBeCloseTo(-0.14, 5)
  })
})
