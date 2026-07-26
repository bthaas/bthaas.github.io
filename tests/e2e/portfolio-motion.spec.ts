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

test('keeps the gateway name fitted and individually legible across responsive viewports', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One desktop engine verifies typography fit.')
  await page.setViewportSize({ height: 550, width: 1800 })
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const gatewaySection = page.locator('#portfolio-gateway')
  const gatewayWord = gatewaySection.getByText('BRETT HAAS', { exact: true })
  for (const viewport of [
    { height: 550, width: 1800 },
    { height: 546, width: 967 },
    { height: 844, width: 721 },
    { height: 844, width: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await gatewaySection.scrollIntoViewIfNeeded()
    const metrics = await gatewayWord.evaluate((element) => {
      const word = element.getBoundingClientRect()

      return {
        left: word.left,
        right: word.right,
        tracking: Number.parseFloat(getComputedStyle(element).letterSpacing),
        viewportWidth: innerWidth,
      }
    })

    expect(metrics.left).toBeGreaterThanOrEqual(16)
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth - 16)
    expect(metrics.tracking).toBeGreaterThanOrEqual(1)
  }
})

test('renders one fitted ground shadow and no reflection before or after interaction', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(
    browserName !== 'chromium' || isMobile,
    'One desktop engine verifies activation continuity.',
  )
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  const fallback = gateway.locator('.portfolio-gateway__fallback')
  await gateway.scrollIntoViewIfNeeded()
  await gateway.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(page.locator('html')).not.toHaveAttribute('data-atlas-webgl-activated')
  await expect(fallback).toHaveCSS('opacity', '1')
  await expect(gateway.locator('.portfolio-gateway__fallback-reflection')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__canvas')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__ground-shadow')).toHaveCount(1)

  await page.mouse.move(100, 100)
  await expect(page.locator('html')).toHaveAttribute('data-atlas-webgl-activated', '')
  await page.waitForTimeout(500)
  await expect(fallback).toHaveCSS('opacity', '1')
  await expect(gateway.locator('.portfolio-gateway__fallback-reflection')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__canvas')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__ground-shadow')).toHaveCount(1)
})

test('binds every category label to the rotating cylinder facets', async ({
  isMobile,
  page,
}) => {
  if (!isMobile) await page.setViewportSize({ height: 720, width: 1280 })
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  await gateway.scrollIntoViewIfNeeded()
  await gateway.evaluate((element) => element.scrollIntoView({ block: 'center' }))

  const labels = gateway.locator(
    '.portfolio-gateway__fallback-slice-body > .portfolio-gateway__surface-label',
  )
  await expect(labels).toHaveCount(48)
  await expect(gateway.locator('.portfolio-gateway__face-label')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Open Experience screen' })).toHaveClass(
    /portfolio-gateway__surface-link/,
  )

  const labelGeometry = await labels.first().evaluate((label) => {
    const slice = label.parentElement
    if (!slice) throw new Error('Surface label is missing its facet')
    const labelStyle = getComputedStyle(label)
    const sliceStyle = getComputedStyle(slice)
    return {
      blendMode: labelStyle.mixBlendMode,
      labelOpacity: Number.parseFloat(labelStyle.opacity),
      labelStrokeWidth: Number.parseFloat(
        labelStyle.getPropertyValue('-webkit-text-stroke-width'),
      ),
      labelTextShadow: labelStyle.textShadow,
      labelWidth: label.getBoundingClientRect().width,
      overflow: sliceStyle.overflow,
      sliceWidth: slice.getBoundingClientRect().width,
    }
  })
  expect(labelGeometry.overflow).toBe('hidden')
  expect(labelGeometry.blendMode).toBe('normal')
  expect(labelGeometry.labelOpacity).toBeGreaterThanOrEqual(0.95)
  expect(labelGeometry.labelStrokeWidth).toBeGreaterThanOrEqual(0.5)
  expect(labelGeometry.labelTextShadow).not.toBe('none')
  expect(labelGeometry.labelWidth / labelGeometry.sliceWidth).toBeGreaterThan(10.5)

  const dragSurface = gateway.getByTestId('portfolio-gateway-drag-surface')
  await dragSurface.scrollIntoViewIfNeeded()
  const ring = gateway.locator('.portfolio-gateway__fallback-ring')
  const restingTransform = await ring.getAttribute('style')
  const bounds = await dragSurface.boundingBox()
  if (!bounds) throw new Error('Missing gateway drag surface bounds')
  await page.mouse.move(bounds.x + bounds.width * 0.1, bounds.y + bounds.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.22, bounds.y + bounds.height * 0.2)
  await expect(gateway).toHaveAttribute('data-dragging', 'true')
  await expect(ring).toHaveCSS('transition-property', 'none')
  expect(await ring.getAttribute('style')).not.toBe(restingTransform)
  await page.mouse.up()
})

test('matches the reference drum with a solid fitted shadow and no reflection', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(
    browserName !== 'chromium' || isMobile,
    'One desktop engine verifies the reference proportions.',
  )
  await page.setViewportSize({ height: 720, width: 1280 })
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  await gateway.scrollIntoViewIfNeeded()
  await gateway.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const proportions = await gateway.evaluate((element) => {
    const union = (selector: string) => {
      const bounds = Array.from(element.querySelectorAll<HTMLElement>(selector))
        .filter((node) => {
          const angle = Number.parseFloat(
            getComputedStyle(node).getPropertyValue('--gateway-segment-angle'),
          )
          const normalized = ((angle + 180) % 360 + 360) % 360 - 180
          return Math.abs(normalized) < 90
        })
        .map((node) => node.getBoundingClientRect())
      return {
        bottom: Math.max(...bounds.map((bound) => bound.bottom)),
        height: Math.max(...bounds.map((bound) => bound.bottom))
          - Math.min(...bounds.map((bound) => bound.top)),
        top: Math.min(...bounds.map((bound) => bound.top)),
        width: Math.max(...bounds.map((bound) => bound.right))
          - Math.min(...bounds.map((bound) => bound.left)),
      }
    }

    const upper = union(
      '.portfolio-gateway__fallback-ring .portfolio-gateway__fallback-slice',
    )
    const shadow = element
      .querySelector<HTMLElement>('.portfolio-gateway__ground-shadow')
      ?.getBoundingClientRect()
    if (!shadow) throw new Error('Missing gateway ground shadow')
    return {
      shadowColor: getComputedStyle(
        element.querySelector<HTMLElement>('.portfolio-gateway__ground-shadow')!,
      ).backgroundColor,
      shadowHeight: shadow.height,
      shadowWidth: shadow.width,
      upperHeight: upper.height,
      upperWidth: upper.width,
    }
  })

  expect(proportions.upperWidth).toBeGreaterThanOrEqual(565)
  expect(proportions.upperWidth).toBeLessThanOrEqual(620)
  expect(proportions.upperHeight).toBeGreaterThanOrEqual(305)
  expect(proportions.upperHeight).toBeLessThanOrEqual(370)
  expect(proportions.shadowWidth / proportions.upperWidth).toBeGreaterThanOrEqual(0.84)
  expect(proportions.shadowWidth / proportions.upperWidth).toBeLessThanOrEqual(0.94)
  expect(proportions.shadowHeight).toBeGreaterThanOrEqual(30)
  expect(proportions.shadowHeight).toBeLessThanOrEqual(46)
  expect(proportions.shadowColor).toMatch(/^rgba?\(10, 11, 8/)
  await expect(gateway.locator('.portfolio-gateway__fallback-reflection')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__canvas')).toHaveCount(0)
})

test('opens every carousel category as its own routed screen', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.slow()
  test.skip(
    browserName !== 'chromium' || isMobile,
    'One desktop engine verifies the four route destinations.',
  )
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  for (const [label, route, screenName, sectionId, arrowPresses] of [
    ['Experience', '/experience', 'experience', 'experience', 0],
    ['Projects', '/projects', 'projects', 'projects', 1],
    ['Skills', '/skills', 'skills', 'craft', 2],
    ['Contact', '/contact', 'contact', 'contact', 3],
  ] as const) {
    if (page.url() !== 'http://127.0.0.1:4173/') {
      await page.goto('/', { waitUntil: 'networkidle' })
    }
    const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
    await gateway.scrollIntoViewIfNeeded()
    await gateway.focus()
    for (let press = 0; press < arrowPresses; press += 1) {
      await gateway.press('ArrowRight')
    }

    const face = page.getByRole('link', { name: `Open ${label} screen` })
    await expect(face).toHaveAttribute('href', route)
    await face.click()
    await expect(page).toHaveURL(new RegExp(`${route}/?$`), { timeout: 15_000 })
    await expect(page.locator('main')).toHaveAttribute('data-portfolio-screen', screenName)
    await expect(page.locator('main > section')).toHaveCount(1)
    await expect(page.locator(`main > #${sectionId}`)).toBeVisible()
    await expect(page.getByTestId('page-transition-overlay')).toHaveAttribute(
      'data-transition-state',
      'idle',
    )

    if (route === '/projects') {
      await page.goBack()
      await expect(page).toHaveURL(/\/$/)
      await expect(page.locator('#portfolio-gateway')).toBeVisible()
      await expect(page.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'idle',
      )
      await page.goForward()
      await expect(page).toHaveURL(/\/projects\/?$/)
      await expect(page.locator('main')).toHaveAttribute('data-portfolio-screen', 'projects')
      await expect(page.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'idle',
      )
    }
  }
  expect(errors).toEqual([])
})

test('ships clean cross-browser routing, gateway choreography, and an accessible career path', async ({
  isMobile,
  page,
}) => {
  test.slow()
  const errors = observeApplicationErrors(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)

  await expect(page.locator('script[src*="/_next/static/"]')).not.toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-atlas', 'ready')
  await expect(page.locator('html')).toHaveClass(/atlas-js/)
  await expect(page.locator('#portfolio-gateway')).toHaveCount(1)
  await expect(page.locator('#experience, #projects, #craft, #contact')).toHaveCount(0)
  await expect(page.locator('.chapter-wipe__layer')).toHaveCount(0)
  const sectionBackgrounds = await page
    .locator('#portfolio-gateway')
    .evaluateAll((sections) => sections.map((section) => getComputedStyle(section).backgroundColor))
  expect(new Set(sectionBackgrounds)).toEqual(new Set(['rgb(243, 239, 227)']))
  await expect(page.locator('[data-feather-fall-layer]')).toHaveCount(1)
  await expect(page.locator('.feather-fall-canvas')).toHaveCount(1)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveAttribute(
    'data-feather-tier',
    isMobile ? 'mobile-40' : /^(desktop-120|desktop-software-40)$/,
  )
  await expect(page.locator('.kinetic-type-band')).toHaveCount(0)
  await expectNoHorizontalOverflow(page)

  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  await gateway.scrollIntoViewIfNeeded()
  await gateway.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(gateway).not.toHaveAttribute('aria-disabled', 'true')
  await expect(gateway).toHaveAttribute('data-active-index', '0')
  await expect(
    gateway.locator(
      '.portfolio-gateway__fallback-ring > .portfolio-gateway__fallback-slice',
    ),
  ).toHaveCount(48)
  await expect(
    gateway.locator(
      '.portfolio-gateway__fallback-reflection-ring > .portfolio-gateway__fallback-slice',
    ),
  ).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__fallback-reflection')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway-canvas')).toHaveCount(0)
  await expect(gateway.locator('.portfolio-gateway__ground-shadow')).toHaveCount(1)
  await expect(
    page.locator('#portfolio-gateway').getByText('BRETT HAAS', { exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('#portfolio-gateway').getByText('Engineer · Researcher · Builder', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open Experience', exact: true })).toHaveAttribute(
    'href',
    '/experience',
  )
  await gateway.focus()
  await gateway.press('ArrowRight')
  await expect(gateway).toHaveAttribute('data-active-index', '1')
  await expect(page.getByRole('link', { name: 'Open Projects', exact: true })).toHaveAttribute(
    'href',
    '/projects',
  )
  await gateway.press('ArrowRight')
  await expect(gateway).toHaveAttribute('data-active-index', '2')
  await expect(page.getByRole('link', { name: 'Open Skills', exact: true }))
    .toHaveAttribute('href', '/skills')
  await gateway.press('ArrowRight')
  await expect(gateway).toHaveAttribute('data-active-index', '3')
  await expect(page.getByRole('link', { name: 'Open Contact', exact: true })).toHaveAttribute(
    'href',
    '/contact',
  )
  await gateway.press('ArrowRight')
  await expect(gateway).toHaveAttribute('data-active-index', '0')
  await gateway.press('ArrowLeft')
  await expect(gateway).toHaveAttribute('data-active-index', '3')
  const gatewayDragSurface = gateway.getByTestId('portfolio-gateway-drag-surface')
  await gatewayDragSurface.scrollIntoViewIfNeeded()
  const gatewayBox = await gatewayDragSurface.boundingBox()
  expect(gatewayBox).not.toBeNull()
  const gatewayDragY = gatewayBox!.y + gatewayBox!.height * 0.36
  await page.mouse.move(gatewayBox!.x + gatewayBox!.width * 0.72, gatewayDragY)
  await page.mouse.down()
  await expect(gateway).toHaveAttribute('data-dragging', 'true')
  await page.mouse.move(gatewayBox!.x + gatewayBox!.width * 0.32, gatewayDragY, { steps: 6 })
  await page.mouse.up()
  await expect(gateway).toHaveAttribute('data-dragging', 'false')
  await expect(gateway).toHaveAttribute('data-active-index', '0')
  await expectNoHorizontalOverflow(page)

  await page.getByRole('link', { name: 'Open Experience', exact: true }).click()
  await expect(page).toHaveURL(/\/experience\/?$/, { timeout: 15_000 })
  await expect(page.locator('#experience')).toHaveCount(1)
  await expect(page.locator('#portfolio-gateway, #projects, #craft, #contact')).toHaveCount(0)
  await expect(page.getByTestId('page-transition-overlay')).toHaveAttribute(
    'data-transition-state',
    'idle',
  )
  const careerPath = page.locator('[data-experience-flight]')
  const chapters = careerPath.locator('[data-experience-chapter]')
  const route = careerPath.locator('.experience-flight__route')
  const routeLinks = route.locator('a')
  await expect(chapters).toHaveCount(4)
  await expect(routeLinks).toHaveCount(4)
  await expect(routeLinks.nth(1)).toHaveAttribute(
    'href',
    '#experience-chapter-scale-ai',
  )
  if (isMobile) {
    await expect(careerPath).not.toHaveAttribute('data-experience-flight-enhanced')
    await expect(route).toBeHidden()
    for (const chapter of await chapters.all()) await expect(chapter).toBeVisible()
  } else {
    await expect(careerPath).toHaveAttribute('data-experience-flight-enhanced', '')
    await expect(route).toBeVisible()
    await routeLinks.nth(1).focus()
    await expect(routeLinks.nth(1)).toBeFocused()
    await expect(routeLinks.nth(1)).toHaveAttribute('aria-current', 'step')
    await routeLinks.nth(1).press('Enter')
    await expect(page).toHaveURL(/#experience-chapter-scale-ai$/)
  }
  await expect(page.locator('#experience')).toHaveCSS('background-color', 'rgb(25, 25, 43)')
  await expectNoHorizontalOverflow(page)

  const contactLink = page.getByRole('link', { name: 'Contact' })
  await contactLink.focus()
  await contactLink.press('Enter')
  await expect(page).toHaveURL(/\/contact\/?$/, { timeout: 15_000 })
  await expect(page.locator('[data-contact-finale]')).toHaveAttribute('data-contact-scroll-ready', '')
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

test('assembles the gateway once, locks interaction until landing, and hands off to carousel input', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.slow()
  test.skip(browserName !== 'chromium' || isMobile, 'One fine-pointer engine measures Phase 1.')
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => sessionStorage.clear())
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('[data-atlas-preloader]')).toHaveCount(0)
  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  const gatewaySection = page.locator('#portfolio-gateway')
  await gatewaySection.scrollIntoViewIfNeeded()
  await expect(gatewaySection).toHaveAttribute('data-gateway-entrance', 'entering')
  await expect(gateway).toHaveAttribute('aria-disabled', 'true')
  await expect(gateway).toHaveAttribute('tabindex', '-1')
  await expect(page.getByRole('button', { name: 'Next category' })).toBeDisabled()
  await gateway.dispatchEvent('keydown', { key: 'ArrowRight' })
  await expect(gateway).toHaveAttribute('data-active-index', '0')
  await expect(gatewaySection.locator('[data-gateway-entrance-slice]')).toHaveCount(48)
  await expect(gatewaySection).toHaveAttribute(
    'data-gateway-entrance',
    'settled',
    { timeout: 3_400 },
  )
  await expect(gateway).not.toHaveAttribute('aria-disabled')
  await expect(gateway).toHaveAttribute('tabindex', '0')
  await expect(page.getByRole('button', { name: 'Next category' })).toBeEnabled()

  const entranceDuration = await page.evaluate(() => performance
    .getEntriesByName('atlas-gateway-entrance-duration')
    .at(-1)?.duration ?? Number.POSITIVE_INFINITY)
  expect(entranceDuration).toBeGreaterThanOrEqual(2_300)
  expect(entranceDuration).toBeLessThanOrEqual(3_400)
  expect(await page.evaluate(() => sessionStorage.getItem('atlas-gateway-entered'))).toBe('1')

  await gateway.focus()
  await gateway.press('ArrowRight')
  await expect(gateway).toHaveAttribute('data-active-index', '1')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('#portfolio-gateway').scrollIntoViewIfNeeded()
  await expect(page.locator('#portfolio-gateway')).toHaveAttribute(
    'data-gateway-entrance',
    'settled',
  )
  await expect(page.locator('[data-atlas-preloader]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('skips the gateway assembly and unlocks input for reduced motion', async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== 'chromium', 'One engine verifies the shared reduced-motion gate.')
  const errors = observeApplicationErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => sessionStorage.clear())
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.readyState === 'complete')

  const gatewaySection = page.locator('#portfolio-gateway')
  const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
  await gatewaySection.scrollIntoViewIfNeeded()

  await expect(gatewaySection).toHaveAttribute('data-gateway-entrance', 'settled')
  await expect(gatewaySection.locator('[data-gateway-entrance-slice]')).toHaveCount(48)
  await expect(gateway).not.toHaveAttribute('aria-disabled')
  await expect(gateway).toHaveAttribute('tabindex', '0')
  await expect(page.getByRole('button', { name: 'Next category' })).toBeEnabled()
  await expect(page.locator('[data-atlas-preloader]')).toHaveCount(0)
  expect(await gatewaySection.locator('[data-gateway-entrance-slice]').evaluateAll(
    (slices) => slices.filter((slice) => (slice as HTMLElement).style.transform).length,
  )).toBe(0)
  expect(await page.evaluate(() => sessionStorage.getItem('atlas-gateway-entered'))).toBeNull()
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
    '.portfolio-gateway-canvas',
    'script[data-atlas-horizon]',
  ].join(', ')))
    .toHaveCount(0)
  await expect(
    page.locator('.portfolio-gateway__fallback-ring > .portfolio-gateway__fallback-slice'),
  ).toHaveCount(48)
  await expect(page.locator('#portfolio-gateway')).toHaveAttribute(
    'data-gateway-entrance',
    'settled',
  )
  await expect(page.getByRole('region', { name: 'Portfolio category carousel' }))
    .not.toHaveAttribute('aria-disabled')

  await page.getByRole('link', { name: 'Open Experience screen' }).click()
  await expect(page).toHaveURL(/\/experience\/?$/)
  await expect(page.getByTestId('page-transition-overlay')).toHaveAttribute(
    'data-transition-state',
    'idle',
  )
  await expect(page.locator('[data-experience-flight]'))
    .not.toHaveAttribute('data-experience-flight-enhanced')
  await expect(page.locator('[data-experience-chapter]')).toHaveCount(4)
  for (const chapter of await page.locator('[data-experience-chapter]').all()) {
    await expect(chapter).toBeVisible()
  }
  await expect(page.locator('#experience .pin-spacer')).toHaveCount(0)

  await page.goto('/skills', { waitUntil: 'networkidle' })
  const reducedWorkbench = page.getByRole('region', { name: 'Interactive skill workbench' })
  await expect(reducedWorkbench.locator('.skill-workbench__interactive')).toBeHidden()
  await expect(reducedWorkbench.getByTestId('skill-workbench-fallback')).toBeVisible()
  await expect(reducedWorkbench.locator('.skill-logo')).toHaveCount(28)
  await expect(reducedWorkbench.locator('canvas')).toHaveCount(0)
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveCSS('display', 'none')
  await expect(page.locator('[data-atlas-sun-trigger]')).toHaveCSS('display', 'none')

  await page.goto('/contact', { waitUntil: 'networkidle' })
  await expect(page.locator('[data-golden-feather-target]')).toHaveCSS('display', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(
    (animation) => animation.playState === 'running',
  ).length)).toBe(0)
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('drags, filters, and keyboard-controls the accessible skill workbench', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(
    browserName !== 'chromium' && !isMobile,
    'Chromium and the touch project cover the workbench.',
  )
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/skills', { waitUntil: 'networkidle' })

  const workbench = page.getByRole('region', { name: 'Interactive skill workbench' })
  await workbench.scrollIntoViewIfNeeded()
  await expect(workbench.locator('canvas')).toHaveCount(0)

  if (isMobile) {
    await expect(workbench.locator('.skill-workbench__interactive')).toBeHidden()
    await expect(workbench.getByTestId('skill-workbench-fallback')).toBeVisible()
    await expect(workbench.locator('.skill-logo')).toHaveCount(28)
  } else {
    const tools = workbench.getByRole('list', { name: 'Movable technology tools' })
    await expect(tools.getByRole('button')).toHaveCount(28)
    const typeScript = tools.getByRole('button', { name: 'TypeScript, Languages' })

    await typeScript.focus()
    await typeScript.press('ArrowRight')
    await expect(typeScript).toHaveAttribute('style', /translate3d\(12px, 0px, 0\)/)
    await typeScript.press('Escape')
    await expect(typeScript).toHaveAttribute('style', /translate3d\(0px, 0px, 0\)/)

    const tokenBox = await typeScript.boundingBox()
    expect(tokenBox).not.toBeNull()
    const startX = tokenBox!.x + tokenBox!.width / 2
    const startY = tokenBox!.y + tokenBox!.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await expect(workbench).toHaveAttribute('data-dragging', 'TypeScript')
    await page.mouse.move(startX + 48, startY + 24, { steps: 5 })
    await page.mouse.up()
    await expect(workbench).not.toHaveAttribute('data-dragging')
    await workbench.getByRole('button', { name: 'Reset workbench' }).click()
    await expect(typeScript).toHaveAttribute('style', /translate3d\(0px, 0px, 0\)/)
  }

  const frameworks = workbench.getByRole('button', { name: 'Frameworks', exact: true })
  await frameworks.click()
  await expect(workbench).toHaveAttribute('data-active-category', 'frameworks')
  await expect(frameworks).toHaveAttribute('aria-pressed', 'true')
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('releases one four-second sun spectacle on the homepage', async ({
  browserName,
  isMobile,
  page,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'One fine-pointer engine verifies Phase 5.')
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('atlas-phase-five-e2e')) {
      sessionStorage.clear()
      sessionStorage.setItem('atlas-gateway-entered', '1')
      sessionStorage.setItem('atlas-entered', '1')
      sessionStorage.setItem('atlas-phase-five-e2e', '1')
    }
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)
  await expect(page.locator('[data-feather-fall-layer]')).toHaveCount(1)

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
  await expect(page.locator('[data-testid="atlas-spectacle"]')).toHaveAttribute(
    'data-state',
    'settled',
    { timeout: 4_800 },
  )
  expect(Number(await page.locator('[data-testid="atlas-spectacle"]')
    .getAttribute('data-duration'))).toBeLessThanOrEqual(4_200)
  await expect(page.locator('html')).not.toHaveAttribute('data-atlas-spectacle-start')

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

test('spins the project helix and keeps a complete static fallback', async ({
  page,
}) => {
  const errors = observeApplicationErrors(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-gateway-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
  })
  await page.goto('/projects?stats=1', { waitUntil: 'networkidle' })

  const spiral = page.locator('.project-spiral')
  const stage = page.locator('[data-project-spiral-stage]')
  const panelList = page.getByRole('list', { name: 'Projects' })
  const panels = page.locator('[data-project-spiral-fallback] a')
  const spiralButton = page.getByRole('button', { name: 'Spiral view' })
  const indexButton = page.getByRole('button', { name: 'Index view' })
  await expect(panels).toHaveCount(3)
  await stage.scrollIntoViewIfNeeded()
  await expect(page.locator('[data-project-flight-stage], .project-flight-canvas')).toHaveCount(0)

  if (await spiral.getAttribute('data-project-spiral-enhanced') !== null) {
    await expect(spiral).toHaveAttribute('data-project-spiral-enhanced', '')
    await expect(stage).toBeVisible()
    await expect(stage).toHaveAttribute('data-project-spiral-ready', '')
    await expect(stage.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.project-spiral-stats')).toHaveCount(1)
    await expect(panelList).toBeVisible()
    await expect(spiralButton).toHaveAttribute('aria-pressed', 'true')
    const activeLink = stage.getByRole('link', { name: 'Open Court Vision case study' })
    await expect(activeLink).toHaveAttribute('href', '/projects/courtvision')
    const range = await spiral.evaluate((node) => {
      const bounds = node.getBoundingClientRect()
      return {
        start: bounds.top + scrollY,
        travel: Math.max(1, bounds.height - innerHeight),
      }
    })
    for (const [phase, href] of [
      [1, '/projects/beatstream'],
      [2, '/projects/vision-bias-steering'],
      [3, '/projects/courtvision'],
    ] as const) {
      await page.evaluate(({ phase, start, travel }) => scrollTo({
        behavior: 'instant',
        top: start + travel * phase / 18,
      }), { ...range, phase })
      await expect(stage.locator('.project-spiral__active-link')).toHaveAttribute(
        'href',
        href,
      )
    }

    await indexButton.click()
    await expect(spiral).toHaveAttribute('data-project-view', 'index')
    await expect(indexButton).toHaveAttribute('aria-pressed', 'true')
    await expect(stage).toBeHidden()
    await expect(panelList.getByText('TensorFlow Lite')).toBeVisible()

    await spiralButton.click()
    await expect(spiral).toHaveAttribute('data-project-view', 'spiral')
    await expect(spiralButton).toHaveAttribute('aria-pressed', 'true')
    await expect(stage).toBeVisible()
  } else {
    await expect(stage).toBeHidden()
    await expect(panelList).toBeVisible()
    await expect(stage.locator('canvas')).toHaveCount(0)
    await expect(indexButton).toHaveAttribute('aria-pressed', 'true')
  }

  const beatStream = panelList.getByRole('link', { name: /Open Beat Stream/i })
  await beatStream.focus()
  await expect(beatStream).toBeFocused()
  const visionBiasSteering = panelList.getByRole(
    'link',
    { name: 'Open Vision Bias Steering case study' },
  )
  await expect(visionBiasSteering)
    .toHaveAttribute('href', '/projects/vision-bias-steering')

  await expect(page.locator('.chapter-wipe__layer')).toHaveCount(0)
  const chapterBackgrounds = await page.locator('#projects').evaluateAll(
    (chapters) => chapters.map((chapter) => getComputedStyle(chapter).backgroundColor),
  )
  expect(new Set(chapterBackgrounds)).toEqual(new Set(['rgb(243, 239, 227)']))
  await expectNoHorizontalOverflow(page)
  expect(errors).toEqual([])
})

test('preserves every focused route without JavaScript', async (
  { browser, isMobile },
  testInfo,
) => {
  const baseURL = String(testInfo.project.use.baseURL ?? 'http://127.0.0.1:4173')
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: isMobile ? { height: 844, width: 390 } : { height: 1200, width: 1600 },
  })
  const page = await context.newPage()
  await page.goto(`${baseURL}/`)

  await expect(page.locator('#portfolio-gateway')).toHaveCount(1)
  await expect(page.locator('#experience, #projects, #craft, #contact')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/atlas-js/)
  await expect(page.locator('[data-atlas-cursor], script[data-atlas-horizon], canvas')).toHaveCount(0)

  await page.goto(`${baseURL}/experience`)
  await expect(page.locator('[data-experience-flight]'))
    .not.toHaveAttribute('data-experience-flight-enhanced')
  await expect(page.locator('[data-experience-chapter]')).toHaveCount(4)
  for (const chapter of await page.locator('[data-experience-chapter]').all()) {
    await expect(chapter).toBeVisible()
  }
  await expect(page.locator('.experience-flight__route a'))
    .toHaveCount(4)

  for (const route of ['/projects', '/skills', '/contact']) {
    await page.goto(`${baseURL}${route}`)
    await expect(page.locator('main > section')).toHaveCount(1)
  }
  await expectNoHorizontalOverflow(page)
  await context.close()
})

test('samples frame pacing through the complete homepage', async ({
  browserName,
  isMobile,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await page.goto('/?stats=1', { waitUntil: 'networkidle' })
  await activateDecorativeWebGL(page, isMobile)
  await expect(page.locator('html')).toHaveAttribute('data-atlas', 'ready')
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    images.forEach((image) => { image.loading = 'eager' })
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
  await page.locator('#portfolio-gateway').scrollIntoViewIfNeeded()
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

  testInfo.annotations.push({
    type: 'motion-fps',
    description: JSON.stringify({ renderer, samples }),
  })
  console.log(
    `[motion-fps][${testInfo.project.name}] ${JSON.stringify({ renderer, samples })}`,
  )
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(renderer)
  const minimumExpectedFps = softwareRenderer || browserName === 'firefox'
    ? 10
    : isMobile || browserName === 'webkit'
      ? 28
      : 20
  expect(Math.min(...Object.values(samples))).toBeGreaterThanOrEqual(minimumExpectedFps)
})
