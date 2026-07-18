'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'

import {
  SUN_SPECTACLE_DURATION_MS,
  advanceKonamiSequence,
} from '@/lib/atlas-motion/sun-spectacle'

const STORAGE_KEY = 'atlas-sun-spectacle'
const SPECTACLE_EVENT = 'atlas:sun-spectacle'
const SUN_HIT_EVENT = 'atlas:sun-hit'

gsap.registerPlugin(useGSAP)

function safeStorageHasRun(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function safeStorageMarkRun() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // The spectacle can still run when storage is unavailable.
  }
}

export function AtlasSpectacle() {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let active = false
    let hitCount = 0
    let konamiIndex = 0
    let timeline: gsap.core.Timeline | null = null

    const trigger = () => {
      if (active || safeStorageHasRun()) return
      active = true
      safeStorageMarkRun()

      const startedAt = performance.now()
      document.documentElement.dataset.atlasSpectacleStart = String(startedAt)
      root.dataset.state = 'active'
      window.dispatchEvent(new CustomEvent(SPECTACLE_EVENT, {
        detail: { duration: SUN_SPECTACLE_DURATION_MS, startedAt },
      }))

      const flare = root.querySelector<HTMLElement>('[data-atlas-sun-flare]')
      const goldenFeather = document.querySelector<HTMLElement>('[data-golden-feather-target]')
      const sun = document.querySelector<HTMLElement>('[data-atlas-sun-trigger]')
      if (sun) {
        const sunBounds = sun.getBoundingClientRect()
        root.style.setProperty('--atlas-flare-x', `${sunBounds.left + sunBounds.width / 2}px`)
        root.style.setProperty('--atlas-flare-y', `${sunBounds.top + sunBounds.height / 2}px`)
      }
      timeline?.kill()
      timeline = gsap.timeline({
        onComplete: () => {
          root.dataset.duration = String(performance.now() - startedAt)
          root.dataset.state = 'settled'
          delete document.documentElement.dataset.atlasSpectacleStart
          active = false
        },
      })

      if (flare) {
        timeline
          .fromTo(
            flare,
            { opacity: 0, scale: 0.18 },
            { duration: 0.24, ease: 'power3.out', opacity: 1, scale: 1.08 },
            0,
          )
          .to(
            flare,
            { duration: 1.12, ease: 'power2.out', opacity: 0, scale: 3.2 },
            0.24,
          )
      }

      if (goldenFeather && sun) {
        const targetBounds = goldenFeather.getBoundingClientRect()
        const sunBounds = sun.getBoundingClientRect()
        const offsetX = sunBounds.left + sunBounds.width / 2
          - (targetBounds.left + targetBounds.width / 2)
        const offsetY = sunBounds.top + sunBounds.height / 2
          - (targetBounds.top + targetBounds.height / 2)
        timeline
          .set(goldenFeather, {
            opacity: 0,
            rotate: -28,
            scale: 0.72,
            transformOrigin: '50% 18%',
            x: offsetX,
            y: offsetY,
          }, 0)
          .to(goldenFeather, { duration: 0.18, opacity: 1 }, 0.56)
          .to(goldenFeather, {
            duration: 2.92,
            ease: 'power2.inOut',
            rotate: 960,
            scale: 1,
            x: 0,
            y: 0,
          }, 0.56)
      }

      timeline.to({}, { duration: SUN_SPECTACLE_DURATION_MS / 1000 }, 0)
    }

    const handleSunHit = () => {
      hitCount += 1
      root.dataset.sunHits = String(Math.min(hitCount, 5))
      if (hitCount >= 5) trigger()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const result = advanceKonamiSequence(konamiIndex, event.key)
      konamiIndex = result.index
      if (result.complete) trigger()
    }

    window.addEventListener(SUN_HIT_EVENT, handleSunHit)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener(SUN_HIT_EVENT, handleSunHit)
      window.removeEventListener('keydown', handleKeyDown)
      timeline?.kill()
      delete document.documentElement.dataset.atlasSpectacleStart
    }
  }, { scope: rootRef })

  return (
    <div
      ref={rootRef}
      className="atlas-spectacle"
      data-testid="atlas-spectacle"
      data-state="idle"
      aria-hidden="true"
    >
      <span className="atlas-spectacle__flare" data-atlas-sun-flare />
    </div>
  )
}
