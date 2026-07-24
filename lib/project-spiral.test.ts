import { describe, expect, it } from 'vitest'

import {
  getFrontProjectIndex,
  getProjectSpiralFrame,
  getProjectSpiralLayout,
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

  it('keeps neighboring front cards separated at the reference viewport', () => {
    const layout = getProjectSpiralLayout({ height: 7.68, width: 15.1 })
    const front = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 0,
      velocity: 0,
    })
    const neighbor = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 1,
      velocity: 0,
    })
    const horizontalSeparation = Math.abs(front.x - neighbor.x) * layout.horizontalRadius
    const combinedHalfWidth = (
      layout.targetCardWidth * front.scale
      + layout.targetCardWidth * neighbor.scale
    ) / 2
    const verticalSeparation = Math.abs(front.y - neighbor.y) * layout.verticalPitch
    const combinedHalfHeight = (
      layout.targetCardWidth * front.scale / (1200 / 848)
      + layout.targetCardWidth * neighbor.scale / (1200 / 686)
    ) / 2

    expect(layout.targetCardWidth).toBeLessThanOrEqual(layout.horizontalRadius * 0.75)
    expect(
      horizontalSeparation > combinedHalfWidth
      || verticalSeparation > combinedHalfHeight,
    ).toBe(true)
  })

  it('keeps mobile cards large enough to read without merging them', () => {
    const layout = getProjectSpiralLayout({ height: 7.8, width: 3.6 }, true)
    const front = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 0,
      velocity: 0,
    })
    const neighbor = getProjectSpiralFrame({
      phase: 0,
      slotCount: 9,
      slotIndex: 1,
      velocity: 0,
    })
    const horizontalSeparation = Math.abs(front.x - neighbor.x) * layout.horizontalRadius
    const combinedHalfWidth = layout.targetCardWidth * (front.scale + neighbor.scale) / 2
    const verticalSeparation = Math.abs(front.y - neighbor.y) * layout.verticalPitch
    const combinedHalfHeight = (
      layout.targetCardWidth * front.scale / (1200 / 848)
      + layout.targetCardWidth * neighbor.scale / (1200 / 686)
    ) / 2

    expect(layout.targetCardWidth).toBeGreaterThanOrEqual(3.6 * 0.5)
    expect(
      horizontalSeparation > combinedHalfWidth
      || verticalSeparation > combinedHalfHeight,
    ).toBe(true)
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
