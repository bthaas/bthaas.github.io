import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const exportDirectory = fileURLToPath(new URL('../out/', import.meta.url))
const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const scriptPreloadPattern = /<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="script")[^>]*\/?>(?:<\/link>)?/gi

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

const htmlFiles = await collectHtmlFiles(exportDirectory)

for (const file of htmlFiles) {
  const source = await readFile(file, 'utf8')
  const staticHtml = source.replace(scriptPreloadPattern, '').replace(scriptPattern, '')
  await writeFile(file, staticHtml)
}

console.log(`Removed the unused client runtime from ${htmlFiles.length} static HTML files.`)
