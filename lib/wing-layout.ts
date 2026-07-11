export type WingSide = 'left' | 'right'

export interface FeatherTransform {
  readonly id: number
  readonly side: WingSide
  readonly group: number
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
  readonly drift: readonly [number, number, number]
  readonly detached: boolean
  readonly hidden: boolean
  readonly phase: number
}

function seededValue(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

export function createWingLayout(perWing = 72): FeatherTransform[] {
  const feathers: FeatherTransform[] = []

  for (const side of ['left', 'right'] as const) {
    const direction = side === 'left' ? -1 : 1

    for (let index = 0; index < perWing; index += 1) {
      const row = index % 4
      const column = Math.floor(index / 4)
      const columns = Math.ceil(perWing / 4)
      const progress = columns <= 1 ? 0 : column / (columns - 1)
      const random = seededValue(index, side === 'left' ? 1 : 2)
      const group = Math.min(5, Math.floor(progress * 6))
      const brokenZone = side === 'right' && progress > 0.43
      const hidden = brokenZone && ((column + row * 2) % 9 === 0 || (column === 13 && row > 0))
      const detached = brokenZone && !hidden && (column + row) % 6 === 0
      const length = (2.2 - row * 0.28) * (1 - progress * 0.34)
      const sweep = Math.sin(progress * Math.PI * 0.9)
      const x = direction * (0.45 + progress * 5.7)
      const y = 0.25 + sweep * 1.72 - row * 0.42 - progress * 0.52
      const z = (row - 1.5) * 0.17 + (random - 0.5) * 0.16
      const angle = direction * (-0.2 - progress * 0.72) + (random - 0.5) * 0.08

      feathers.push({
        id: feathers.length,
        side,
        group,
        position: [x, y, z],
        rotation: [0.1 + row * 0.035, (random - 0.5) * 0.16, angle],
        scale: [0.44 - row * 0.045, length, 1],
        drift: [
          direction * (0.45 + group * 0.2 + random * 0.5),
          0.6 + random * 1.2 + group * 0.12,
          (random - 0.5) * 1.4,
        ],
        detached,
        hidden,
        phase: random * Math.PI * 2,
      })
    }
  }

  return feathers
}
