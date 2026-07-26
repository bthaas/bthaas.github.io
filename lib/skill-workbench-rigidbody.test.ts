import { afterEach, describe, expect, it } from 'vitest'

import {
  createDragSweep,
  createScatteredLayout,
  createSkillRigidBodyWorld,
  type SkillRigidBodyWorld,
  type SkillTokenPlacement,
  type SkillTokenSize,
} from './skill-workbench-rigidbody'

const TOKEN_COUNT = 28
const ARENA_WIDTH = 1_280
const ARENA_HEIGHT = 520
const TOKEN_SIZES: readonly SkillTokenSize[] = Array.from(
  { length: TOKEN_COUNT },
  (_, index) => ({
    height: [42, 44, 46, 48][index % 4],
    width: [114, 128, 142, 155][index % 4],
  }),
)

function overlapArea(
  first: { x: number; y: number },
  firstSize: SkillTokenSize,
  second: { x: number; y: number },
  secondSize: SkillTokenSize,
) {
  const overlapX = (
    (firstSize.width + secondSize.width) / 2
    - Math.abs(second.x - first.x)
  )
  const overlapY = (
    (firstSize.height + secondSize.height) / 2
    - Math.abs(second.y - first.y)
  )

  return Math.max(0, overlapX) * Math.max(0, overlapY)
}

describe('skill workbench rigid-body layout', () => {
  let world: SkillRigidBodyWorld | null = null

  afterEach(() => {
    world?.destroy()
    world = null
  })

  it('builds a deterministic, non-overlapping scattered launch field', () => {
    const first = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 4_821_337,
      tokenSizes: TOKEN_SIZES,
    })
    const second = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 4_821_337,
      tokenSizes: TOKEN_SIZES,
    })

    expect(second).toEqual(first)
    expect(first).toHaveLength(TOKEN_COUNT)
    expect(new Set(first.map(({ x }) => Math.round(x / 20))).size).toBeGreaterThan(14)
    expect(new Set(first.map(({ y }) => Math.round(y / 20))).size).toBeGreaterThan(8)

    first.forEach((placement, index) => {
      const size = TOKEN_SIZES[index]
      expect(placement.x).toBeGreaterThanOrEqual(size.width / 2)
      expect(placement.x).toBeLessThanOrEqual(ARENA_WIDTH - size.width / 2)
      expect(placement.y).toBeGreaterThanOrEqual(size.height / 2)
      expect(placement.y).toBeLessThan(ARENA_HEIGHT * 0.76)

      for (let otherIndex = index + 1; otherIndex < first.length; otherIndex += 1) {
        expect(overlapArea(
          placement,
          size,
          first[otherIndex],
          TOKEN_SIZES[otherIndex],
        )).toBe(0)
      }
    })
  })

  it('changes the launch field when a new page-load seed is used', () => {
    const first = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 101,
      tokenSizes: TOKEN_SIZES,
    })
    const second = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 202,
      tokenSizes: TOKEN_SIZES,
    })

    expect(second).not.toEqual(first)
  })

  it('sweeps a fast drag through collision-sized waypoints', () => {
    const from = { angle: -0.1, x: 112, y: 482 }
    const to = { angle: 0.34, x: 998, y: 74 }
    const sweep = createDragSweep(from, to)
    let previous = from

    expect(sweep.length).toBeGreaterThan(20)
    expect(sweep.length).toBeLessThan(40)
    sweep.forEach((waypoint) => {
      expect(Math.hypot(
        waypoint.x - previous.x,
        waypoint.y - previous.y,
      )).toBeLessThanOrEqual(32)
      expect(waypoint.angle).toBeGreaterThan(previous.angle)
      previous = waypoint
    })
    expect(sweep.at(-1)).toEqual(to)
  })

  it('wakes and pushes a sleeping body during a fast drag', () => {
    const tokenSizes = Array.from({ length: 12 }, () => ({
      height: 40,
      width: 80,
    }))
    world = createSkillRigidBodyWorld({
      arenaHeight: 400,
      arenaWidth: 800,
      seed: 8_112,
      tokenSizes,
    })
    world.drop()
    for (let frame = 0; frame < 1_800; frame += 1) {
      if (world.getSnapshots().every(({ isSleeping }) => isSleeping)) break
      world.step(1_000 / 60)
    }
    const settled = world.getSnapshots()
    expect(settled.every(({ isSleeping }) => isSleeping)).toBe(true)
    let route: {
      obstacleIndex: number
      sourceIndex: number
      target: SkillTokenPlacement
    } | undefined

    for (
      let sourceIndex = 0;
      sourceIndex < settled.length && !route;
      sourceIndex += 1
    ) {
      for (
        let obstacleIndex = 0;
        obstacleIndex < settled.length && !route;
        obstacleIndex += 1
      ) {
        if (sourceIndex === obstacleIndex) continue
        const source = settled[sourceIndex]
        const obstacle = settled[obstacleIndex]
        const deltaX = obstacle.x - source.x
        const deltaY = obstacle.y - source.y
        const distance = Math.hypot(deltaX, deltaY)
        if (distance < 120) continue
        const target = {
          angle: 0,
          x: obstacle.x + (deltaX / distance) * 90,
          y: obstacle.y + (deltaY / distance) * 90,
        }
        if (
          target.x < 40
          || target.x > 760
          || target.y < 20
          || target.y > 380
        ) continue

        route = { obstacleIndex, sourceIndex, target }
      }
    }

    expect(route).toBeDefined()
    if (!route) return

    const obstacleBefore = world.getSnapshots()[route.obstacleIndex]
    world.beginDrag(route.sourceIndex)
    world.dragBody(
      route.sourceIndex,
      route.target.x,
      route.target.y,
      route.target.angle,
    )
    const snapshots = world.getSnapshots()
    const obstacleAfter = snapshots[route.obstacleIndex]
    const draggedAfter = snapshots[route.sourceIndex]

    expect(Math.hypot(
      obstacleAfter.x - obstacleBefore.x,
      obstacleAfter.y - obstacleBefore.y,
    )).toBeGreaterThan(1)
    expect(draggedAfter.x).toBeCloseTo(route.target.x, 4)
    expect(draggedAfter.y).toBeCloseTo(route.target.y, 4)
  })

  it.each([1, 7, 31, 101, 509, 4_294_967_295])(
    'always returns a complete launch field for seed %s',
    (seed) => {
      const placements = createScatteredLayout({
        arenaHeight: ARENA_HEIGHT,
        arenaWidth: ARENA_WIDTH,
        seed,
        tokenSizes: TOKEN_SIZES,
      })

      expect(placements).toHaveLength(TOKEN_COUNT)
      placements.forEach((placement, index) => {
        for (
          let otherIndex = index + 1;
          otherIndex < placements.length;
          otherIndex += 1
        ) {
          expect(overlapArea(
            placement,
            TOKEN_SIZES[index],
            placements[otherIndex],
            TOKEN_SIZES[otherIndex],
          )).toBe(0)
        }
      })
    },
  )

  it('gives released tokens angular momentum and restores their scattered homes', () => {
    world = createSkillRigidBodyWorld({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 73_119,
      tokenSizes: TOKEN_SIZES,
    })
    const homes = world.getHomes()

    expect(world.getSnapshots().every(({ isStatic }) => isStatic)).toBe(true)

    world.drop()
    for (let frame = 0; frame < 240; frame += 1) world.step(1_000 / 60)

    const fallen = world.getSnapshots()
    const rotatedBodies = fallen.filter((snapshot, index) => (
      Math.abs(snapshot.angle - homes[index].angle) > 0.08
    ))

    expect(fallen.every(({ isStatic }) => !isStatic)).toBe(true)
    expect(rotatedBodies.length).toBeGreaterThan(TOKEN_COUNT / 2)
    expect(Math.max(...fallen.map(({ angle }, index) => (
      Math.abs(angle - homes[index].angle)
    )))).toBeGreaterThan(0.25)

    world.stick()
    expect(world.getSnapshots()).toEqual(homes.map((home) => ({
      ...home,
      isSleeping: false,
      isStatic: true,
    })))
  })
})
