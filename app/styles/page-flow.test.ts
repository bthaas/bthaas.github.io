import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheetPath = resolve(process.cwd(), 'app/styles/page-flow.css')

function declarationsFor(stylesheet: string, selector: string): Record<string, string> {
  const declarations: Record<string, string> = {}

  postcss.parse(stylesheet).walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('continuous page color system', () => {
  it('keeps the home gateway and skills cream without the centered hairline', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')
    const root = declarationsFor(stylesheet, ':root')

    expect(root).toMatchObject({
      '--page-accent': '#8e6810',
      '--page-rule': 'rgb(17 19 15 / 14%)',
      '--page-surface': 'var(--cream)',
    })

    for (const selector of ['.portfolio-gateway', '.craft-section']) {
      expect(declarationsFor(stylesheet, selector)).toMatchObject({
        'background-color': 'var(--page-surface)',
        'background-image': 'none',
        color: 'var(--ink)',
      })
    }
  })

  it('uses one shared hairline across the later light chapters', () => {
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    for (const selector of [
      '.experience-section',
      '.projects-section',
      '.contact-section',
    ]) {
      expect(declarationsFor(stylesheet, selector)).toMatchObject({
        'background-color': 'var(--page-surface)',
        color: 'var(--ink)',
      })
      expect(declarationsFor(stylesheet, selector)['background-image']).toContain(
        'var(--page-rule)',
      )
    }
  })

  it('keeps the experience flight path on the shared light editorial field', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.experience-section')).toMatchObject({
      'background-color': 'var(--page-surface)',
      color: 'var(--ink)',
    })
    expect(
      declarationsFor(stylesheet, '.experience-section')['background-image'],
    ).toContain('var(--page-rule)')
  })

  it('uses the same cream surface and soft rules through skills and contact', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.craft-section')).toMatchObject({
      'background-color': 'var(--page-surface)',
    })
    expect(declarationsFor(stylesheet, '.contact-board')).toMatchObject({
      'border-top-color': 'var(--page-rule)',
    })
  })
})
