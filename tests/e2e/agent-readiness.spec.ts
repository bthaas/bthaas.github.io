import { expect, test } from '@playwright/test'

// HTTP-level checks run once; they exercise the same gateway code as the Cloudflare Worker.
test.beforeEach(({ browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'Protocol checks do not depend on the engine.')
})

test('negotiates Markdown on the homepage and keeps HTML for browsers', async ({ request }) => {
  const markdown = await request.get('/', { headers: { Accept: 'text/markdown' } })
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()['content-type']).toBe('text/markdown; charset=utf-8')
  expect(markdown.headers().vary).toMatch(/\bAccept\b/)
  expect(await markdown.text()).toMatch(/^# Brett Haas\n/)

  const html = await request.get('/', { headers: { Accept: 'text/html' } })
  expect(html.status()).toBe(200)
  expect(html.headers()['content-type']).toBe('text/html; charset=utf-8')
  expect(html.headers().vary).toMatch(/\bAccept\b/)
  expect(await html.text()).toContain('<h1')
})

test('honors q-values and rejects unsupported types with 406', async ({ request }) => {
  const preferHtml = await request.get('/experience', {
    headers: { Accept: 'text/markdown;q=0.5, text/html' },
  })
  expect(preferHtml.headers()['content-type']).toContain('text/html')

  const unsupported = await request.get('/experience', { headers: { Accept: 'application/pdf' } })
  expect(unsupported.status()).toBe(406)
  expect(await unsupported.text()).toContain('text/markdown')
})

test('returns an agent-friendly Markdown 404', async ({ request }) => {
  const response = await request.get('/__ora-404-probe-7i885cee', {
    headers: { Accept: 'text/markdown' },
  })
  const body = await response.text()

  expect(response.status()).toBe(404)
  expect(response.headers()['content-type']).toBe('text/markdown; charset=utf-8')
  expect(response.headers().vary).toMatch(/\bAccept\b/)
  expect(body.length).toBeGreaterThan(20)
  expect(body).toContain('/llms.txt)')
})

test('publishes llms.txt whose every Markdown link resolves', async ({ request, baseURL }) => {
  const llms = await request.get('/llms.txt')
  const text = await llms.text()
  expect(llms.status()).toBe(200)
  expect(text).toMatch(/^# Brett Haas\n\n> /)
  expect(text).toContain('**When to use this site.**')

  const links = [...text.matchAll(/\]\((https:\/\/www\.bretthaas\.com\/[^)]+\.md)\)/g)]
    .map(([, href]) => href.replace('https://www.bretthaas.com', baseURL ?? ''))
  expect(links.length).toBeGreaterThanOrEqual(10)
  for (const link of links) {
    const response = await request.get(link)
    expect(response.status(), link).toBe(200)
    expect(response.headers()['content-type'], link).toBe('text/markdown; charset=utf-8')
  }
})

test('serves trust pages with substantial server-rendered content', async ({ request }) => {
  for (const path of ['/about', '/contact', '/privacy']) {
    const response = await request.get(path, { headers: { Accept: 'text/html' } })
    const text = (await response.text())
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
    expect(response.status(), path).toBe(200)
    expect(text.length, path).toBeGreaterThan(500)
  }
})

test('renders the trust pages and JSON-LD in the browser', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1, name: 'About Brett Haas' })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home' }),
  ).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible()

  await page.goto('/')
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
  const graph = (JSON.parse(jsonLd ?? '{}') as { '@graph': Array<{ '@type': string }> })['@graph']
  expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Person'])
})
