export interface SkillCollisionBody {
  dragging: boolean
  height: number
  homeLeft: number
  homeTop: number
  velocityX: number
  velocityY: number
  width: number
  x: number
  y: number
}

export interface SkillArenaBody extends SkillCollisionBody {
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

const ARENA_BOUNCE = 0.54
const COLLISION_RESTITUTION = 0.34
const SEPARATION_SLOP = 0.01
const SETTLED_HORIZONTAL_SPEED = 0.08
const SETTLED_VERTICAL_SPEED = 0.22

export function constrainSkillBody(body: SkillArenaBody) {
  if (body.width <= 0 || body.height <= 0) return

  if (body.x < body.bounds.minX) {
    body.x = body.bounds.minX
    body.velocityX = Math.abs(body.velocityX) * ARENA_BOUNCE
  } else if (body.x > body.bounds.maxX) {
    body.x = body.bounds.maxX
    body.velocityX = -Math.abs(body.velocityX) * ARENA_BOUNCE
  }

  if (body.y < body.bounds.minY) {
    body.y = body.bounds.minY
    body.velocityY = Math.abs(body.velocityY) * ARENA_BOUNCE
  } else if (body.y > body.bounds.maxY) {
    body.y = body.bounds.maxY
    body.velocityY = -Math.abs(body.velocityY) * ARENA_BOUNCE
  }

  if (
    Math.abs(body.velocityX) < SETTLED_HORIZONTAL_SPEED
    && Math.abs(body.velocityY) < SETTLED_VERTICAL_SPEED
    && Math.abs(body.y - body.bounds.maxY) < 0.5
  ) {
    body.velocityX = 0
    body.velocityY = 0
  }
}

function resolveAxis(
  first: SkillCollisionBody,
  second: SkillCollisionBody,
  axis: 'x' | 'y',
  normal: number,
  overlap: number,
) {
  const firstInverseMass = first.dragging ? 0 : 1
  const secondInverseMass = second.dragging ? 0 : 1
  const inverseMassSum = firstInverseMass + secondInverseMass

  const separation = overlap + SEPARATION_SLOP
  const firstShare = firstInverseMass / inverseMassSum
  const secondShare = secondInverseMass / inverseMassSum

  if (axis === 'x') {
    first.x -= normal * separation * firstShare
    second.x += normal * separation * secondShare

    const relativeVelocity = (second.velocityX - first.velocityX) * normal
    if (relativeVelocity >= 0) return

    const impulse = (
      -(1 + COLLISION_RESTITUTION) * relativeVelocity
    ) / inverseMassSum
    first.velocityX -= impulse * normal * firstInverseMass
    second.velocityX += impulse * normal * secondInverseMass
    return
  }

  first.y -= normal * separation * firstShare
  second.y += normal * separation * secondShare

  const relativeVelocity = (second.velocityY - first.velocityY) * normal
  if (relativeVelocity >= 0) return

  const impulse = (
    -(1 + COLLISION_RESTITUTION) * relativeVelocity
  ) / inverseMassSum
  first.velocityY -= impulse * normal * firstInverseMass
  second.velocityY += impulse * normal * secondInverseMass
}

/**
 * Resolves axis-aligned overlap in place. The animation loop owns mutable bodies
 * so collision work does not allocate new objects every frame.
 */
export function resolveSkillCollisions(
  bodies: readonly SkillCollisionBody[],
): boolean {
  let didCollide = false

  for (let firstIndex = 0; firstIndex < bodies.length; firstIndex += 1) {
    const first = bodies[firstIndex]

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < bodies.length;
      secondIndex += 1
    ) {
      const second = bodies[secondIndex]
      if (first.dragging && second.dragging) continue

      const firstCenterX = first.homeLeft + first.x + first.width / 2
      const firstCenterY = first.homeTop + first.y + first.height / 2
      const secondCenterX = second.homeLeft + second.x + second.width / 2
      const secondCenterY = second.homeTop + second.y + second.height / 2
      const overlapX = (
        (first.width + second.width) / 2
        - Math.abs(secondCenterX - firstCenterX)
      )
      const overlapY = (
        (first.height + second.height) / 2
        - Math.abs(secondCenterY - firstCenterY)
      )

      if (overlapX <= 0 || overlapY <= 0) continue

      didCollide = true
      if (overlapX < overlapY) {
        resolveAxis(
          first,
          second,
          'x',
          secondCenterX >= firstCenterX ? 1 : -1,
          overlapX,
        )
      } else {
        resolveAxis(
          first,
          second,
          'y',
          secondCenterY >= firstCenterY ? 1 : -1,
          overlapY,
        )
      }
    }
  }

  return didCollide
}
