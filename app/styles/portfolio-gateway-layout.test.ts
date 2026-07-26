import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const gatewayStylesheetPath = resolve(process.cwd(), 'app/styles/portfolio-gateway.css')
const heroStylesheetPath = resolve(process.cwd(), 'app/styles/hero.css')

function declarationsFor(
  stylesheet: string,
  selector: string,
  media?: string,
): Record<string, string> {
  const declarations: Record<string, string> = {}

  postcss.parse(stylesheet).walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return
    const parent = rule.parent
    const parentMedia = parent?.type === 'atrule' && (parent as AtRule).name === 'media'
      ? (parent as AtRule).params
      : undefined
    if (parentMedia !== media) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('single-screen portfolio gateway layout', () => {
  it('owns exactly the viewport space below the desktop header', () => {
    const stylesheet = readFileSync(gatewayStylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.portfolio-gateway')).toMatchObject({
      height: 'calc(100svh - var(--site-header-height))',
      'min-height': '0',
      overflow: 'hidden',
    })
    expect(declarationsFor(stylesheet, '.portfolio-gateway__visual').top).toBe(
      'clamp(10.5rem, 22vh, 12.5rem)',
    )
    expect(declarationsFor(stylesheet, '.portfolio-gateway__fallback-ring').height).toBe('68%')
  })

  it('keeps the mobile poster inside the shorter header-adjusted viewport', () => {
    const stylesheet = readFileSync(gatewayStylesheetPath, 'utf8')
    const media = '(max-width: 720px)'

    expect(declarationsFor(stylesheet, '.portfolio-gateway', media)).toMatchObject({
      height: 'calc(100svh - var(--site-header-height))',
      'min-height': '0',
    })
    expect(declarationsFor(stylesheet, '.portfolio-gateway__word', media).top).toBe('28%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__visual', media).top).toBe('31%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__controls', media).top).toBe(
      'calc(31% + min(22rem, 42svh))',
    )
  })

  it('removes the superseded hero stylesheet', () => {
    expect(existsSync(heroStylesheetPath)).toBe(false)
  })
})
