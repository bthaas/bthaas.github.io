import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const scriptPreloadPattern = /<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="script")[^>]*\/?>(?:<\/link>)?/gi
const atlasScriptSourcePattern = /\bsrc=(['"])\/atlas\.js(?:\?v=[^'"]+)?\1/i
const horizonScriptSourcePattern = /\bsrc=(['"])\/horizon\.js(?:\?v=[^'"]+)?\1/i
const atlasBudgetBytes = 100 * 1024
const horizonBudgetBytes = 220 * 1024

export function getAtlasScriptSource(source) {
  const version = createHash('sha256').update(source).digest('hex').slice(0, 12)
  return `/atlas.js?v=${version}`
}

export function getHorizonScriptSource(source) {
  const version = createHash('sha256').update(source).digest('hex').slice(0, 12)
  return `/horizon.js?v=${version}`
}

const createAtlasScriptTag = (source) => `<script src="${source}" defer></script>`

export function stripStaticRuntime(
  source,
  atlasScriptSource = '/atlas.js',
  horizonScriptSource,
) {
  let atlasScriptKept = false
  let horizonScriptKept = false
  const stripped = source.replace(scriptPreloadPattern, '').replace(scriptPattern, (script) => {
    if (!atlasScriptKept && atlasScriptSourcePattern.test(script)) {
      atlasScriptKept = true
      return script.replace(
        atlasScriptSourcePattern,
        (_source, quote) => `src=${quote}${atlasScriptSource}${quote}`,
      )
    }
    if (!horizonScriptKept && horizonScriptSourcePattern.test(script)) {
      horizonScriptKept = true
      if (!horizonScriptSource) return script
      return script.replace(
        horizonScriptSourcePattern,
        (_source, quote) => `src=${quote}${horizonScriptSource}${quote}`,
      )
    }
    return ''
  })

  if (atlasScriptKept) return stripped
  const atlasScriptTag = createAtlasScriptTag(atlasScriptSource)
  if (/<\/body>/i.test(stripped)) {
    return stripped.replace(/<\/body>/i, `${atlasScriptTag}</body>`)
  }
  return `${stripped}${atlasScriptTag}`
}

export function assertAtlasBudget(gzipBytes) {
  if (gzipBytes > atlasBudgetBytes) {
    throw new Error(`atlas.js is ${gzipBytes} bytes gzip; the limit is 100 KiB`)
  }
}

export function assertHorizonBudget(gzipBytes) {
  if (gzipBytes > horizonBudgetBytes) {
    throw new Error(`horizon.js is ${gzipBytes} bytes gzip; the limit is 220 KiB`)
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

export async function processStaticExport(exportDirectory, atlasPath, horizonPath) {
  const atlasSource = await readFile(atlasPath)
  const horizonSource = await readFile(horizonPath)
  const gzipBytes = gzipSync(atlasSource).byteLength
  const horizonGzipBytes = gzipSync(horizonSource).byteLength
  const atlasScriptSource = getAtlasScriptSource(atlasSource)
  const horizonScriptSource = getHorizonScriptSource(horizonSource)
  assertAtlasBudget(gzipBytes)
  assertHorizonBudget(horizonGzipBytes)

  const htmlFiles = await collectHtmlFiles(exportDirectory)
  for (const file of htmlFiles) {
    const source = await readFile(file, 'utf8')
    await writeFile(file, stripStaticRuntime(source, atlasScriptSource, horizonScriptSource))
  }

  return {
    atlasScriptSource,
    gzipBytes,
    horizonGzipBytes,
    horizonScriptSource,
    htmlFiles,
  }
}

/* v8 ignore start -- the CLI wrapper is exercised by every production build. */
async function main() {
  const exportDirectory = fileURLToPath(new URL('../out/', import.meta.url))
  const atlasPath = fileURLToPath(new URL('../public/atlas.js', import.meta.url))
  const horizonPath = fileURLToPath(new URL('../public/horizon.js', import.meta.url))
  const {
    atlasScriptSource,
    gzipBytes,
    horizonGzipBytes,
    horizonScriptSource,
    htmlFiles,
  } = await processStaticExport(
    exportDirectory,
    atlasPath,
    horizonPath,
  )

  console.log(
    `Ensured ${atlasScriptSource} (${gzipBytes} bytes gzip) and lazy ${horizonScriptSource} (${horizonGzipBytes} bytes gzip); removed the framework runtime from ${htmlFiles.length} static HTML files.`,
  )
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isDirectRun) await main()
/* v8 ignore stop */
