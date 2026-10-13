import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { createBrotliCompress, createGzip } from 'node:zlib'

import { importTypeScriptModule } from './import-typescript-module.mjs'

const root = resolve(process.cwd(), process.env.STATIC_ROOT ?? 'out')
const port = Number(process.env.PORT ?? 4173)
const compressibleType = /^(text\/|application\/(json|xml|javascript)|image\/svg\+xml)/
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
  ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml'],
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

/** Mirrors GitHub Pages: static files, extensionless HTML, and 404.html for misses. */
async function fetchStaticOrigin(request) {
  const { pathname } = new URL(request.url)
  const file = await resolveFile(pathname)
  const target = file ?? await resolveFile('/404.html')
  const status = file ? 200 : 404
  if (!target) {
    return new Response(request.method === 'HEAD' ? null : 'Not found', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      status,
    })
  }

  return new Response(request.method === 'HEAD' ? null : await readFile(target), {
    headers: {
      'cache-control': pathname.startsWith('/static-v1/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
      'content-type': contentTypes.get(extname(target).toLowerCase()) ?? 'application/octet-stream',
      vary: 'Accept-Encoding',
    },
    status,
  })
}

// The same gateway code that runs as the Cloudflare Worker in production.
const { createAgentGateway } = await importTypeScriptModule('edge/agent-gateway.ts')
const gateway = createAgentGateway(fetchStaticOrigin)

function toFetchRequest(request) {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  return new Request(new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`), {
    headers,
    method: request.method,
  })
}

function sendResponse(request, response, gatewayResponse) {
  const { 'content-length': contentLength, ...headers } = Object.fromEntries(gatewayResponse.headers)
  const accepts = request.headers['accept-encoding'] ?? ''
  const compressible = compressibleType.test(headers['content-type'] ?? '')
  const body = gatewayResponse.body ? Readable.fromWeb(gatewayResponse.body) : null

  if (body && compressible && accepts.includes('br')) {
    response.writeHead(gatewayResponse.status, { ...headers, 'content-encoding': 'br' })
    body.pipe(createBrotliCompress()).pipe(response)
  } else if (body && compressible && accepts.includes('gzip')) {
    response.writeHead(gatewayResponse.status, { ...headers, 'content-encoding': 'gzip' })
    body.pipe(createGzip()).pipe(response)
  } else {
    const identityHeaders = contentLength ? { ...headers, 'content-length': contentLength } : headers
    response.writeHead(gatewayResponse.status, identityHeaders)
    if (body) body.pipe(response)
    else response.end()
  }
}

const server = createServer(async (request, response) => {
  try {
    sendResponse(request, response, await gateway(toFetchRequest(request)))
  } catch (error) {
    process.stderr.write(`Failed to serve ${request.url}: ${error instanceof Error ? error.stack : error}\n`)
    if (!response.headersSent) response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Internal server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static export listening at http://127.0.0.1:${port}\n`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
