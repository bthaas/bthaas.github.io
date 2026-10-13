import {
  getMarkdownPath,
  getPagePathForMarkdown,
  isMarkdownPath,
} from '../lib/agent-readable/markdown-paths'

import { MEDIA_TYPES, type Representation, selectRepresentation } from './content-negotiation'

/** Fetches from the static origin (GitHub Pages in production). */
export type OriginFetch = (request: Request) => Promise<Response>
export type AgentGateway = (request: Request) => Promise<Response>

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'
const NEGOTIATED_METHODS = new Set(['GET', 'HEAD'])

/** Adds tokens to a comma-separated header without duplicating existing ones. */
export function appendHeaderTokens(existing: string | null, tokens: readonly string[]): string {
  const current = (existing ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  const known = new Set(current.map((token) => token.toLowerCase()))
  const additions = tokens.filter((token) => !known.has(token.toLowerCase()))
  return [...current, ...additions].join(', ')
}

function withHeaders(
  response: Response,
  update: (headers: Headers) => void,
  status: number = response.status,
): Response {
  const headers = new Headers(response.headers)
  update(headers)
  const body = status === 304 ? null : response.body
  return new Response(body, { headers, status, statusText: response.statusText })
}

function varyOnAccept(response: Response): Response {
  return withHeaders(response, (headers) => {
    headers.set('vary', appendHeaderTokens(headers.get('vary'), ['Accept']))
  })
}

/**
 * Same-origin URL for a path. Assigning `pathname` (rather than resolving the
 * path as a relative URL) keeps `//host/...` paths from changing the host.
 */
function sameOriginUrl(url: URL, pathname: string): string {
  const target = new URL(url.href)
  target.pathname = pathname
  target.search = ''
  target.hash = ''
  return target.href
}

function canonicalLink(url: URL, pagePath: string): string {
  return `<${sameOriginUrl(url, pagePath)}>; rel="canonical"`
}

function asMarkdown(response: Response, url: URL, pagePath: string, negotiated: boolean): Response {
  return withHeaders(response, (headers) => {
    headers.set('content-type', MARKDOWN_CONTENT_TYPE)
    headers.set('link', canonicalLink(url, pagePath))
    if (negotiated) headers.set('vary', appendHeaderTokens(headers.get('vary'), ['Accept']))
  })
}

function textResponse(
  request: Request,
  body: string,
  status: number,
  headers: Readonly<Record<string, string>>,
): Response {
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: { ...headers, 'x-content-type-options': 'nosniff' },
    status,
  })
}

export function renderMarkdownNotFound(origin: string): string {
  return [
    '# Page not found',
    '',
    'There is no page at this address on Brett Haas’s portfolio (HTTP 404). The link may be outdated or mistyped.',
    '',
    '## Where to go next',
    '',
    `- [llms.txt](${origin}/llms.txt): Guide for AI agents with the Markdown version of every page.`,
    `- [Homepage](${origin}/index.html.md): Overview of Brett Haas and the portfolio sections.`,
    `- [Sitemap](${origin}/sitemap.xml): Canonical URLs for every page.`,
    '',
  ].join('\n')
}

function markdownNotFound(request: Request, url: URL): Response {
  return textResponse(request, renderMarkdownNotFound(url.origin), 404, {
    'cache-control': 'no-cache',
    'content-type': MARKDOWN_CONTENT_TYPE,
    vary: 'Accept',
  })
}

function notAcceptable(request: Request, available: readonly Representation[]): Response {
  const types = available.map((representation) => `- ${MEDIA_TYPES[representation]}`)
  const requested = request.headers.get('accept') ?? ''
  const body = [
    '406 Not Acceptable',
    '',
    `None of the requested types (${requested}) are available for this page.`,
    'Available representations:',
    ...types,
    '',
    'Retry with one of these types in the Accept header.',
    '',
  ].join('\n')
  return textResponse(request, body, 406, {
    'cache-control': 'no-store',
    'content-type': 'text/plain; charset=utf-8',
    vary: 'Accept',
  })
}

function originRequest(request: Request, url: URL, pathname: string): Request {
  return new Request(sameOriginUrl(url, pathname), {
    headers: request.headers,
    method: request.method,
    redirect: 'manual',
  })
}

function isServable(response: Response): boolean {
  return response.ok || response.status === 304
}

/** A twin that is absent (404 or redirect) falls back to HTML; origin errors pass through. */
function isMissing(response: Response): boolean {
  return response.status === 404 || (response.status >= 300 && response.status < 400)
}

async function fetchMarkdownVariant(
  request: Request,
  url: URL,
  markdownPath: string,
  fetchOrigin: OriginFetch,
): Promise<Response> {
  return fetchOrigin(originRequest(request, url, markdownPath))
}

async function negotiatePage(
  request: Request,
  url: URL,
  markdownPath: string,
  fetchOrigin: OriginFetch,
): Promise<Response> {
  const accept = request.headers.get('accept')
  const preferred = selectRepresentation(accept, ['html', 'markdown'])

  if (preferred === 'markdown') {
    const markdown = await fetchMarkdownVariant(request, url, markdownPath, fetchOrigin)
    const pagePath = getPagePathForMarkdown(markdownPath) ?? url.pathname
    if (isServable(markdown)) return asMarkdown(markdown, url, pagePath, true)
    if (!isMissing(markdown)) return varyOnAccept(markdown)
  }

  const page = await fetchOrigin(request)
  if (page.status === 404 && preferred === 'markdown') return markdownNotFound(request, url)
  if (!page.ok || preferred === 'html') return varyOnAccept(page)

  // The page exists, but the preferred representation is unavailable or nothing was acceptable.
  if (selectRepresentation(accept, ['html']) === 'html') return varyOnAccept(page)
  const hasMarkdown = preferred === null
    && isServable(await fetchMarkdownVariant(request, url, markdownPath, fetchOrigin))
  return notAcceptable(request, hasMarkdown ? ['html', 'markdown'] : ['html'])
}

/**
 * Serves each page's Markdown twin from the same URL when agents ask for
 * `text/markdown`, adds `Vary: Accept` to every negotiated response, returns a
 * Markdown 404 for missing pages, and answers 406 when nothing is acceptable.
 * Assets and non-GET/HEAD requests pass through untouched.
 */
export function createAgentGateway(fetchOrigin: OriginFetch): AgentGateway {
  return async (request) => {
    if (!NEGOTIATED_METHODS.has(request.method)) return fetchOrigin(request)

    const url = new URL(request.url)
    if (isMarkdownPath(url.pathname)) {
      const response = await fetchOrigin(request)
      const pagePath = getPagePathForMarkdown(url.pathname)
      if (isServable(response) && pagePath) return asMarkdown(response, url, pagePath, false)
      if (response.status !== 404) return response
      // A missing .md file is answered per Accept, so the 404 varies on it.
      const wantsMarkdown = selectRepresentation(
        request.headers.get('accept'),
        ['html', 'markdown'],
      ) === 'markdown'
      return wantsMarkdown ? markdownNotFound(request, url) : varyOnAccept(response)
    }

    const markdownPath = getMarkdownPath(url.pathname)
    if (!markdownPath) return fetchOrigin(request)
    return negotiatePage(request, url, markdownPath, fetchOrigin)
  }
}
