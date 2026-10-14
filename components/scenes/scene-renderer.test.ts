import type { RootState } from '@react-three/fiber'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureSceneRenderer } from './scene-renderer'

function createState(): RootState {
  return { gl: { debug: { checkShaderErrors: true } } } as unknown as RootState
}

describe('configureSceneRenderer', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('skips synchronous shader status checks in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const state = createState()

    configureSceneRenderer(state)

    expect(state.gl.debug.checkShaderErrors).toBe(false)
  })

  it('keeps shader diagnostics during development and tests', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const state = createState()

    configureSceneRenderer(state)

    expect(state.gl.debug.checkShaderErrors).toBe(true)
  })
})
