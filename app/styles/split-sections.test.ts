import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(
  stylesheet: string,
  selector: string,
  mediaQuery?: string,
): Record<string, string> {
  const root = postcss.parse(stylesheet)
  const declarations: Record<string, string> = {}

  root.walkRules(selector, (rule: Rule) => {
    const parent = rule.parent
    const parentMedia = parent?.type === 'atrule' && (parent as AtRule).name === 'media'
      ? (parent as AtRule).params
      : undefined

    if (parentMedia !== mediaQuery) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('Experience flight path', () => {
  it('keeps the experience chapters readable by default and horizontal only when enhanced', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(experienceStyles, '.experience-flight__chapters')).toMatchObject({
      display: 'grid',
      gap: '1rem',
    })
    expect(declarationsFor(
      experienceStyles,
      '[data-experience-flight-enhanced] .experience-flight__chapters',
      '(min-width: 960px)',
    )).toMatchObject({
      display: 'flex',
      width: 'max-content',
    })
  })

  it('keeps experience in normal document flow on narrow screens', () => {
    const mediaQuery = '(max-width: 720px)'
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(experienceStyles, '.experience-flight__viewport')).toMatchObject({
      position: 'relative',
      width: 'var(--shell)',
    })
  })
})
