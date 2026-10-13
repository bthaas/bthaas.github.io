/**
 * Proactive content negotiation (RFC 9110 §12.5.1) between the HTML page and
 * its Markdown twin, following https://acceptmarkdown.com/guides/accept-parsing:
 * rank by q-value, break ties by specificity, and treat q=0 as a refusal.
 */

export type Representation = 'html' | 'markdown'

export const MEDIA_TYPES: Readonly<Record<Representation, string>> = {
  html: 'text/html',
  markdown: 'text/markdown',
}

interface MediaRange {
  readonly type: string
  readonly subtype: string
  readonly q: number
}

/** How closely a media range matches: exact, `type/*`, or the catch-all wildcard. */
const SPECIFICITY = { none: -1, any: 0, type: 1, exact: 2 } as const
type Specificity = (typeof SPECIFICITY)[keyof typeof SPECIFICITY]

interface Score {
  readonly representation: Representation
  readonly q: number
  readonly specificity: Specificity
}

const QVALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/
const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

function parseQuality(parameters: readonly string[]): number | null {
  for (const parameter of parameters) {
    const [name, value = ''] = parameter.split('=').map((part) => part.trim())
    if (name.toLowerCase() !== 'q') continue
    return QVALUE.test(value) ? Number(value) : null
  }
  return 1
}

function parseMediaRange(entry: string): MediaRange | null {
  const [mediaType = '', ...parameters] = entry.split(';')
  const [type = '', subtype = '', ...extra] = mediaType.trim().toLowerCase().split('/')
  if (extra.length > 0 || !TOKEN.test(type) || !TOKEN.test(subtype)) return null
  if (type === '*' && subtype !== '*') return null

  const q = parseQuality(parameters)
  return q === null ? null : { type, subtype, q }
}

/**
 * Parses an Accept header. `null` means the client expressed no usable
 * preference (absent, empty, or entirely malformed), so the default applies.
 */
export function parseAccept(header: string | null): readonly MediaRange[] | null {
  if (header === null) return null
  const ranges = header
    .split(',')
    .map(parseMediaRange)
    .filter((range): range is MediaRange => range !== null)
  return ranges.length > 0 ? ranges : null
}

function specificityOf(range: MediaRange, mediaType: string): Specificity {
  const [type, subtype] = mediaType.split('/')
  if (range.type === type && range.subtype === subtype) return SPECIFICITY.exact
  if (range.type === type && range.subtype === '*') return SPECIFICITY.type
  if (range.type === '*' && range.subtype === '*') return SPECIFICITY.any
  return SPECIFICITY.none
}

function scoreRepresentation(
  ranges: readonly MediaRange[],
  representation: Representation,
): Score {
  const mediaType = MEDIA_TYPES[representation]
  const unmatched: Score = { representation, q: 0, specificity: SPECIFICITY.none }

  // The most specific matching range decides; equally specific ranges keep the higher q.
  return ranges.reduce<Score>((best, range) => {
    const specificity = specificityOf(range, mediaType)
    if (specificity === SPECIFICITY.none) return best
    if (specificity > best.specificity || (specificity === best.specificity && range.q > best.q)) {
      return { representation, q: range.q, specificity }
    }
    return best
  }, unmatched)
}

function compareScores(left: Score, right: Score): number {
  if (left.q !== right.q) return right.q - left.q
  if (left.specificity !== right.specificity) return right.specificity - left.specificity
  // Equal, explicit preferences come from agents (browsers never list text/markdown),
  // so an exact markdown match wins; otherwise HTML stays the default.
  if (left.specificity === SPECIFICITY.exact) {
    return left.representation === 'markdown' ? -1 : 1
  }
  return left.representation === 'html' ? -1 : 1
}

/**
 * Picks the representation to serve from those available. Returns `null` when
 * every available representation is unacceptable, which maps to 406.
 */
export function selectRepresentation(
  acceptHeader: string | null,
  available: readonly Representation[],
): Representation | null {
  const ranges = parseAccept(acceptHeader)
  if (ranges === null) return available.includes('html') ? 'html' : (available[0] ?? null)

  const [best] = available
    .map((representation) => scoreRepresentation(ranges, representation))
    .filter(({ q }) => q > 0)
    .sort(compareScores)
  return best?.representation ?? null
}
