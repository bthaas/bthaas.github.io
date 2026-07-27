import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Declaration, type Rule } from 'postcss'
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

  it('uses the category color for a solid token with a persistent outline', () => {
    expect(declarationsFor('.skill-workbench__token')).toMatchObject({
      border: '1.5px solid var(--skill-category-color)',
      background: 'color-mix(in srgb, var(--skill-category-color) 12%, #fffef8)',
      'will-change': 'transform',
    })
  })

  it('sizes every desktop token to its full label instead of a fixed tier', () => {
    expect(declarationsFor('.skill-workbench__token')).toMatchObject({
      width: 'max-content',
      'max-width': 'none',
      'grid-template-columns': 'var(--skill-token-glyph) max-content',
    })
    expect(declarationsFor('.skill-workbench__token > span')).toMatchObject({
      overflow: 'visible',
      'text-overflow': 'clip',
      'white-space': 'nowrap',
    })
    expect(stylesheet).not.toContain('[data-skill-size=')
  })

  it('does not reserve header space for a tool-count readout', () => {
    expect(stylesheet).not.toContain('.skill-workbench__meta')
    expect(declarationsFor('.skill-workbench__status')).toMatchObject({
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    })
  })

  it('keeps the actively dragged rigid body above the rest of the pile', () => {
    expect(
      declarationsFor('.skill-workbench__item[data-dragging="true"]'),
    ).toMatchObject({
      'z-index': '4',
    })
  })

  it('retains the static logo-grid fallback for reduced motion and mobile', () => {
    expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)')
    expect(stylesheet).toContain('.skill-workbench__fallback')
    expect(stylesheet).toContain('@media (max-width: 720px)')
    let mobile: AtRule | undefined
    postcss.parse(stylesheet).walkAtRules('media', (rule) => {
      if (rule.params.includes('max-width: 720px')) mobile = rule
    })
    const mobileWorkbench = mobile?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.skill-workbench',
    )
    const mobilePadding = mobileWorkbench?.nodes.find(
      (node): node is Declaration => node.type === 'decl' && node.prop === 'padding',
    )
    expect(mobilePadding?.value.replace(/\s+/g, ' ')).toBe(
      '1.2rem 0.85rem calc(1.35rem + 4.75rem + env(safe-area-inset-bottom))',
    )
    expect(stylesheet).not.toContain('.skill-sphere')
  })
})
