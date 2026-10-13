import { afterEach, describe, expect, it, vi } from 'vitest'

import worker from './worker'

describe('agent gateway worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('negotiates through the global fetch to the origin', async () => {
    const fetchMock = vi.fn(async () => new Response('# Brett Haas\n', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(new Request('https://www.bretthaas.com/', {
      headers: { accept: 'text/markdown' },
    }))

    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(new URL((fetchMock.mock.calls[0] as unknown as [Request])[0].url).pathname)
      .toBe('/index.html.md')
  })

  it('falls back to the untouched origin response when negotiation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response('<h1>Brett Haas</h1>', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(new Request('https://www.bretthaas.com/', {
      headers: { accept: 'text/markdown' },
    }))

    expect(await response.text()).toBe('<h1>Brett Haas</h1>')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalledWith(
      'agent gateway failed',
      'https://www.bretthaas.com/',
      expect.any(Error),
    )
  })
})
