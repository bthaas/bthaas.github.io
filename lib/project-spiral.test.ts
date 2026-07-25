import { describe, expect, it } from 'vitest'

import {
  getFrontProjectIndex,
  getProjectSpiralFrame,
  getProjectSpiralLayout,
  getProjectSpiralPhase,
  PROJECT_SPIRAL_SLOT_ORDER,
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

    expect(outermostCenterY).toBeGreaterThanOrEqual(viewport.height * 0.4)
    expect(outermostCenterY).toBeLessThanOrEqual(viewport.height * 0.46)
    expect(upperHalfTurn[2].x).toBeGreaterThan(upperHalfTurn[4].x)
    expect(upperHalfTurn[4].depth).toBeLessThan(-0.9)
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

  it('keeps a visible gap between every neighboring desktop card', () => {
    const viewport = { height: 7.68, width: 15.1 }
    const layout = getProjectSpiralLayout(viewport)
    const aspectRatios = [1200 / 848, 1200 / 686, 1200 / 916]
    const minimumGap = viewport.width * 0.003

    for (const phase of [0, 0.5, 1, 1.5, 2, 2.5]) {
      const frames = Array.from({ length: 9 }, (_, slotIndex) => ({
        aspectRatio: aspectRatios[PROJECT_SPIRAL_SLOT_ORDER[slotIndex]],
        frame: getProjectSpiralFrame({
          phase,
          slotCount: 9,
          slotIndex,
          velocity: 0,
        }),
      })).sort((a, b) => a.frame.y - b.frame.y)

      for (let index = 1; index < frames.length; index += 1) {
        const previous = frames[index - 1]
        const current = frames[index]
        const horizontalSeparation = Math.abs(
          previous.frame.x - current.frame.x,
        ) * layout.horizontalRadius
        const projectedHalfWidths = (
          layout.targetCardWidth
            * previous.frame.scale
            * Math.abs(Math.cos(previous.frame.rotationY))
          + layout.targetCardWidth
            * current.frame.scale
            * Math.abs(Math.cos(current.frame.rotationY))
        ) / 2
        const verticalSeparation = Math.abs(
          previous.frame.y - current.frame.y,
        ) * layout.verticalPitch
        const projectedHalfHeights = (
          layout.targetCardWidth * previous.frame.scale / previous.aspectRatio
          + layout.targetCardWidth * current.frame.scale / current.aspectRatio
        ) / 2

        expect(
          horizontalSeparation - projectedHalfWidths >= minimumGap
          || verticalSeparation - projectedHalfHeights >= minimumGap,
          `phase ${phase}, neighboring frames ${index - 1}/${index}, `
            + `horizontal gap ${horizontalSeparation - projectedHalfWidths}, `
            + `vertical gap ${verticalSeparation - projectedHalfHeights}`,
        ).toBe(true)
      }
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
