import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'

import { importTypeScriptModule } from './import-typescript-module.mjs'

const outputRoot = resolve(process.cwd(), 'out')
const prefixedRoot = resolve(outputRoot, 'static-v1')

await rm(prefixedRoot, { force: true, recursive: true })
await mkdir(prefixedRoot, { recursive: true })
await cp(resolve(outputRoot, '_next'), resolve(prefixedRoot, '_next'), {
  recursive: true,
})

// llms.txt and one Markdown twin per page, served beside the HTML export.
const { createAgentReadableFiles } = await importTypeScriptModule('lib/agent-readable/index.ts')
for (const { path, content } of createAgentReadableFiles()) {
  const target = resolve(outputRoot, `.${path}`)
  if (!target.startsWith(`${outputRoot}${sep}`)) {
    throw new Error(`Refusing to write agent file outside out/: ${path}`)
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content, 'utf8')
}
