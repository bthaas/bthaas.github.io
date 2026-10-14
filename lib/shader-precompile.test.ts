import type { Camera, Material, Object3D, Scene } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { precompileShaders } from './shader-precompile'

function createRenderer(programs: Map<Material, { isReady: () => boolean } | undefined>) {
  const records = new Map<Material, unknown>(
    [...programs].map(([material, program]) => [material, program ? { currentProgram: program } : {}]),
  )
  return {
    compile: vi.fn(() => new Set(programs.keys())),
    properties: { get: vi.fn((material: unknown) => records.get(material as Material) ?? {}) },
    records,
  }
}

const object = {} as Object3D
const camera = {} as Camera
const scene = {} as Scene

describe('precompileShaders', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves once every compiled program reports ready', async () => {
    const material = {} as Material
    let linked = false
    const renderer = createRenderer(new Map([[material, { isReady: () => linked }]]))
    const resolved = vi.fn()

    precompileShaders(renderer as never, object, camera, scene).ready.then(resolved)
    await vi.advanceTimersByTimeAsync(50)
    expect(resolved).not.toHaveBeenCalled()

    linked = true
    await vi.advanceTimersByTimeAsync(10)
    expect(resolved).toHaveBeenCalledOnce()
    expect(renderer.compile).toHaveBeenCalledWith(object, camera, scene)
  })

  it('stops polling after cancel so an unmounted scene cannot be touched', async () => {
    const material = {} as Material
    const renderer = createRenderer(new Map([[material, { isReady: () => false }]]))

    const compile = precompileShaders(renderer as never, object, camera, scene)
    const readsBeforeCancel = renderer.properties.get.mock.calls.length
    compile.cancel()
    await vi.advanceTimersByTimeAsync(100)

    expect(renderer.properties.get).toHaveBeenCalledTimes(readsBeforeCancel)
  })

  it('treats a disposed material as settled instead of throwing', async () => {
    const material = {} as Material
    const renderer = createRenderer(new Map([[material, { isReady: () => false }]]))
    const resolved = vi.fn()

    precompileShaders(renderer as never, object, camera, scene).ready.then(resolved)
    renderer.records.set(material, {})
    await vi.advanceTimersByTimeAsync(10)

    expect(resolved).toHaveBeenCalledOnce()
  })
})
