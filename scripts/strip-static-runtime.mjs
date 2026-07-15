import { gzipSync } from 'node:zlib'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const scriptPreloadPattern = /<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="script")[^>]*\/?>(?:<\/link>)?/gi
const atlasScriptSourcePattern = /\bsrc=(['"])\/atlas\.js\1/i
const atlasScriptTag = '<script src="/atlas.js" defer></script>'
const atlasBudgetBytes = 12 * 1024

export function stripStaticRuntime(source) {
  let atlasScriptKept = false
  const stripped = source.replace(scriptPreloadPattern, '').replace(scriptPattern, (script) => {
    if (!atlasScriptKept && atlasScriptSourcePattern.test(script)) {
      atlasScriptKept = true
      return script
    }
    return ''
  })

  if (atlasScriptKept) return stripped
  if (/<\/body>/i.test(stripped)) {
    return stripped.replace(/<\/body>/i, `${atlasScriptTag}</body>`)
  }
  return `${stripped}${atlasScriptTag}`
}

export function assertAtlasBudget(gzipBytes) {
  if (gzipBytes > atlasBudgetBytes) {
    throw new Error(`atlas.js is ${gzipBytes} bytes gzip; the limit is 12 KiB`)
  }
}

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(path)))
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(path)
  }

  return files
}

export async function processStaticExport(exportDirectory, atlasPath) {
  const atlasSource = await readFile(atlasPath)
  const gzipBytes = gzipSync(atlasSource).byteLength
  assertAtlasBudget(gzipBytes)

  const htmlFiles = await collectHtmlFiles(exportDirectory)
  for (const file of htmlFiles) {
    const source = await readFile(file, 'utf8')
    await writeFile(file, stripStaticRuntime(source))
  }

  return { gzipBytes, htmlFiles }
}

/* v8 ignore start -- the CLI wrapper is exercised by every production build. */
async function main() {
  const exportDirectory = fileURLToPath(new URL('../out/', import.meta.url))
  const atlasPath = fileURLToPath(new URL('../public/atlas.js', import.meta.url))
  const { gzipBytes, htmlFiles } = await processStaticExport(exportDirectory, atlasPath)

  console.log(
    `Ensured /atlas.js (${gzipBytes} bytes gzip) and removed the framework runtime from ${htmlFiles.length} static HTML files.`,
  )
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isDirectRun) await main()
/* v8 ignore stop */
