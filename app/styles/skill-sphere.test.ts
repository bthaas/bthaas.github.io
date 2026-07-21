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

describe('Skill Sphere presentation contract', () => {
  it('uses the cream paper plate and captures touch drags', () => {
    expect(declarationsFor('.skill-sphere__scene')).toMatchObject({
      'aspect-ratio': '2 / 1',
      background: 'var(--paper)',
      'touch-action': 'none',
    })
  })

  it('keeps every focusable chip at least 44px square', () => {
    expect(declarationsFor('.skill-sphere__chip')).toMatchObject({
      height: 'var(--skill-chip-size)',
      'min-height': '44px',
      'min-width': '44px',
      width: 'var(--skill-chip-size)',
    })
  })

  it('uses transforms for projected positions and no animated blur filters', () => {
    expect(declarationsFor('.skill-sphere__item')).toMatchObject({
      position: 'absolute',
      'will-change': 'transform, opacity',
    })
    expect(stylesheet).not.toContain('blur(')
    expect(stylesheet).not.toContain('.skill-globe')
  })

  it('renders the wireframe as non-interactive, non-scaling hairlines behind the chips', () => {
    expect(declarationsFor('.skill-sphere__mesh')).toMatchObject({
      position: 'absolute',
      'pointer-events': 'none',
    })
    expect(declarationsFor('.skill-sphere__edge')).toMatchObject({
      fill: 'none',
      'vector-effect': 'non-scaling-stroke',
    })
  })
})
