import type { RootState } from '@react-three/fiber'

/**
 * Shader error checks query program status synchronously on first use, which
 * blocks the main thread until the GPU finishes compiling. Keep them for local
 * development and skip them in the shipped build.
 */
export function configureSceneRenderer({ gl }: RootState): void {
  gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production'
}
