import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'

import { chromium } from 'playwright'

const origin = process.env.ATLAS_CAPTURE_ORIGIN ?? 'http://localhost:3001'
const root = new URL('..', import.meta.url).pathname
const output = `${root}design-refs/site-screenshots`
const temporaryVideoOutput = `${output}/.entrance-video`
const viewport = { height: 900, width: 1440 }
const run = promisify(execFile)
const cleanCaptureStyle = `
  nextjs-portal,
  .fluid-cursor-layer,
  .atlas-cursor {
    display: none !important;
  }
`
const screenshotTimes = [
  ['000', 0],
  ['025', 650],
  ['050', 1300],
  ['075', 1950],
]

await mkdir(output, { recursive: true })
await rm(temporaryVideoOutput, { force: true, recursive: true })
await mkdir(temporaryVideoOutput, { recursive: true })

const browser = await chromium.launch({ headless: true })
const consoleErrors = []
const context = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  recordVideo: {
    dir: temporaryVideoOutput,
    size: viewport,
  },
  reducedMotion: 'no-preference',
  viewport,
})
const page = await context.newPage()
const video = page.video()
const videoStartedAt = Date.now()

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(error.message))

await page.addInitScript(() => {
  sessionStorage.removeItem('atlas-gateway-entered')
  sessionStorage.setItem('atlas-entered', '1')
  window.__gatewayEntranceMetrics = {
    largestContentfulPaint: 0,
    layoutShift: 0,
  }

  new PerformanceObserver((entries) => {
    for (const entry of entries.getEntries()) {
      if (!entry.hadRecentInput) {
        window.__gatewayEntranceMetrics.layoutShift += entry.value
      }
    }
  }).observe({ buffered: true, type: 'layout-shift' })

  new PerformanceObserver((entries) => {
    for (const entry of entries.getEntries()) {
      window.__gatewayEntranceMetrics.largestContentfulPaint = entry.startTime
    }
  }).observe({ buffered: true, type: 'largest-contentful-paint' })
})

await page.goto(`${origin}/#portfolio-gateway`, { waitUntil: 'domcontentloaded' })
await page.addStyleTag({
  content: cleanCaptureStyle,
})
const entrance = page.locator('#portfolio-gateway')
const carousel = page.getByRole('region', {
  name: 'Portfolio category carousel',
})
await entrance.waitFor({ state: 'visible' })
await entrance.evaluate((element) => element.scrollIntoView({ block: 'start' }))
await entrance.waitFor({ state: 'visible' })
await page.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'entering'
))
const entranceVideoOffsetSeconds = Math.max(
  0,
  (Date.now() - videoStartedAt) / 1000 - 0.18,
)

const frameSample = page.evaluate(() => new Promise((resolve) => {
  const start = performance.now()
  let frames = 0

  const sample = (now) => {
    frames += 1
    const duration = now - start
    if (duration >= 2600) {
      resolve({
        duration: Number(duration.toFixed(1)),
        fps: Number((frames * 1000 / duration).toFixed(1)),
        frames,
      })
      return
    }
    requestAnimationFrame(sample)
  }

  requestAnimationFrame(sample)
}))

let elapsed = 0
for (const [label, timestamp] of screenshotTimes) {
  const wait = timestamp - elapsed
  if (wait > 0) await page.waitForTimeout(wait)
  await page.screenshot({
    path: `${output}/entrance-skyfall-${label}.png`,
  })
  elapsed = timestamp
}

await entrance.waitFor({ state: 'visible' })
await page.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'settled'
))
await page.screenshot({
  path: `${output}/entrance-skyfall-100.png`,
})

const settledIndex = await carousel.getAttribute('data-active-index')
await carousel.focus()
await carousel.press('ArrowRight')
await page.waitForTimeout(900)
const handedOffIndex = await carousel.getAttribute('data-active-index')

const metrics = await page.evaluate(() => {
  const measure = performance.getEntriesByName('atlas-gateway-entrance-duration').at(-1)
  const slices = Array.from(document.querySelectorAll('[data-gateway-entrance-slice]'))
  return {
    duration: Number((measure?.duration ?? 0).toFixed(1)),
    inlineTransformCount: slices.filter((slice) => slice.style.transform).length,
    largestContentfulPaint: Number(
      window.__gatewayEntranceMetrics.largestContentfulPaint.toFixed(1),
    ),
    layoutShift: Number(window.__gatewayEntranceMetrics.layoutShift.toFixed(4)),
    sliceCount: slices.length,
    state: document.querySelector('#portfolio-gateway')
      ?.getAttribute('data-gateway-entrance'),
    storage: sessionStorage.getItem('atlas-gateway-entered'),
  }
})
const frameRate = await frameSample

await context.close()
const capturedVideo = await video.path()
await run('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'error',
  '-ss',
  entranceVideoOffsetSeconds.toFixed(3),
  '-i',
  capturedVideo,
  '-t',
  '4.4',
  '-vf',
  'fps=30',
  '-an',
  '-c:v',
  'libx264',
  '-crf',
  '20',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  `${output}/entrance-skyfall.mp4`,
])
await rm(temporaryVideoOutput, { force: true, recursive: true })

const performanceContext = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
  viewport,
})
const performancePage = await performanceContext.newPage()
performancePage.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
performancePage.on('pageerror', (error) => consoleErrors.push(error.message))
await performancePage.addInitScript(() => {
  sessionStorage.removeItem('atlas-gateway-entered')
  sessionStorage.setItem('atlas-entered', '1')
})
await performancePage.goto(origin, { waitUntil: 'domcontentloaded' })
await performancePage.addStyleTag({ content: cleanCaptureStyle })
const performanceEntrance = performancePage.locator('#portfolio-gateway')
await performanceEntrance.waitFor({ state: 'visible' })
await performancePage.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'pending'
))
await performanceEntrance.evaluate((element) => {
  document.documentElement.style.scrollBehavior = 'auto'
  element.scrollIntoView({ behavior: 'instant', block: 'start' })
})
await performancePage.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'entering'
))
const performanceFrameRate = await performancePage.evaluate(() => new Promise((resolve) => {
  const start = performance.now()
  let frames = 0

  const sample = (now) => {
    frames += 1
    const duration = now - start
    if (duration >= 2600) {
      resolve({
        duration: Number(duration.toFixed(1)),
        fps: Number((frames * 1000 / duration).toFixed(1)),
        frames,
      })
      return
    }
    requestAnimationFrame(sample)
  }

  requestAnimationFrame(sample)
}))
await performanceContext.close()

const reducedContext = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  viewport,
})
const reducedPage = await reducedContext.newPage()
await reducedPage.addInitScript(() => {
  sessionStorage.removeItem('atlas-gateway-entered')
  sessionStorage.setItem('atlas-entered', '1')
})
await reducedPage.goto(`${origin}/#portfolio-gateway`, { waitUntil: 'domcontentloaded' })
await reducedPage.addStyleTag({
  content: cleanCaptureStyle,
})
const reducedEntrance = reducedPage.locator('#portfolio-gateway')
await reducedEntrance.evaluate((element) => element.scrollIntoView({ block: 'start' }))
await reducedPage.waitForTimeout(250)
await reducedPage.screenshot({
  path: `${output}/entrance-skyfall-reduced.png`,
})

const reducedAudit = await reducedPage.evaluate(() => {
  const carouselElement = document.querySelector(
    '[aria-label="Portfolio category carousel"]',
  )
  const slices = Array.from(document.querySelectorAll('[data-gateway-entrance-slice]'))
  return {
    disabled: carouselElement?.getAttribute('aria-disabled') ?? null,
    inlineTransformCount: slices.filter((slice) => slice.style.transform).length,
    sliceCount: slices.length,
    state: document.querySelector('#portfolio-gateway')
      ?.getAttribute('data-gateway-entrance'),
  }
})

await reducedContext.close()

const mobileContext = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  reducedMotion: 'no-preference',
  viewport: { height: 844, width: 390 },
})
const mobilePage = await mobileContext.newPage()
mobilePage.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
mobilePage.on('pageerror', (error) => consoleErrors.push(error.message))
await mobilePage.addInitScript(() => {
  sessionStorage.removeItem('atlas-gateway-entered')
  sessionStorage.setItem('atlas-entered', '1')
})
await mobilePage.goto(`${origin}/#portfolio-gateway`, { waitUntil: 'domcontentloaded' })
await mobilePage.addStyleTag({ content: cleanCaptureStyle })
const mobileEntrance = mobilePage.locator('#portfolio-gateway')
await mobileEntrance.evaluate((element) => (
  element.scrollIntoView({ behavior: 'instant', block: 'start' })
))
await mobilePage.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'entering'
))
const mobileFrameRate = await mobilePage.evaluate(() => new Promise((resolve) => {
  const start = performance.now()
  let frames = 0

  const sample = (now) => {
    frames += 1
    const duration = now - start
    if (duration >= 2600) {
      resolve({
        duration: Number(duration.toFixed(1)),
        fps: Number((frames * 1000 / duration).toFixed(1)),
        frames,
      })
      return
    }
    requestAnimationFrame(sample)
  }

  requestAnimationFrame(sample)
}))
await mobilePage.waitForFunction(() => (
  document.querySelector('#portfolio-gateway')
    ?.getAttribute('data-gateway-entrance') === 'settled'
))
await mobilePage.screenshot({
  path: `${output}/entrance-skyfall-mobile.png`,
})
await mobileContext.close()
await browser.close()

if (consoleErrors.length > 0) {
  throw new Error(`Application console errors: ${JSON.stringify(consoleErrors)}`)
}
if (metrics.sliceCount !== 48 || metrics.state !== 'settled' || metrics.storage !== '1') {
  throw new Error(`Entrance did not settle correctly: ${JSON.stringify(metrics)}`)
}
if (metrics.inlineTransformCount !== 0 || metrics.layoutShift > 0.01) {
  throw new Error(`Entrance shifted or retained inline geometry: ${JSON.stringify(metrics)}`)
}
if (settledIndex === handedOffIndex) {
  throw new Error('Carousel interaction did not activate after the entrance')
}
if (
  reducedAudit.disabled !== null
  || reducedAudit.inlineTransformCount !== 0
  || reducedAudit.sliceCount !== 48
  || reducedAudit.state !== 'settled'
) {
  throw new Error(`Reduced-motion state is not settled: ${JSON.stringify(reducedAudit)}`)
}

console.log(JSON.stringify({
  consoleErrors,
  frameRate,
  handedOffIndex,
  metrics,
  mobileFrameRate,
  performanceFrameRate,
  reducedAudit,
  settledIndex,
}))
