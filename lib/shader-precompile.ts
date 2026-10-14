import type { Camera, Material, Object3D, Scene, WebGLRenderer } from 'three'

const POLL_INTERVAL_MS = 10

interface CompilingProgram {
  readonly isReady: () => boolean
}

export interface ShaderPrecompile {
  readonly cancel: () => void
  readonly ready: Promise<void>
}

type PrecompileRenderer = Pick<WebGLRenderer, 'compile' | 'properties'>

function readProgram(renderer: PrecompileRenderer, material: Material): CompilingProgram | null {
  const record = renderer.properties.get(material)
  if (typeof record !== 'object' || record === null || !('currentProgram' in record)) return null
  const program = record.currentProgram
  if (typeof program !== 'object' || program === null || !('isReady' in program)) return null
  return typeof program.isReady === 'function' ? (program as CompilingProgram) : null
}

/**
 * Equivalent of `renderer.compileAsync()` that can be cancelled. Three's version
 * keeps polling material programs after the renderer or materials are disposed,
 * which throws from a timer when a scene unmounts mid-compile.
 */
export function precompileShaders(
  renderer: PrecompileRenderer,
  object: Object3D,
  camera: Camera,
  scene: Scene,
): ShaderPrecompile {
  const pending = new Set(renderer.compile(object, camera, scene))
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const ready = new Promise<void>((resolve) => {
    const check = () => {
      if (cancelled) return
      pending.forEach((material) => {
        const program = readProgram(renderer, material)
        // A disposed material has no program left to wait for.
        if (!program || program.isReady()) pending.delete(material)
      })
      if (pending.size === 0) resolve()
      else timer = setTimeout(check, POLL_INTERVAL_MS)
    }
    check()
  })

  return {
    cancel: () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    },
    ready,
  }
}
