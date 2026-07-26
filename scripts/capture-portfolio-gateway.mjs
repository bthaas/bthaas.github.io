import { mkdir } from 'node:fs/promises'

import { chromium } from 'playwright'

const origin = process.env.ATLAS_CAPTURE_ORIGIN ?? 'http://127.0.0.1:4175'
const root = new URL('..', import.meta.url).pathname
const output = `${root}design-refs/site-screenshots`
const states = ['experience', 'projects', 'skills', 'contact', 'experience-return']

await mkdir(output, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
  viewport: { height: 720, width: 1280 },
})
const page = await context.newPage()

await page.addInitScript(() => {
  sessionStorage.setItem('atlas-preloader-entered', '1')
  sessionStorage.setItem('atlas-entered', '1')
})
await page.goto(origin, { waitUntil: 'networkidle' })

const gateway = page.getByRole('region', { name: 'Portfolio category carousel' })
await gateway.evaluate((element) => element.scrollIntoView({ block: 'start' }))
await page.mouse.move(100, 100)
await page.waitForSelector('[data-atlas-webgl-activated]')
await gateway.waitFor({ state: 'visible' })
await page.waitForFunction(() => (
  document
    .querySelector('[aria-label="Portfolio category carousel"]')
    ?.hasAttribute('data-canvas-ready')
))
await page.waitForTimeout(1_500)

const proportions = await gateway.evaluate((element) => {
  const union = (selector) => {
    const bounds = Array.from(element.querySelectorAll(selector))
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
  const fallbackReflection = union(
    '.portfolio-gateway__fallback-reflection-ring .portfolio-gateway__fallback-slice',
  )
  return {
    fallbackGap: Number((fallbackReflection.top - upper.bottom).toFixed(1)),
    fallbackReflectionHeight: Number(fallbackReflection.height.toFixed(1)),
    upperHeight: Number(upper.height.toFixed(1)),
    upperWidth: Number(upper.width.toFixed(1)),
  }
})

for (const [index, state] of states.entries()) {
  if (index > 0) {
    await gateway.focus()
    await gateway.press('ArrowRight')
    await page.waitForTimeout(650)
  }
  const progress = index * 25
  await page.screenshot({
    path: `${output}/carousel-four-${String(progress).padStart(3, '0')}-${state}.png`,
  })
}

await context.close()

const fallbackContext = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  viewport: { height: 720, width: 1280 },
})
const fallbackPage = await fallbackContext.newPage()
await fallbackPage.goto(origin, { waitUntil: 'networkidle' })
const fallbackGateway = fallbackPage.getByRole('region', {
  name: 'Portfolio category carousel',
})
await fallbackGateway.evaluate((element) => element.scrollIntoView({ block: 'start' }))
await fallbackPage.waitForTimeout(500)
await fallbackPage.screenshot({
  path: `${output}/carousel-four-static-fallback.png`,
})

const fallbackAudit = await fallbackPage.evaluate(() => ({
  activated: document.documentElement.hasAttribute('data-atlas-webgl-activated'),
  carouselCanvases: document.querySelectorAll('#portfolio-gateway canvas').length,
}))
if (fallbackAudit.activated || fallbackAudit.carouselCanvases !== 0) {
  throw new Error(`Reduced-motion carousel is not static: ${JSON.stringify(fallbackAudit)}`)
}

await fallbackContext.close()
await browser.close()

console.log(JSON.stringify({ fallback: fallbackAudit, proportions, states }))
