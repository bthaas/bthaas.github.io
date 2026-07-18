'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  PRELOADER_DURATION_SECONDS,
  getPreloaderFrame,
  shouldRunPreloader,
} from '@/lib/atlas-motion/entrance'

gsap.registerPlugin(useGSAP, DrawSVGPlugin)

const PRELOADER_STORAGE_KEY = 'atlas-preloader-entered'
const PRELOADER_COMPLETE_EVENT = 'atlas:preloader-complete'

function hasSeenPreloader(): boolean {
  try {
    return sessionStorage.getItem(PRELOADER_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function rememberPreloader(): void {
  try {
    sessionStorage.setItem(PRELOADER_STORAGE_KEY, '1')
  } catch {
    // Storage may be unavailable in a private context; the entrance still completes.
  }
}

function recordStart(): void {
  if (typeof performance.mark !== 'function') return
  performance.clearMarks('atlas-preloader-start')
  performance.clearMeasures('atlas-preloader-duration')
  performance.mark('atlas-preloader-start')
}

function recordEnd(): void {
  if (typeof performance.mark !== 'function' || typeof performance.measure !== 'function') return
  performance.mark('atlas-preloader-end')
  performance.measure(
    'atlas-preloader-duration',
    'atlas-preloader-start',
    'atlas-preloader-end',
  )
}

export function AtlasPreloader() {
  const rootRef = useRef<HTMLDivElement>(null)
  const finishedRef = useRef(false)
  const [active, setActive] = useState(false)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    rememberPreloader()
    document.documentElement.classList.remove('atlas-preloader-active')
    recordEnd()
    window.dispatchEvent(new CustomEvent(PRELOADER_COMPLETE_EVENT))
    setActive(false)
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const eligible = shouldRunPreloader({
      reducedMotion: reducedMotion.matches,
      seen: hasSeenPreloader(),
    })
    if (!eligible) return

    finishedRef.current = false
    document.documentElement.classList.add('atlas-preloader-active')
    recordStart()
    setActive(true)

    const handleMotionChange = () => {
      if (reducedMotion.matches) finish()
    }
    reducedMotion.addEventListener('change', handleMotionChange)

    return () => {
      reducedMotion.removeEventListener('change', handleMotionChange)
      document.documentElement.classList.remove('atlas-preloader-active')
    }
  }, [finish])

  useGSAP(() => {
    const root = rootRef.current
    if (!active || !root) return

    const counter = root.querySelector<HTMLElement>('[data-atlas-preloader-counter]')
    const paper = root.querySelector<HTMLElement>('[data-atlas-preloader-paper]')
    const dusk = root.querySelector<HTMLElement>('[data-atlas-preloader-dusk]')
    const glyph = Array.from(root.querySelectorAll<SVGGeometryElement>(
      '[data-atlas-preloader-glyph]',
    ))
    if (!counter || !paper || !dusk || glyph.length === 0) {
      finish()
      return
    }

    const tracker = { progress: 0 }
    const timeline = gsap.timeline({ onComplete: finish })
    timeline.to(tracker, {
      duration: PRELOADER_DURATION_SECONDS,
      ease: 'none',
      progress: 1,
      onUpdate: () => {
        const { counter: value } = getPreloaderFrame(tracker.progress)
        counter.textContent = String(value).padStart(2, '0')
      },
    }, 0)
    timeline.fromTo(
      glyph,
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.5, ease: 'power2.out', stagger: 0.025 },
      0.04,
    )
    timeline.to(paper, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.13,
      ease: 'power3.inOut',
    }, 0.5)
    timeline.to(dusk, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.23,
      ease: 'power4.inOut',
    }, 0.61)

    return () => timeline.kill()
  }, { dependencies: [active, finish], scope: rootRef })

  if (!active) return null

  return (
    <div
      ref={rootRef}
      className="atlas-preloader"
      data-atlas-preloader
      aria-hidden="true"
    >
      <div className="atlas-preloader__dusk" data-atlas-preloader-dusk />
      <div className="atlas-preloader__paper" data-atlas-preloader-paper>
        <p className="atlas-preloader__counter" data-atlas-preloader-counter>00</p>
        <svg
          className="atlas-preloader__glyph"
          viewBox="0 0 240 150"
          focusable="false"
        >
          <circle data-atlas-preloader-glyph cx="120" cy="55" r="28" />
          <path data-atlas-preloader-glyph d="M20 130 Q74 52 120 113 Q166 52 220 130" />
          <path data-atlas-preloader-glyph d="M42 130 Q79 83 112 119" />
          <path data-atlas-preloader-glyph d="M128 119 Q161 83 198 130" />
          <path data-atlas-preloader-glyph d="M120 84 L120 137" />
        </svg>
        <p className="atlas-preloader__label">Ex alis / Flight atlas</p>
      </div>
    </div>
  )
}
