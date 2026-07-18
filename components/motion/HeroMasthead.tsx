'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useRef } from 'react'

import { getMastheadScatter } from '@/lib/atlas-motion/hero-overdrive'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

const ENTRANCE_STORAGE_KEY = 'atlas-entered'
const PRELOADER_STORAGE_KEY = 'atlas-preloader-entered'

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeEntranceFlag(): void {
  try {
    sessionStorage.setItem(ENTRANCE_STORAGE_KEY, '1')
  } catch {
    // A blocked storage API must never block the masthead.
  }
}

export function HeroMasthead({ name }: { readonly name: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    const heading = headingRef.current
    const html = document.documentElement
    if (!heading) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      html.classList.add('atlas-entered')
      return
    }

    let split: SplitText | null = null
    let entrance: gsap.core.Timeline | null = null
    let scatter: gsap.core.Timeline | null = null
    let disposed = false

    const revealMasks = () => {
      if (split?.lines) gsap.set(split.lines, { overflow: 'visible' })
      gsap.set(heading.querySelectorAll('.hero-masthead__line-mask'), { overflow: 'visible' })
    }

    const prepareMotion = () => {
      if (disposed || split) return
      split = SplitText.create(heading, {
        aria: 'auto',
        linesClass: 'hero-masthead__line',
        mask: 'lines',
        type: 'chars,lines',
      })
      const chars = split.chars
      const hasEntered = readSessionFlag(ENTRANCE_STORAGE_KEY)

      if (hasEntered) {
        html.classList.add('atlas-entered')
        revealMasks()
      } else {
        const chrome = Array.from(document.querySelectorAll<HTMLElement>('.site-nav, .hero-meta'))
        html.classList.remove('atlas-entered')
        html.classList.add('atlas-entering')
        writeEntranceFlag()
        entrance = gsap.timeline({
          onComplete: () => {
            html.classList.remove('atlas-entering')
            html.classList.add('atlas-entered')
            revealMasks()
          },
        })
        entrance.fromTo(
          chars,
          { opacity: 0, yPercent: 110 },
          { duration: 0.36, ease: 'power3.out', opacity: 1, stagger: 0.06, yPercent: 0 },
          0.36,
        )
        if (chrome.length > 0) {
          entrance.fromTo(
            chrome,
            { opacity: 0, y: 8 },
            { duration: 0.38, ease: 'power2.out', opacity: 1, stagger: 0.05, y: 0 },
            0.62,
          )
        }
      }

      scatter = gsap.timeline({
        scrollTrigger: {
          trigger: heading.closest('#hero') ?? heading,
          start: 'bottom 88%',
          end: 'bottom 18%',
          scrub: 0.72,
        },
      })
      scatter.fromTo(
        chars,
        { rotation: 0, x: 0, y: 0 },
        {
          ease: 'none',
          opacity: 0.2,
          rotation: (index: number) => getMastheadScatter(index, chars.length).rotation,
          stagger: 0.012,
          x: (index: number) => getMastheadScatter(index, chars.length).x,
          y: (index: number) => getMastheadScatter(index, chars.length).y,
        },
        0,
      )
    }

    const preloaderPending = !readSessionFlag(PRELOADER_STORAGE_KEY)
    if (preloaderPending) {
      window.addEventListener('atlas:preloader-complete', prepareMotion, { once: true })
    } else {
      prepareMotion()
    }

    return () => {
      disposed = true
      window.removeEventListener('atlas:preloader-complete', prepareMotion)
      entrance?.kill()
      scatter?.kill()
      split?.revert()
      html.classList.remove('atlas-entering')
    }
  }, { dependencies: [name], scope: headingRef })

  return <h1 ref={headingRef} id="hero-name">{name}</h1>
}
