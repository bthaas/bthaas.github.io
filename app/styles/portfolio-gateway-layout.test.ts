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
  it('owns the complete desktop viewport with a narrow title overlap', () => {
    const stylesheet = readFileSync(gatewayStylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.portfolio-gateway')).toMatchObject({
      height: '100svh',
      'min-height': '0',
      overflow: 'hidden',
    })
    expect(declarationsFor(stylesheet, '.portfolio-gateway__visual').top).toBe(
      'clamp(13rem, 29vh, 16rem)',
    )
    expect(declarationsFor(stylesheet, '.portfolio-gateway__fallback-ring').height).toBe('68%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__side-arrow').top).toBe('34%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__side-arrow svg')).toMatchObject({
      display: 'block',
      height: '1em',
      width: '1em',
    })
    expect(declarationsFor(stylesheet, '.portfolio-gateway__controls')).toEqual({})
  })

  it('reserves the fixed mobile navigation without restoring the bottom controls', () => {
    const stylesheet = readFileSync(gatewayStylesheetPath, 'utf8')
    const media = '(max-width: 720px)'

    expect(declarationsFor(stylesheet, '.portfolio-gateway', media)).toMatchObject({
      height: 'calc(100svh - 4.75rem - env(safe-area-inset-bottom))',
      'min-height': '0',
    })
    expect(declarationsFor(stylesheet, '.portfolio-gateway__word', media).top).toBe('30%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__visual', media).top).toBe('31%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__side-arrow', media).top).toBe('31%')
    expect(declarationsFor(stylesheet, '.portfolio-gateway__controls', media)).toEqual({})
  })

  it('removes the superseded hero stylesheet', () => {
    expect(existsSync(heroStylesheetPath)).toBe(false)
  })
})
