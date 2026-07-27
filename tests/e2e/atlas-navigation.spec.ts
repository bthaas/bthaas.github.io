import { expect, test } from '@playwright/test'

const innerRoutes = [
  { current: 'experience', href: '/experience', label: 'Experience' },
  { current: 'projects', href: '/projects', label: 'Projects' },
  { current: 'skills', href: '/skills', label: 'Skills' },
  { current: 'contact', href: '/contact', label: 'Contact' },
] as const

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('atlas-entered', '1')
    sessionStorage.setItem('atlas-gateway-entered', '1')
  })
})

test('keeps Atlas navigation contextual and collision-free on every route', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  const homeNavigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(homeNavigation.getByRole('link')).toHaveCount(4)
  await expect(homeNavigation.getByRole('link', { name: 'Home' })).toHaveCount(0)
  await expect(homeNavigation.getByRole('link', { name: 'Experience' }))
    .toHaveAttribute('data-active-destination', 'true')

  await page.getByRole('button', { name: 'Next category' }).click()
  await expect(homeNavigation.getByRole('link', { name: 'Projects' }))
    .toHaveAttribute('data-active-destination', 'true')
  await expect(homeNavigation.getByRole('link', { name: 'Experience' }))
    .not.toHaveAttribute('data-active-destination')

  for (const route of innerRoutes) {
    await page.goto(route.href, { waitUntil: 'networkidle' })
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    const home = navigation.getByRole('link', { name: 'Home' })

    await expect(home).toHaveAttribute('href', '/')
    await expect(home.locator('svg[data-arrow-direction="left"]')).toHaveCount(1)
    await home.focus()
    await expect(home).toBeFocused()

    if (route.current !== 'projects') {
      await expect(navigation.getByRole('link')).toHaveCount(5)
      await expect(navigation.getByRole('link', { name: route.label }))
        .toHaveAttribute('aria-current', 'page')
    } else {
      await expect(navigation.getByRole('link')).toHaveCount(1)
      await expect(page.locator('.atlas-route-index')).toHaveCount(0)
    }

    const layout = await page.evaluate(() => {
      const homeLink = document.querySelector('.atlas-home-link')
      const experienceEyebrow = document.querySelector('.experience-timeline__intro .eyebrow')
      const bounds = homeLink?.getBoundingClientRect()
      const eyebrowBounds = experienceEyebrow?.getBoundingClientRect()
      const overlapsExperienceEyebrow = Boolean(
        bounds
        && eyebrowBounds
        && bounds.left < eyebrowBounds.right
        && bounds.right > eyebrowBounds.left
        && bounds.top < eyebrowBounds.bottom
        && bounds.bottom > eyebrowBounds.top,
      )

      return {
        bottom: bounds?.bottom ?? -1,
        left: bounds?.left ?? -1,
        overlapsExperienceEyebrow,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        right: bounds?.right ?? -1,
        top: bounds?.top ?? -1,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }
    })

    expect(layout.overflow).toBe(false)
    expect(layout.overlapsExperienceEyebrow).toBe(false)
    expect(layout.left).toBeGreaterThanOrEqual(0)
    expect(layout.top).toBeGreaterThanOrEqual(0)
    expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth)
    expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight)
  }
})
