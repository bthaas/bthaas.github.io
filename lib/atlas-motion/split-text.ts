export type SplitTextMode = 'character' | 'word'

export interface SplitTextSegment {
  readonly index: number
  readonly isWhitespace: boolean
  readonly value: string
}

export interface SplitTextPlan {
  readonly accessibleLabel: string
  readonly segments: readonly SplitTextSegment[]
}

export function planSplitText(text: string, mode: SplitTextMode): SplitTextPlan {
  const values = mode === 'character' ? Array.from(text) : text.split(/(\s+)/).filter(Boolean)
  let visibleIndex = 0

  return {
    accessibleLabel: text,
    segments: values.map((value) => {
      const isWhitespace = /^\s+$/.test(value)
      const segment = {
        index: isWhitespace ? -1 : visibleIndex,
        isWhitespace,
        value,
      }
      if (!isWhitespace) visibleIndex += 1
      return segment
    }),
  }
}
