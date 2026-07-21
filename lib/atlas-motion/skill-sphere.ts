export interface SphereVector {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface SphereProjection {
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly opacity: number
  readonly z: number
}

export interface MutableSphereProjection {
  x: number
  y: number
  scale: number
  opacity: number
  z: number
}

export type SkillSphereEdgeKind = 'cap' | 'latitude' | 'meridian'

export interface SkillSphereWireframeEdge {
  readonly column: number | null
  readonly control: SphereVector
  readonly from: number
  readonly kind: SkillSphereEdgeKind
  readonly row: number | null
  readonly to: number
}

export interface SkillSphereWireframe {
  readonly bottomCapStartIndex: number
  readonly columnCount: number
  readonly edges: readonly SkillSphereWireframeEdge[]
  readonly nodes: readonly SphereVector[]
  readonly points: readonly SphereVector[]
  readonly rowCount: number
  readonly topCapStartIndex: number
}

export const MAX_SKILL_SPHERE_PITCH = 1.5

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const MIN_SCALE = 0.55
const MIN_OPACITY = 0.3
const WIREFRAME_CAP_LATITUDE = 1.34
const WIREFRAME_MAX_LATITUDE = 0.68
const WIREFRAME_ROW_TWIST = 0.075

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
)

export function fibonacciSphere(count: number): readonly SphereVector[] {
  const total = Math.max(0, Math.floor(count))
  if (total === 0) return []

  return Array.from({ length: total }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / total
    const latitudeRadius = Math.sqrt(Math.max(0, 1 - y * y))
    const angle = index * GOLDEN_ANGLE
    return {
      x: Math.cos(angle) * latitudeRadius,
      y,
      z: Math.sin(angle) * latitudeRadius,
    }
  })
}

const greatestCommonDivisor = (left: number, right: number): number => {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

/** Returns catalog indices in a deterministic, visually dispersed slot order. */
export function spreadSkillSphereOrder(count: number): readonly number[] {
  const total = Math.max(0, Math.floor(count))
  if (total === 0) return []

  let stride = Math.max(2, Math.floor(total * 0.4))
  while (stride < total && greatestCommonDivisor(stride, total) !== 1) stride += 1
  if (stride >= total) stride = 1

  const order = Array.from({ length: total }, () => 0)
  for (let catalogIndex = 0; catalogIndex < total; catalogIndex += 1) {
    order[(catalogIndex * stride) % total] = catalogIndex
  }
  return order
}

function pointOnSphere(latitude: number, longitude: number): SphereVector {
  const latitudeRadius = Math.cos(latitude)
  return {
    x: Math.cos(longitude) * latitudeRadius,
    y: Math.sin(latitude),
    z: Math.sin(longitude) * latitudeRadius,
  }
}

/**
 * Builds a latitude/meridian mesh whose row-major intersections are skill
 * positions. The small row twist prevents rear chips from perfectly hiding
 * their front-side partners while keeping each meridian visually continuous.
 */
export function createSkillSphereWireframe(
  columnCount: number,
  rowCount: number,
): SkillSphereWireframe {
  const columns = Math.floor(columnCount)
  const rows = Math.floor(rowCount)
  if (columns < 3 || rows < 2) {
    throw new RangeError('A skill sphere needs at least three meridians and two latitude rings.')
  }

  const longitudeStep = (Math.PI * 2) / columns
  const latitudeStep = (WIREFRAME_MAX_LATITUDE * 2) / (rows - 1)
  const latitudeFor = (row: number) => WIREFRAME_MAX_LATITUDE - row * latitudeStep
  const longitudeFor = (row: number, column: number) => (
    column * longitudeStep + (row - (rows - 1) / 2) * WIREFRAME_ROW_TWIST
  )
  const indexFor = (row: number, column: number) => row * columns + column
  const points: SphereVector[] = []

  for (let row = 0; row < rows; row += 1) {
    const latitude = latitudeFor(row)
    for (let column = 0; column < columns; column += 1) {
      points.push(pointOnSphere(latitude, longitudeFor(row, column)))
    }
  }

  const topCapStartIndex = points.length
  const topCap = Array.from({ length: columns }, (_, column) => (
    pointOnSphere(WIREFRAME_CAP_LATITUDE, longitudeFor(0, column))
  ))
  const bottomCapStartIndex = topCapStartIndex + columns
  const bottomCap = Array.from({ length: columns }, (_, column) => (
    pointOnSphere(-WIREFRAME_CAP_LATITUDE, longitudeFor(rows - 1, column))
  ))
  const nodes: SphereVector[] = [...points, ...topCap, ...bottomCap]
  const edges: SkillSphereWireframeEdge[] = []

  for (let row = 0; row < rows; row += 1) {
    const latitude = latitudeFor(row)
    for (let column = 0; column < columns; column += 1) {
      edges.push({
        column: null,
        control: pointOnSphere(latitude, longitudeFor(row, column + 0.5)),
        from: indexFor(row, column),
        kind: 'latitude',
        row,
        to: indexFor(row, (column + 1) % columns),
      })
    }
  }

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows - 1; row += 1) {
      edges.push({
        column,
        control: pointOnSphere(
          (latitudeFor(row) + latitudeFor(row + 1)) / 2,
          (longitudeFor(row, column) + longitudeFor(row + 1, column)) / 2,
        ),
        from: indexFor(row, column),
        kind: 'meridian',
        row: null,
        to: indexFor(row + 1, column),
      })
    }

    const topLongitude = longitudeFor(0, column)
    const bottomLongitude = longitudeFor(rows - 1, column)
    edges.push({
      column,
      control: pointOnSphere(
        (WIREFRAME_CAP_LATITUDE + latitudeFor(0)) / 2,
        topLongitude,
      ),
      from: topCapStartIndex + column,
      kind: 'meridian',
      row: null,
      to: indexFor(0, column),
    })
    edges.push({
      column,
      control: pointOnSphere(
        (-WIREFRAME_CAP_LATITUDE + latitudeFor(rows - 1)) / 2,
        bottomLongitude,
      ),
      from: indexFor(rows - 1, column),
      kind: 'meridian',
      row: null,
      to: bottomCapStartIndex + column,
    })
  }

  for (let column = 0; column < columns; column += 1) {
    const nextColumn = (column + 1) % columns
    edges.push({
      column: null,
      control: pointOnSphere(
        WIREFRAME_CAP_LATITUDE,
        longitudeFor(0, column + 0.5),
      ),
      from: topCapStartIndex + column,
      kind: 'cap',
      row: null,
      to: topCapStartIndex + nextColumn,
    })
    edges.push({
      column: null,
      control: pointOnSphere(
        -WIREFRAME_CAP_LATITUDE,
        longitudeFor(rows - 1, column + 0.5),
      ),
      from: bottomCapStartIndex + column,
      kind: 'cap',
      row: null,
      to: bottomCapStartIndex + nextColumn,
    })
  }

  return {
    bottomCapStartIndex,
    columnCount: columns,
    edges,
    nodes,
    points,
    rowCount: rows,
    topCapStartIndex,
  }
}

export function rotatePoint(
  point: SphereVector,
  yaw: number,
  pitch: number,
): SphereVector {
  const yawCosine = Math.cos(yaw)
  const yawSine = Math.sin(yaw)
  const pitchCosine = Math.cos(pitch)
  const pitchSine = Math.sin(pitch)
  const yawX = point.x * yawCosine + point.z * yawSine
  const yawZ = -point.x * yawSine + point.z * yawCosine

  return {
    x: yawX,
    y: point.y * pitchCosine - yawZ * pitchSine,
    z: point.y * pitchSine + yawZ * pitchCosine,
  }
}

export function projectPoint(
  point: SphereVector,
  radius: number,
  size: number,
): SphereProjection {
  const depth = clamp((point.z + 1) / 2, 0, 1)
  return {
    x: size / 2 + point.x * radius,
    y: size / 2 + point.y * radius,
    scale: MIN_SCALE + (1 - MIN_SCALE) * depth,
    opacity: MIN_OPACITY + (1 - MIN_OPACITY) * depth,
    z: Math.round(depth * 200),
  }
}

export function projectSpherePointInto(
  point: SphereVector,
  yaw: number,
  pitch: number,
  radius: number,
  centerX: number,
  centerY: number,
  target: MutableSphereProjection,
): MutableSphereProjection {
  const yawCosine = Math.cos(yaw)
  const yawSine = Math.sin(yaw)
  const pitchCosine = Math.cos(pitch)
  const pitchSine = Math.sin(pitch)
  const rotatedX = point.x * yawCosine + point.z * yawSine
  const yawZ = -point.x * yawSine + point.z * yawCosine
  const rotatedY = point.y * pitchCosine - yawZ * pitchSine
  const rotatedZ = point.y * pitchSine + yawZ * pitchCosine
  const depth = clamp((rotatedZ + 1) / 2, 0, 1)

  target.x = centerX + rotatedX * radius
  target.y = centerY + rotatedY * radius
  target.scale = MIN_SCALE + (1 - MIN_SCALE) * depth
  target.opacity = MIN_OPACITY + (1 - MIN_OPACITY) * depth
  target.z = Math.round(depth * 200)
  return target
}

export function clampPitch(pitch: number): number {
  return clamp(pitch, -MAX_SKILL_SPHERE_PITCH, MAX_SKILL_SPHERE_PITCH)
}

export function decayVelocity(
  velocity: number,
  idleFloor = 0,
  decay = 0.95,
  idleEase = 0.08,
): number {
  if (idleFloor === 0) {
    const decayed = velocity * decay
    return Math.abs(decayed) < 0.00001 ? 0 : decayed
  }

  if (velocity > idleFloor) return Math.max(idleFloor, velocity * decay)
  if (velocity === idleFloor) return idleFloor
  return velocity + (idleFloor - velocity) * idleEase
}
