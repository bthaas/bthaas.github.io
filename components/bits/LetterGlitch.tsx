'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface LetterGlitchProps {
  readonly className?: string
  readonly glitchSpeed?: number
  readonly message: string
}

interface GlitchCell {
  colorIndex: number
  glyphIndex: number
}

const INK_COLORS = ['#11130f', '#393152', '#65665f', '#b58a19'] as const
const FONT_SIZE = 13
const CELL_WIDTH = 9
const CELL_HEIGHT = 17

gsap.registerPlugin(useGSAP)

/**
 * Source-vendored from React Bits LetterGlitch. The atlas adaptation keeps one
 * canvas variant, derives its glyphs from the missing-plate message, and uses
 * GSAP's shared ticker so lifecycle cleanup stays inside useGSAP.
 */
export default function LetterGlitch({
  className = '',
  glitchSpeed = 74,
  message,
}: LetterGlitchProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(false)
  const glyphs = useMemo(
    () => Array.from(`${message.toUpperCase()} · 404 /—`),
    [message],
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(!media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useGSAP(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!enabled || !root || !canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let columns = 0
    let rows = 0
    let cells: GlitchCell[] = []
    let lastUpdate = -glitchSpeed

    const draw = () => {
      const bounds = canvas.getBoundingClientRect()
      context.clearRect(0, 0, bounds.width, bounds.height)
      context.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`
      context.textBaseline = 'top'
      for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index]
        context.fillStyle = INK_COLORS[cell.colorIndex]
        context.globalAlpha = cell.colorIndex === 0 ? 0.62 : 0.34
        context.fillText(
          glyphs[cell.glyphIndex],
          (index % columns) * CELL_WIDTH,
          Math.floor(index / columns) * CELL_HEIGHT,
        )
      }
      context.globalAlpha = 1
    }

    const resize = () => {
      const bounds = root.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.round(bounds.width * dpr))
      canvas.height = Math.max(1, Math.round(bounds.height * dpr))
      canvas.style.width = `${bounds.width}px`
      canvas.style.height = `${bounds.height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = Math.max(1, Math.ceil(bounds.width / CELL_WIDTH))
      rows = Math.max(1, Math.ceil(bounds.height / CELL_HEIGHT))
      cells = Array.from({ length: columns * rows }, (_, index) => ({
        colorIndex: index % 17 === 0 ? 3 : index % 5 === 0 ? 1 : 0,
        glyphIndex: (index * 7 + Math.floor(index / columns) * 3) % glyphs.length,
      }))
      draw()
    }

    const tick = (timeSeconds: number) => {
      const elapsed = timeSeconds * 1000
      if (elapsed - lastUpdate < glitchSpeed || cells.length === 0) return
      lastUpdate = elapsed
      const updateCount = Math.max(1, Math.floor(cells.length * 0.026))
      for (let index = 0; index < updateCount; index += 1) {
        const cellIndex = Math.floor(Math.random() * cells.length)
        const cell = cells[cellIndex]
        cell.glyphIndex = Math.floor(Math.random() * glyphs.length)
        cell.colorIndex = Math.random() > 0.88 ? 3 : Math.random() > 0.68 ? 1 : 0
      }
      draw()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    resize()
    gsap.ticker.add(tick)
    gsap.fromTo(canvas, { opacity: 0 }, { duration: 0.45, opacity: 1 })
    return () => {
      gsap.ticker.remove(tick)
      resizeObserver.disconnect()
    }
  }, { dependencies: [enabled, glitchSpeed, glyphs], scope: rootRef })

  return (
    <div
      ref={rootRef}
      className={`letter-glitch ${className}`.trim()}
      data-letter-glitch
      aria-hidden="true"
    >
      {enabled && <canvas ref={canvasRef} aria-hidden="true" />}
    </div>
  )
}
