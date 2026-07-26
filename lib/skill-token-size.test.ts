import { describe, expect, it } from 'vitest'

import { getSkillTokenSize } from './skill-token-size'

describe('getSkillTokenSize', () => {
  it.each([
    ['Go', 'compact'],
    ['Java', 'compact'],
    ['Rust', 'compact'],
    ['Python', 'small'],
    ['C / C++', 'small'],
    ['Next.js', 'small'],
    ['TypeScript', 'medium'],
    ['OpenAI API', 'medium'],
    ['Claude Code', 'medium'],
    ['React Native', 'large'],
    ['Google Cloud', 'large'],
    ['Amazon Web Services', 'large'],
  ] as const)('maps %s to the %s tier', (label, expected) => {
    expect(getSkillTokenSize(label)).toBe(expected)
  })

  it('uses every tier across the portfolio skill set', () => {
    const labels = [
      'Go',
      'Python',
      'TypeScript',
      'Amazon Web Services',
    ]

    expect(new Set(labels.map(getSkillTokenSize))).toEqual(new Set([
      'compact',
      'small',
      'medium',
      'large',
    ]))
  })
})
