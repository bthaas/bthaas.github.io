import { build } from 'esbuild'

/**
 * Bundles a dependency-free TypeScript entry point (resolving the `@/` alias
 * from tsconfig) and imports it, so Node scripts can share app modules.
 */
export async function importTypeScriptModule(entryPoint) {
  const { outputFiles } = await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: 'esm',
    logLevel: 'silent',
    platform: 'neutral',
    target: ['es2022'],
    write: false,
  })
  const source = Buffer.from(outputFiles[0].text).toString('base64')
  return import(`data:text/javascript;base64,${source}`)
}
