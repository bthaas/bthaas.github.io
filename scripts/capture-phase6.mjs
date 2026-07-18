import { mkdir, rm } from 'node:fs/promises'

import { chromium } from 'playwright'

const origin = process.env.ATLAS_CAPTURE_ORIGIN ?? 'http://127.0.0.1:4174'
const root = new URL('..', import.meta.url).pathname
const submission = `${root}docs/awwwards/submission`
const step = `${root}docs/awwwards/screenshots/step-20`

const obsoleteSubmissionFiles = [
  '01-hero-1600x1200.png',
  '02-craft-wipe-mid-1600x1200.png',
  '03-project-pan-1600x1200.png',
]

await mkdir(submission, { recursive: true })
await mkdir(step, { recursive: true })
await Promise.all(obsoleteSubmissionFiles.map((file) => rm(`${submission}/${file}`, { force: true })))

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
  viewport: { height: 1200, width: 1600 },
})
const page = await context.newPage()

await page.addInitScript(() => {
  sessionStorage.setItem('atlas-preloader-entered', '1')
  sessionStorage.setItem('atlas-entered', '1')
  sessionStorage.removeItem('atlas-sun-spectacle')
})
await page.goto(origin, { waitUntil: 'networkidle' })
await page.mouse.move(1180, 460)
await page.waitForSelector('[data-atlas-webgl-activated]')
await page.waitForSelector('[data-hero-liquid-ready]', { timeout: 15_000 })
await page.waitForTimeout(800)

await page.screenshot({ path: `${submission}/01-hero-liquid-1600x1200.png` })
await page.screenshot({ path: `${step}/hero-liquid-production-1600.png` })

const sun = page.locator('[data-atlas-sun-trigger]')
for (let click = 0; click < 5; click += 1) await sun.click()
await page.waitForFunction(() => document.documentElement.hasAttribute('data-atlas-spectacle-start'))
await page.locator('#experience').scrollIntoViewIfNeeded()
await page.waitForTimeout(620)
await page.screenshot({ path: `${submission}/02-feather-fall-1600x1200.png` })
await page.screenshot({ path: `${step}/feather-blizzard-production-1600.png` })
await page.waitForTimeout(3_700)

const galleryY = await page.evaluate(() => {
  const stage = document.querySelector('[data-project-flight-stage]')
  const track = document.querySelector('[data-project-flight-track]')
  if (!(stage instanceof HTMLElement) || !(track instanceof HTMLElement)) return 0
  const pinDistance = Math.max(0, track.scrollWidth - stage.clientWidth)
  const pinStart = stage.getBoundingClientRect().top + window.scrollY - 58
  return pinStart + pinDistance * 0.5
})
await page.evaluate((top) => window.scrollTo({ behavior: 'instant', top }), galleryY)
await page.waitForTimeout(1_200)
await page.screenshot({ path: `${submission}/03-horizontal-gallery-1600x1200.png` })
await page.screenshot({ path: `${step}/horizontal-gallery-production-1600.png` })

await page.locator('#contact').scrollIntoViewIfNeeded()
await page.waitForTimeout(1_500)
await page.screenshot({ path: `${submission}/04-finale-1600x1200.png` })
await page.screenshot({ path: `${step}/contact-finale-production-1600.png` })

await context.close()

const reducedContext = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  viewport: { height: 1000, width: 1600 },
})
const reducedPage = await reducedContext.newPage()
await reducedPage.goto(origin, { waitUntil: 'networkidle' })
await reducedPage.screenshot({ path: `${step}/reduced-motion-atlas-1600.png` })
const reducedAudit = await reducedPage.evaluate(() => ({
  activated: document.documentElement.hasAttribute('data-atlas-webgl-activated'),
  canvases: document.querySelectorAll('canvas').length,
  preloader: document.querySelectorAll('[data-atlas-preloader]').length,
}))
if (reducedAudit.activated || reducedAudit.canvases !== 0 || reducedAudit.preloader !== 0) {
  throw new Error(`Reduced-motion capture is not static: ${JSON.stringify(reducedAudit)}`)
}

await reducedContext.close()
await browser.close()

console.log(JSON.stringify({ reducedMotion: reducedAudit, submission: 4, step: 5 }))
