export type SkillTokenSize = 'compact' | 'large' | 'medium' | 'small'

export function getSkillTokenSize(label: string): SkillTokenSize {
  const length = label.trim().length

  if (length <= 4) return 'compact'
  if (length <= 7) return 'small'
  if (length <= 11) return 'medium'

  return 'large'
}
