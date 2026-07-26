import { describe, expect, it } from 'vitest'

import {
  constrainSkillBody,
  resolveSkillCollisions,
  type SkillArenaBody,
  type SkillCollisionBody,
} from './skill-workbench-physics'

function createBody(overrides: Partial<SkillCollisionBody> = {}): SkillCollisionBody {
  return {
    dragging: false,
    height: 50,
    homeLeft: 0,
    homeTop: 0,
    velocityX: 0,
    velocityY: 0,
    width: 100,
    x: 0,
    y: 0,
    ...overrides,
  }
}

function createArenaBody(
  overrides: Partial<SkillArenaBody> = {},
): SkillArenaBody {
  return {
    ...createBody({ height: 10, width: 10 }),
    bounds: {
      maxX: 100,
      maxY: 100,
      minX: 0,
      minY: 0,
    },
    ...overrides,
  }
}

describe('skill workbench collision physics', () => {
  it('separates overlapping solid tokens and transfers horizontal momentum', () => {
    const left = createBody({ velocityX: 3 })
    const right = createBody({ homeLeft: 80, velocityX: -1 })

    const didCollide = resolveSkillCollisions([left, right])

    expect(didCollide).toBe(true)
    expect(left.homeLeft + left.x + left.width).toBeLessThanOrEqual(
      right.homeLeft + right.x + 0.01,
    )
    expect(left.velocityX).toBeLessThan(3)
    expect(right.velocityX).toBeGreaterThan(-1)
  })

  it('treats a dragged token as a solid immovable body', () => {
    const dragged = createBody({ dragging: true, x: 10, velocityX: 4 })
    const loose = createBody({ homeLeft: 90 })

    resolveSkillCollisions([dragged, loose])

    expect(dragged.x).toBe(10)
    expect(loose.x).toBeGreaterThan(0)
    expect(loose.velocityX).toBeGreaterThan(0)
  })

  it('pushes a loose token away from a dragged second body', () => {
    const loose = createBody({ velocityX: 0 })
    const dragged = createBody({
      dragging: true,
      homeLeft: 90,
      velocityX: -4,
    })

    resolveSkillCollisions([loose, dragged])

    expect(loose.x).toBeLessThan(0)
    expect(loose.velocityX).toBeLessThan(0)
    expect(dragged.x).toBe(0)
  })

  it('does not resolve a pair while both tokens are being dragged', () => {
    const first = createBody({ dragging: true })
    const second = createBody({ dragging: true, homeLeft: 90 })

    expect(resolveSkillCollisions([first, second])).toBe(false)
    expect(first.x).toBe(0)
    expect(second.x).toBe(0)
  })

  it('separates horizontally overlapping tokens that are already moving apart', () => {
    const left = createBody({ velocityX: -2 })
    const right = createBody({ homeLeft: 90, velocityX: 2 })

    resolveSkillCollisions([left, right])

    expect(left.velocityX).toBe(-2)
    expect(right.velocityX).toBe(2)
  })

  it('resolves vertical overlap without moving unrelated tokens', () => {
    const top = createBody({ height: 40, velocityY: 2 })
    const bottom = createBody({ height: 40, homeTop: 30 })
    const distant = createBody({ homeLeft: 240, homeTop: 200 })

    const didCollide = resolveSkillCollisions([top, bottom, distant])

    expect(didCollide).toBe(true)
    expect(top.homeTop + top.y + top.height).toBeLessThanOrEqual(
      bottom.homeTop + bottom.y + 0.01,
    )
    expect(distant.x).toBe(0)
    expect(distant.y).toBe(0)
  })

  it('separates vertically overlapping tokens that are already moving apart', () => {
    const top = createBody({ height: 40, velocityY: -2 })
    const bottom = createBody({ height: 40, homeTop: 30, velocityY: 2 })

    resolveSkillCollisions([top, bottom])

    expect(top.velocityY).toBe(-2)
    expect(bottom.velocityY).toBe(2)
  })

  it('resolves collisions when the second token is left or above the first', () => {
    const right = createBody({ homeLeft: 90 })
    const left = createBody()
    const bottom = createBody({ height: 40, homeLeft: 240, homeTop: 30 })
    const top = createBody({ height: 40, homeLeft: 240 })

    resolveSkillCollisions([right, left, bottom, top])

    expect(right.x).toBeGreaterThan(0)
    expect(bottom.y).toBeGreaterThan(0)
  })

  it('leaves horizontally and vertically separated tokens untouched', () => {
    const first = createBody()
    const horizontal = createBody({ homeLeft: 140 })
    const vertical = createBody({ homeTop: 80 })

    expect(resolveSkillCollisions([first, horizontal, vertical])).toBe(false)
    expect(first.x).toBe(0)
    expect(horizontal.x).toBe(0)
    expect(vertical.y).toBe(0)
  })

  it('bounces bodies off every arena edge', () => {
    const topLeft = createArenaBody({
      velocityX: -2,
      velocityY: -4,
      x: -8,
      y: -6,
    })
    const bottomRight = createArenaBody({
      velocityX: 2,
      velocityY: 4,
      x: 108,
      y: 106,
    })

    constrainSkillBody(topLeft)
    constrainSkillBody(bottomRight)

    expect(topLeft).toMatchObject({
      velocityX: 1.08,
      velocityY: 2.16,
      x: 0,
      y: 0,
    })
    expect(bottomRight).toMatchObject({
      velocityX: -1.08,
      velocityY: -2.16,
      x: 100,
      y: 100,
    })
  })

  it('puts a slow body to sleep only when it rests on the floor', () => {
    const resting = createArenaBody({
      velocityX: 0.04,
      velocityY: 0.1,
      y: 100,
    })
    const movingSideways = createArenaBody({
      velocityX: 0.2,
      velocityY: 0.1,
      y: 100,
    })
    const movingVertically = createArenaBody({
      velocityX: 0.04,
      velocityY: 0.3,
      y: 100,
    })
    const floating = createArenaBody({
      velocityX: 0.04,
      velocityY: 0.1,
      y: 50,
    })

    constrainSkillBody(resting)
    constrainSkillBody(movingSideways)
    constrainSkillBody(movingVertically)
    constrainSkillBody(floating)

    expect(resting.velocityX).toBe(0)
    expect(resting.velocityY).toBe(0)
    expect(movingSideways.velocityX).toBe(0.2)
    expect(movingVertically.velocityY).toBe(0.3)
    expect(floating.velocityY).toBe(0.1)
  })

  it('ignores unmeasured arena bodies', () => {
    const noWidth = createArenaBody({ width: 0, x: -10 })
    const noHeight = createArenaBody({ height: 0, x: -10 })

    constrainSkillBody(noWidth)
    constrainSkillBody(noHeight)

    expect(noWidth.x).toBe(-10)
    expect(noHeight.x).toBe(-10)
  })
})
