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

describe('Experience timeline', () => {
  it('lays every career stop out as one clean editorial ledger', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(experienceStyles, '.experience-timeline__list')).toMatchObject({
      display: 'grid',
      position: 'relative',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop-header',
      '(min-width: 960px)',
    )).toMatchObject({
      display: 'grid',
      'grid-template-columns': '4rem minmax(16rem, 1.25fr) minmax(13rem, 0.8fr) minmax(10rem, 0.65fr) auto',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop details:not([open]) > .experience-timeline__details',
    )).toMatchObject({
      display: 'none',
    })
  })

  it('uses an intentional stacked route at 390px', () => {
    const mediaQuery = '(max-width: 640px)'
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop-header',
      mediaQuery,
    )).toMatchObject({
      'grid-template-columns': '3rem minmax(0, 1fr) auto',
    })
  })
})
