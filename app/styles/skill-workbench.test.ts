import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')

function declarationsFor(selector: string): Record<string, string> {
  const declarations: Record<string, string> = {}
  postcss.parse(stylesheet).walkRules(selector, (rule: Rule) => {
    if (rule.parent?.type !== 'root') return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })
  return declarations
}

describe('Skill Workbench presentation contract', () => {
  it('fits the standalone skills chapter into the viewport', () => {
    expect(declarationsFor('.craft-section')).toMatchObject({
      height: 'calc(100svh - 59px)',
      'min-height': '0',
      overflow: 'hidden',
    })
  })

  it('uses a bounded seven-by-four workbench with touch capture', () => {
    expect(declarationsFor('.skill-workbench__arena')).toMatchObject({
      overflow: 'hidden',
      'touch-action': 'none',
    })
    expect(declarationsFor('.skill-workbench__list')).toMatchObject({
      'grid-template-columns': 'repeat(7, minmax(0, 1fr))',
      'grid-template-rows': 'repeat(4, minmax(0, 1fr))',
    })
  })

  it('uses the category color as a persistent token outline', () => {
    expect(declarationsFor('.skill-workbench__token')).toMatchObject({
      border: '1.5px solid var(--skill-category-color)',
      'will-change': 'transform',
    })
  })

  it('retains the static logo-grid fallback for reduced motion and mobile', () => {
    expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)')
    expect(stylesheet).toContain('.skill-workbench__fallback')
    expect(stylesheet).toContain('@media (max-width: 720px)')
    expect(stylesheet).not.toContain('.skill-sphere')
  })
})
