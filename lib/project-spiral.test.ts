import { describe, expect, it } from 'vitest'

import {
  getFrontProjectIndex,
  getDefaultProjectView,
  getProjectSpiralFrame,
  getProjectSpiralLayout,
  getProjectSpiralPhase,
  PROJECT_SPIRAL_SLOT_ORDER,
} from './project-spiral'

describe('project spiral choreography', () => {
  it('prefers the readable index when reduced motion is requested', () => {
    expect(getDefaultProjectView(false)).toBe('spiral')
    expect(getDefaultProjectView(true)).toBe('index')
  })

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

  it('keeps one complete turn visibly curved inside the reference viewport', () => {
    const viewport = { height: 7.68, width: 15.1 }
    const layout = getProjectSpiralLayout(viewport)
    const upperHalfTurn = Array.from({ length: 5 }, (_, slotIndex) =>
      getProjectSpiralFrame({
        phase: 0,
        slotCount: 9,
        slotIndex,
        velocity: 0,
      }),
    )
    const outermostCenterY = Math.abs(
      upperHalfTurn[4].y * layout.verticalPitch,
    )

    expect(outermostCenterY).toBeGreaterThanOrEqual(viewport.height * 0.39)
    expect(outermostCenterY).toBeLessThanOrEqual(viewport.height * 0.42)
    expect(upperHalfTurn[2].x).toBeGreaterThan(upperHalfTurn[4].x)
    expect(upperHalfTurn[4].depth).toBeLessThan(-0.9)
  })

  it('packs the front cards with only a narrow reference-sized gap', () => {
    const viewport = { height: 7.68, width: 15.1 }
    const layout = getProjectSpiralLayout(viewport)
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
    const projectedHalfWidth = (
      layout.targetCardWidth * front.scale * Math.abs(Math.cos(front.rotationY))
      + layout.targetCardWidth
        * neighbor.scale
        * Math.abs(Math.cos(neighbor.rotationY))
    ) / 2
    const horizontalGap = horizontalSeparation - projectedHalfWidth

    expect(layout.horizontalRadius).toBeGreaterThanOrEqual(viewport.width * 0.35)
    expect(layout.horizontalRadius).toBeLessThanOrEqual(viewport.width * 0.365)
    expect(layout.targetCardWidth).toBeGreaterThanOrEqual(viewport.width * 0.23)
    expect(layout.targetCardWidth).toBeLessThanOrEqual(viewport.width * 0.25)
    expect(horizontalGap).toBeGreaterThanOrEqual(viewport.width * 0.002)
    expect(horizontalGap).toBeLessThanOrEqual(viewport.width * 0.01)
  })

  it('keeps the compact desktop proportions stable through each project step', () => {
    const viewport = { height: 7.68, width: 15.1 }
    const layout = getProjectSpiralLayout(viewport)

    for (const phase of [0, 1, 2]) {
      const frontIndex = phase
      const front = getProjectSpiralFrame({
        phase,
        slotCount: 9,
        slotIndex: frontIndex,
        velocity: 0,
      })
      const next = getProjectSpiralFrame({
        phase,
        slotCount: 9,
        slotIndex: frontIndex + 1,
        velocity: 0,
      })
      const horizontalGap = Math.abs(front.x - next.x) * layout.horizontalRadius
        - layout.targetCardWidth * (
          front.scale * Math.abs(Math.cos(front.rotationY))
          + next.scale * Math.abs(Math.cos(next.rotationY))
        ) / 2

      expect(horizontalGap).toBeGreaterThanOrEqual(viewport.width * 0.002)
      expect(horizontalGap).toBeLessThanOrEqual(viewport.width * 0.01)
    }
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

    expect(layout.targetCardWidth).toBeGreaterThanOrEqual(3.6 * 0.4)
    expect(
      horizontalSeparation > combinedHalfWidth
      || verticalSeparation > combinedHalfHeight,
    ).toBe(true)
  })

  it('keeps the returning side of the helix visible on mobile', () => {
    const viewport = { height: 7.8, width: 3.6 }
    const layout = getProjectSpiralLayout(viewport, true)
    const upperHalfTurn = Array.from({ length: 5 }, (_, slotIndex) =>
      getProjectSpiralFrame({
        phase: 0,
        slotCount: 9,
        slotIndex,
        velocity: 0,
      }),
    )
    const outermostCenterY = Math.abs(
      upperHalfTurn[4].y * layout.verticalPitch,
    )

    expect(outermostCenterY).toBeGreaterThanOrEqual(viewport.height * 0.52)
    expect(outermostCenterY).toBeLessThanOrEqual(viewport.height * 0.58)
    expect(upperHalfTurn[2].x).toBeGreaterThan(upperHalfTurn[4].x)
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

  it('repeats projects in strict A, B, C cycles around the helix', () => {
    expect(PROJECT_SPIRAL_SLOT_ORDER).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
    expect(Array.from({ length: 9 }, (_, phase) =>
      getFrontProjectIndex(phase, 9, 3),
    )).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
    expect(getFrontProjectIndex(-1, 9, 3)).toBe(2)
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
