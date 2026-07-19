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

async function activateDecorativeWebGL(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.evaluate(() => window.dispatchEvent(new Event('touchstart')))
  } else {
    await page.mouse.move(4, 4)
  }
}

test('ships clean cross-browser choreography and an accessible dossier', async ({
  isMobile,
  page,
}) => {
  const errors = observeApplicationErrors(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)

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
  await expect(page.locator('.hero-liquid')).toHaveAttribute('data-hero-liquid-ready', '')
  await expect(page.locator('.hero-liquid__canvas canvas')).toHaveCount(1)
  await expect(page.locator('.kinetic-type-band')).toHaveCount(0)
  await expect(page.locator('.atlas-picture--hero img')).toHaveAttribute('fetchpriority', 'high')
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
  await expect(page.locator('html')).not.toHaveAttribute('data-atlas-webgl-activated')
  await expect(page.locator([
    '.chapter-wipe__layer',
    '[data-atlas-cursor]',
    '[data-atlas-preloader]',
    '[data-fluid-cursor]',
    '[data-feather-fall-layer]',
    '.hero-liquid__canvas',
    'script[data-atlas-horizon]',
  ].join(', ')))
    .toHaveCount(0)
  await expect(page.locator('.flight-dossier__toggle').first())
    .toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.flight-dossier__panel').first()).toBeVisible()
  await expect(page.locator('.craft-marquee__track')).not.toHaveAttribute('style')
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveCSS('display', 'none')
  await expect(page.locator('[data-atlas-sun-trigger]')).toHaveCSS('display', 'none')
  await expect(page.locator('[data-golden-feather-target]')).toHaveCSS('display', 'none')
  expect(await page.locator('[data-atlas-plate-sheen]').first().evaluate((node) => (
    getComputedStyle(node, '::before').display
  ))).toBe('none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(
    (animation) => animation.playState === 'running',
  ).length)).toBe(0)
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('releases one four-second sun spectacle and leaves the golden feather at contact', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One fine-pointer engine verifies Phase 5.')
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('atlas-phase-five-e2e')) {
      sessionStorage.clear()
      sessionStorage.setItem('atlas-preloader-entered', '1')
      sessionStorage.setItem('atlas-entered', '1')
      sessionStorage.setItem('atlas-phase-five-e2e', '1')
    }
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveCount(1)

  const heroPlate = page.locator('.hero-liquid__visual')
  await heroPlate.hover()
  await expect.poll(() => heroPlate.evaluate((node) => Number.parseFloat(
    getComputedStyle(node, '::before').opacity,
  ))).toBeGreaterThan(0)

  const sun = page.getByRole('button', { name: 'Release the sun spectacle' })
  await expect(sun).toBeVisible()
  for (let index = 0; index < 4; index += 1) await sun.click()
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveAttribute(
    'data-state',
    'idle',
  )

  await sun.click()
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveAttribute(
    'data-state',
    'active',
  )
  await expect(page.locator('html')).toHaveAttribute('data-atlas-spectacle-start')
  await expect.poll(() => page.locator('[data-atlas-sun-flare]').evaluate((node) => (
    Number.parseFloat(getComputedStyle(node).opacity)
  ))).toBeGreaterThan(0)
  await expect.poll(() => page.locator('[data-golden-feather-target]').evaluate((node) => (
    Number.parseFloat(getComputedStyle(node).opacity)
  ))).toBeGreaterThan(0)
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveAttribute(
    'data-state',
    'settled',
    { timeout: 4_800 },
  )
  expect(Number(await page.locator('[data-testid="atlas-spectacle"]')
    .getAttribute('data-duration'))).toBeLessThanOrEqual(4_000)
  await expect(page.locator('html')).not.toHaveAttribute('data-atlas-spectacle-start')
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-golden-feather-target]')).toHaveCSS('opacity', '1')

  await page.reload({ waitUntil: 'networkidle' })
  for (let index = 0; index < 5; index += 1) await sun.click()
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveAttribute(
    'data-state',
    'idle',
  )
  expect(errors).toEqual([])
})

test('prints the missing plate in glitching ink with sparse feathers', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One WebGL engine verifies the 404 scene.')
  const errors = observeApplicationErrors(page)
  await page.goto('/404.html', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)

  await expect(page.getByRole('heading', {
    name: 'This plate is missing from the atlas.',
  })).toBeVisible()
  await expect(page.locator('[data-letter-glitch] canvas')).toHaveCount(1)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveCount(1)
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('reverses the feather-like masthead scatter and restores the hero at the top', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One engine verifies Phase 3 choreography.')
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-preloader-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)
  await expect(page.locator('.hero-liquid')).toHaveAttribute('data-hero-liquid-ready', '')

  const expectMatchingHeroBounds = async () => expect.poll(async () => page.evaluate(() => {
    const image = document.querySelector<HTMLElement>('.atlas-picture--hero img')!
    const canvasShell = document.querySelector<HTMLElement>('[data-hero-liquid-canvas]')!
    const canvas = canvasShell.querySelector<HTMLCanvasElement>('canvas')!
    const imageBounds = image.getBoundingClientRect()
    const bounds = [canvasShell.getBoundingClientRect(), canvas.getBoundingClientRect()]
    return Math.max(...bounds.flatMap((candidate) => [
      Math.abs(imageBounds.top - candidate.top),
      Math.abs(imageBounds.left - candidate.left),
      Math.abs(imageBounds.width - candidate.width),
      Math.abs(imageBounds.height - candidate.height),
    ]))
  })).toBeLessThanOrEqual(1)
  await expectMatchingHeroBounds()

  const characters = page.locator('.hero-masthead__line > div')
  await expect(characters).toHaveCount(9)
  await expect.poll(async () => characters.evaluateAll((nodes) => nodes.every((node) => (
    getComputedStyle(node).transform === 'matrix(1, 0, 0, 1, 0, 0)'
    && getComputedStyle(node).opacity === '1'
  )))).toBe(true)

  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('#hero')!
    const heroBottom = hero.offsetTop + hero.offsetHeight
    scrollTo({ behavior: 'instant', top: heroBottom - innerHeight * 0.53 })
  })
  await expect.poll(async () => characters.evaluateAll((nodes) => nodes.some((node) => (
    getComputedStyle(node).transform !== 'matrix(1, 0, 0, 1, 0, 0)'
  )))).toBe(true)

  await page.locator('#projects').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-hero-liquid-canvas]')).toHaveCount(0)
  await expect(page.locator('.hero-liquid')).not.toHaveAttribute('data-hero-liquid-ready', '')
  await page.evaluate(() => scrollTo({ behavior: 'instant', top: 0 }))
  await expect(page.locator('[data-hero-liquid-canvas]')).toHaveCount(1)
  await expect(page.locator('.hero-liquid')).toHaveAttribute('data-hero-liquid-ready', '')
  await expectMatchingHeroBounds()
  await expect.poll(async () => characters.evaluateAll((nodes) => nodes.every((node) => (
    getComputedStyle(node).transform === 'matrix(1, 0, 0, 1, 0, 0)'
    && getComputedStyle(node).opacity === '1'
  )))).toBe(true)
  expect(errors).toEqual([])
})

test('keeps projects as three vertical cards with keyboard links and print dissolves', async ({
  isMobile,
  page,
}) => {
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-preloader-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const panelList = page.getByRole('navigation', { name: 'Select a project' })
  const panels = page.locator('[data-testid="project-panel-trigger"]')
  await expect(panels).toHaveCount(3)
  await panelList.scrollIntoViewIfNeeded()
  await expect(page.locator('[data-project-flight-stage], .project-flight-canvas')).toHaveCount(0)
  await expect(panels.first().locator('[data-project-pan]')).toHaveCount(1)

  const panelBounds = await panels.evaluateAll((nodes) => nodes.map((node) => {
    const bounds = node.getBoundingClientRect()
    return { height: bounds.height, layoutTop: (node as HTMLElement).offsetTop, width: bounds.width }
  }))
  expect(panelBounds.every(({ height, width }) => height > width)).toBe(true)
  if (!isMobile) {
    expect(Math.max(...panelBounds.map(({ layoutTop }) => layoutTop))
      - Math.min(...panelBounds.map(({ layoutTop }) => layoutTop))).toBeLessThanOrEqual(1)
    const viewportWidth = page.viewportSize()?.width ?? 1600
    expect(panelBounds.every(({ width }) => width < viewportWidth / 2)).toBe(true)
  }

  const beatStream = page.getByRole('link', { name: /Open Beat Stream/i })
  await beatStream.focus()
  await expect(beatStream).toBeFocused()
  await expect(page.getByRole('link', { name: 'Open Vision Bias Steering case study' }))
    .toHaveAttribute('href', '/projects/vision-bias-steering')

  const dissolve = page.locator('.chapter-wipe__layer')
  await expect(dissolve).toHaveCount(1)
  expect(await dissolve.evaluate((node) => {
    const style = getComputedStyle(node)
    return style.maskImage || style.webkitMaskImage
  })).toContain('radial-gradient')
  await page.locator('#craft').scrollIntoViewIfNeeded()
  await expect.poll(async () => dissolve.evaluate((node) => Number.parseFloat(
    getComputedStyle(node).getPropertyValue('--chapter-dot-radius'),
  ))).toBeGreaterThan(0)
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
  await activateDecorativeWebGL(page, isMobile)
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
        ? 18
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
