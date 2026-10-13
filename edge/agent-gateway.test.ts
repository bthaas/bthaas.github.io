import { describe, expect, it, vi } from 'vitest'

import {
  appendHeaderTokens,
  createAgentGateway,
  MARKDOWN_CONTENT_TYPE,
  type OriginFetch,
  renderMarkdownNotFound,
} from './agent-gateway'

const ORIGIN = 'https://www.bretthaas.com'

/** In-memory stand-in for GitHub Pages: known files, otherwise 404.html. */
const files: Readonly<Record<string, { body: string; type: string }>> = {
  '/': { body: '<h1>Brett Haas</h1>', type: 'text/html; charset=utf-8' },
  '/index.html.md': { body: '# Brett Haas\n', type: 'application/octet-stream' },
  '/experience': { body: '<h1>Experience</h1>', type: 'text/html; charset=utf-8' },
  '/experience.md': { body: '# Experience\n', type: 'text/markdown; charset=utf-8' },
  '/nicotine/': { body: '<h1>PouchLess</h1>', type: 'text/html; charset=utf-8' },
  '/llms.txt': { body: '# Brett Haas\n', type: 'text/plain; charset=utf-8' },
  '/static-v1/app.js': { body: 'console.info(1)', type: 'text/javascript' },
}

function createOrigin(): OriginFetch & ReturnType<typeof vi.fn> {
  return vi.fn(async (request: Request) => {
    const { pathname } = new URL(request.url)
    const file = files[pathname]
    const headers = {
      'cache-control': 'max-age=600',
      'content-type': file?.type ?? 'text/html; charset=utf-8',
      etag: `"${pathname}"`,
      vary: 'Accept-Encoding',
    }
    if (request.headers.get('if-none-match') === `"${pathname}"`) {
      return new Response(null, { headers, status: 304 })
    }
    const body = request.method === 'HEAD' ? null : (file?.body ?? '<h1>Missing plate</h1>')
    return new Response(body, { headers, status: file ? 200 : 404 })
  })
}

function get(path: string, accept?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers)
  if (accept !== undefined) headers.set('accept', accept)
  return new Request(`${ORIGIN}${path}`, { ...init, headers })
}

async function serve(request: Request, origin = createOrigin()) {
  const response = await createAgentGateway(origin)(request)
  return { origin, response, body: await response.text() }
}

describe('appendHeaderTokens', () => {
  it('adds tokens once, case-insensitively, preserving existing ones', () => {
    expect(appendHeaderTokens(null, ['Accept'])).toBe('Accept')
    expect(appendHeaderTokens('Accept-Encoding', ['Accept'])).toBe('Accept-Encoding, Accept')
    expect(appendHeaderTokens('accept, Origin', ['Accept'])).toBe('accept, Origin')
  })
})

describe('agent gateway', () => {
  it('serves the homepage Markdown twin for Accept: text/markdown', async () => {
    const { origin, response, body } = await serve(get('/', 'text/markdown'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept')
    expect(response.headers.get('link')).toBe(`<${ORIGIN}/>; rel="canonical"`)
    expect(response.headers.get('cache-control')).toBe('max-age=600')
    expect(body).toBe('# Brett Haas\n')
    expect(new URL(origin.mock.calls[0][0].url).pathname).toBe('/index.html.md')
  })

  it('keeps serving HTML, with Vary: Accept, to browsers and clients without a preference', async () => {
    for (const accept of ['text/html', 'text/html,application/xhtml+xml,*/*;q=0.8', undefined]) {
      const { response, body } = await serve(get('/experience', accept))

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept')
      expect(body).toBe('<h1>Experience</h1>')
    }
  })

  it('honors q-values when choosing between HTML and Markdown', async () => {
    const markdown = await serve(get('/experience', 'text/markdown, text/html;q=0.5'))
    const html = await serve(get('/experience', 'text/markdown;q=0.5, text/html'))

    expect(markdown.body).toBe('# Experience\n')
    expect(html.body).toBe('<h1>Experience</h1>')
    expect(html.response.headers.get('vary')).toContain('Accept')
  })

  it('returns a Markdown 404 that points agents to llms.txt for missing pages', async () => {
    const { response, body } = await serve(get('/__ora-404-probe-7i885cee', 'text/markdown'))

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(response.headers.get('vary')).toBe('Accept')
    expect(body).toBe(renderMarkdownNotFound(ORIGIN))
    expect(body).toContain(`(${ORIGIN}/llms.txt)`)
    expect(body).toContain(`(${ORIGIN}/sitemap.xml)`)
  })

  it('keeps the themed HTML 404 for browsers', async () => {
    const { response, body } = await serve(get('/missing', 'text/html'))

    expect(response.status).toBe(404)
    expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept')
    expect(body).toBe('<h1>Missing plate</h1>')
  })

  it('answers 406 with the available types when nothing acceptable exists', async () => {
    const { response, body } = await serve(get('/experience', 'application/pdf'))

    expect(response.status).toBe(406)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('vary')).toBe('Accept')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(body).toContain('application/pdf')
    expect(body).toContain('- text/html\n- text/markdown')
  })

  it('answers 406 listing only HTML when a Markdown-only client asks for a page without a twin', async () => {
    const { response, body } = await serve(get('/nicotine/', 'text/markdown'))

    expect(response.status).toBe(406)
    expect(body).toContain('- text/html\n')
    expect(body).not.toContain('- text/markdown')
  })

  it('falls back to HTML for a page without a Markdown twin when HTML is acceptable', async () => {
    const { response, body } = await serve(get('/nicotine/', 'text/markdown, text/html;q=0.5'))

    expect(response.status).toBe(200)
    expect(body).toBe('<h1>PouchLess</h1>')
    expect(response.headers.get('vary')).toContain('Accept')
  })

  it('returns a 404, not a 406, for a missing page with an unsupported Accept', async () => {
    const { response } = await serve(get('/missing', 'application/pdf'))

    expect(response.status).toBe(404)
  })

  it('answers HEAD requests with negotiated headers and no body', async () => {
    const markdown = await serve(get('/', 'text/markdown', { method: 'HEAD' }))
    const missing = await serve(get('/missing', 'text/markdown', { method: 'HEAD' }))

    expect(markdown.response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(markdown.body).toBe('')
    expect(missing.response.status).toBe(404)
    expect(missing.body).toBe('')
  })

  it('passes conditional 304 responses through for both representations', async () => {
    const markdown = await serve(get('/', 'text/markdown', {
      headers: { 'if-none-match': '"/index.html.md"' },
    }))
    const html = await serve(get('/', 'text/html', { headers: { 'if-none-match': '"/"' } }))

    expect(markdown.response.status).toBe(304)
    expect(markdown.response.headers.get('vary')).toContain('Accept')
    expect(html.response.status).toBe(304)
    expect(html.response.headers.get('vary')).toContain('Accept')
  })

  it('labels direct .md requests as Markdown with a canonical link to the page', async () => {
    const { response, body } = await serve(get('/index.html.md'))

    expect(response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(response.headers.get('link')).toBe(`<${ORIGIN}/>; rel="canonical"`)
    expect(response.headers.get('vary')).toBe('Accept-Encoding')
    expect(body).toBe('# Brett Haas\n')
  })

  it('returns a Markdown 404 for missing .md files only when Markdown is preferred', async () => {
    const markdown = await serve(get('/missing.md', 'text/markdown'))
    const html = await serve(get('/missing.md', 'text/html'))

    expect(markdown.response.status).toBe(404)
    expect(markdown.response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(html.response.status).toBe(404)
    expect(html.body).toBe('<h1>Missing plate</h1>')
  })

  it('never lets a scheme-relative path redirect origin fetches to another host', async () => {
    const origin = createOrigin()
    const gateway = createAgentGateway(origin)
    const smuggled = await gateway(get('//example.com/foo', 'text/markdown'))
    const bare = await gateway(get('//', 'text/markdown'))

    const fetched = origin.mock.calls.map(([request]) => new URL(request.url))
    expect(fetched.every(({ host }) => host === 'www.bretthaas.com')).toBe(true)
    expect(fetched[0].pathname).toBe('//example.com/foo.md')
    expect(smuggled.status).toBe(404)
    expect(smuggled.headers.get('link')).toBeNull()
    expect(bare.status).toBe(404)
  })

  it('passes origin errors for the Markdown twin through instead of answering 406', async () => {
    const origin = vi.fn(async (request: Request) => (
      new URL(request.url).pathname.endsWith('.md')
        ? new Response('busy', { headers: { 'retry-after': '5' }, status: 503 })
        : new Response('<h1>Experience</h1>', { status: 200 })
    ))
    const { response, body } = await serve(get('/experience', 'text/markdown'), origin)

    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('5')
    expect(response.headers.get('vary')).toBe('Accept')
    expect(body).toBe('busy')
  })

  it('points the canonical link at the clean page URL for .html requests', async () => {
    const { response } = await serve(get('/index.html', 'text/markdown'))

    expect(response.headers.get('link')).toBe(`<${ORIGIN}/>; rel="canonical"`)
  })

  it('varies missing .md responses on Accept and marks generated bodies nosniff', async () => {
    const html = await serve(get('/missing.md', 'text/html'))
    const markdown = await serve(get('/missing.md', 'text/markdown'))
    const unacceptable = await serve(get('/experience', 'application/pdf'))

    expect(html.response.headers.get('vary')).toBe('Accept-Encoding, Accept')
    expect(markdown.response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(unacceptable.response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('keeps Markdown labeling on conditional .md requests', async () => {
    const { response } = await serve(get('/experience.md', undefined, {
      headers: { 'if-none-match': '"/experience.md"' },
    }))

    expect(response.status).toBe(304)
    expect(response.headers.get('link')).toBe(`<${ORIGIN}/experience>; rel="canonical"`)
  })

  it('passes assets, machine-readable files, and non-GET requests through untouched', async () => {
    const origin = createOrigin()
    const gateway = createAgentGateway(origin)
    const asset = await gateway(get('/static-v1/app.js', 'text/markdown'))
    const llms = await gateway(get('/llms.txt', 'application/pdf'))
    const post = await gateway(get('/', 'text/markdown', { method: 'POST' }))

    expect(asset.headers.get('vary')).toBe('Accept-Encoding')
    expect(llms.status).toBe(200)
    expect(llms.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(post.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(origin).toHaveBeenCalledTimes(3)
  })
})
