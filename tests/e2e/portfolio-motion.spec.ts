import { expect, test, type Page } from '@playwright/test'

function observeApplicationErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    const source = message.location().url
    if (message.type() === 'error' && (!source || source.startsWith('http://127.0.0.1:4173'))) {
      errors.push(`console: ${message.text()}`)
    }
  })
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) {
      errors.push(`response ${response.status()}: ${response.url()}`)
    }
  })
  return errors
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1)
}

test('ships clean cross-browser choreography and an accessible dossier', async ({
  isMobile,
  page,
}) => {
  const errors = observeApplicationErrors(page)
  await page.goto('/', { waitUntil: 'networkidle' })

  await expect(page.locator('script[src*="/_next/static/"]')).not.toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-atlas', 'ready')
  await expect(page.locator('html')).toHaveClass(/atlas-js/)
  await expect(page.locator('#hero, #experience, #projects, #craft, #contact')).toHaveCount(5)
  await expect(page.locator('.chapter-wipe__layer')).toHaveCount(1)
  await expect(page.locator('[data-contact-finale]')).toHaveAttribute('data-contact-scroll-ready', '')
  await expect(page.locator('script[data-atlas-horizon]')).toHaveCount(0)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveCount(1)
  await expect(page.locator('.feather-fall-canvas')).toHaveCount(1)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveAttribute(
    'data-feather-tier',
    isMobile ? 'mobile-40' : /^(desktop-120|desktop-software-40)$/,
  )
  await expectNoHorizontalOverflow(page)

  const toggle = page.getByRole('button', { name: 'Field notes +' }).first()
  await toggle.scrollIntoViewIfNeeded()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.focus()
  await toggle.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await toggle.press('Space')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()

  await page.locator('#contact').scrollIntoViewIfNeeded()
  if (isMobile) {
    await page.waitForTimeout(400)
    await expect(page.locator('script[data-atlas-horizon], canvas[data-atlas-horizon-canvas]'))
      .toHaveCount(0)
  } else {
    await expect(page.locator('script[data-atlas-horizon]')).toHaveCount(1)
    await expect(page.locator('[data-horizon-flock] canvas')).toHaveCount(1)
  }
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('hands a sub-1.8s session entrance into the lazy Atlas ink simulation', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One fine-pointer engine measures Phase 1.')
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => sessionStorage.clear())
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const preloader = page.locator('[data-atlas-preloader]')
  await expect(preloader).toBeVisible()
  await expect(preloader.locator('[data-atlas-preloader-counter]')).toHaveText(/^(?:\d{2}|100)$/)
  await expect(preloader).toHaveCount(0, { timeout: 2200 })

  const entranceDuration = await page.evaluate(() => performance
    .getEntriesByName('atlas-preloader-duration')
    .at(-1)?.duration ?? Number.POSITIVE_INFINITY)
  expect(entranceDuration).toBeLessThanOrEqual(1800)

  const fluid = page.locator('[data-fluid-cursor]')
  await expect(fluid).toHaveCount(1)
  await page.mouse.move(140, 180)
  await page.mouse.move(520, 360, { steps: 12 })
  await expect.poll(async () => Number(
    await fluid.locator('canvas').getAttribute('data-fluid-splats'),
  )).toBeGreaterThanOrEqual(8)
  await expect.poll(async () => Number(
    await fluid.locator('canvas').getAttribute('data-fluid-fps'),
  )).toBeGreaterThanOrEqual(20)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-atlas-preloader]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('keeps reduced motion identical to the static render', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'One engine exercises the shared reduced-motion kill switch.')
  const errors = observeApplicationErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'networkidle' })

  await expect(page.locator('html')).not.toHaveClass(/atlas-js/)
  await expect(page.locator('html')).not.toHaveAttribute('data-atlas')
  await expect(page.locator([
    '.chapter-wipe__layer',
    '[data-atlas-cursor]',
    '[data-atlas-preloader]',
    '[data-fluid-cursor]',
    '[data-feather-fall-layer]',
    'script[data-atlas-horizon]',
  ].join(', ')))
    .toHaveCount(0)
  await expect(page.locator('.flight-dossier__toggle').first())
    .toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.flight-dossier__panel').first()).toBeVisible()
  await expect(page.locator('.craft-marquee__track')).not.toHaveAttribute('style')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(
    (animation) => animation.playState === 'running',
  ).length)).toBe(0)
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('preserves the complete no-JS document', async ({ browser, isMobile }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: isMobile ? { height: 844, width: 390 } : { height: 1200, width: 1600 },
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')

  await expect(page.locator('#hero, #experience, #projects, #craft, #contact')).toHaveCount(5)
  await expect(page.locator('html')).not.toHaveClass(/atlas-js/)
  await expect(page.locator('[data-atlas-cursor], script[data-atlas-horizon], canvas')).toHaveCount(0)
  await expect(page.locator('.flight-dossier__toggle').first())
    .toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.flight-dossier__panel').first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await context.close()
})

test('samples frame pacing through the complete page', async ({
  browserName,
  isMobile,
  page,
}, testInfo) => {
  await page.goto('/?stats=1', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('data-atlas', 'ready')
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    images.forEach((image) => { image.loading = 'eager' })
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
  await page.locator('#contact').scrollIntoViewIfNeeded()
  if (!isMobile) await expect(page.locator('[data-horizon-flock] canvas')).toHaveCount(1)
  await page.waitForTimeout(750)
  await page.evaluate(() => scrollTo({ behavior: 'instant', top: 0 }))
  await page.waitForTimeout(350)

  const samples: Record<string, number> = {}
  const renderer = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl')
    const extension = context?.getExtension('WEBGL_debug_renderer_info')
    return context && extension
      ? String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL))
      : 'unavailable'
  })
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    samples[`${progress * 100}%`] = await page.evaluate(async (ratio) => {
      const maxScroll = document.documentElement.scrollHeight - innerHeight
      const target = maxScroll * ratio
      scrollTo({ behavior: 'instant', top: target })
      await new Promise((resolve) => setTimeout(resolve, 750))
      const timestamps: number[] = []
      await new Promise<void>((resolve) => {
        const sample = (timestamp: number) => {
          timestamps.push(timestamp)
          if (timestamps.length >= 60) resolve()
          else requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      })
      const duration = timestamps.at(-1)! - timestamps[0]
      return Number((((timestamps.length - 1) * 1000) / duration).toFixed(1))
    }, progress)
  }

  if (!isMobile) {
    const softwareRenderer = /swiftshader|llvmpipe|software/i.test(renderer)
    const minimumHorizonFps = browserName === 'webkit' || browserName === 'firefox'
      ? 28
      : softwareRenderer
        ? 20
        : 55
    await expect.poll(async () => Number(
      await page.locator('[data-horizon-flock]').getAttribute('data-horizon-fps'),
    )).toBeGreaterThanOrEqual(minimumHorizonFps)
  }

  testInfo.annotations.push({
    type: 'motion-fps',
    description: JSON.stringify({ renderer, samples }),
  })
  console.log(
    `[motion-fps][${testInfo.project.name}] ${JSON.stringify({ renderer, samples })}`,
  )
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(renderer)
  const minimumExpectedFps = softwareRenderer
    ? 16
    : isMobile || browserName === 'webkit'
      ? 28
      : 20
  expect(Math.min(...Object.values(samples))).toBeGreaterThanOrEqual(minimumExpectedFps)
})
