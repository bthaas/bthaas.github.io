import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { createBrotliCompress, createGzip } from 'node:zlib'

const root = resolve(process.cwd(), process.env.STATIC_ROOT ?? 'out')
const port = Number(process.env.PORT ?? 4173)
const compressible = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml'])
const contentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
])

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/\0/g, '')
  const candidate = resolve(root, `.${decoded}`)
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null
  return candidate
}

async function resolveFile(pathname) {
  const initial = safePath(pathname)
  if (!initial) return null
  const candidates = pathname.endsWith('/')
    ? [resolve(initial, 'index.html')]
    : [initial, `${initial}.html`, resolve(initial, 'index.html')]

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // Try the next static-export shape.
    }
  }
  return null
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  const file = await resolveFile(pathname)
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Not found')
    return
  }

  const extension = extname(file).toLowerCase()
  const headers = {
    'cache-control': pathname.startsWith('/static-v1/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
    'content-type': contentTypes.get(extension) ?? 'application/octet-stream',
    vary: 'Accept-Encoding',
  }
  const accepts = request.headers['accept-encoding'] ?? ''
  const source = createReadStream(file)

  if (compressible.has(extension) && accepts.includes('br')) {
    response.writeHead(200, { ...headers, 'content-encoding': 'br' })
    source.pipe(createBrotliCompress()).pipe(response)
  } else if (compressible.has(extension) && accepts.includes('gzip')) {
    response.writeHead(200, { ...headers, 'content-encoding': 'gzip' })
    source.pipe(createGzip()).pipe(response)
  } else {
    response.writeHead(200, headers)
    source.pipe(response)
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static export listening at http://127.0.0.1:${port}\n`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}

