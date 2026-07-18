import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const outputRoot = resolve(process.cwd(), 'out')
const prefixedRoot = resolve(outputRoot, 'static-v1')

await rm(prefixedRoot, { force: true, recursive: true })
await mkdir(prefixedRoot, { recursive: true })
await cp(resolve(outputRoot, '_next'), resolve(prefixedRoot, '_next'), {
  recursive: true,
})

