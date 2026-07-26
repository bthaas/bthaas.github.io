import type { EducationEntry, ExperienceEntry } from '@/content/site-content'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

interface ExperienceChapterScrollInput {
  readonly count: number
  readonly headerOffset: number
  readonly index: number
  readonly pinDistance: number
  readonly pinStart: number
}

interface ParsedMonth {
  readonly index: number
}

export interface ExperienceTimelineMarker {
  readonly label: string
  readonly position: number
}

export interface ExperienceTimelineItem {
  readonly end: number
  readonly id: string
  readonly kind: 'education' | 'experience'
  readonly label: string
  readonly period: string
  readonly start: number
}

export interface ExperienceTimeline {
  readonly endLabel: string
  readonly items: readonly ExperienceTimelineItem[]
  readonly markers: readonly ExperienceTimelineMarker[]
  readonly startLabel: string
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function parseMonth(label: string): ParsedMonth {
  const match = label.trim().match(/^([A-Z][a-z]{2})\s+(\d{4})$/)
  const month = match
    ? MONTHS.indexOf(match[1] as (typeof MONTHS)[number])
    : -1
  if (!match || month < 0) {
    throw new Error(`Unsupported experience date: "${label}"`)
  }

  const year = Number(match[2])
  return {
    index: year * 12 + month,
  }
}

function parsePeriod(period: string) {
  const parts = period.split(/\s+[–—-]\s+/)
  if (parts.length !== 2) {
    throw new Error(`Unsupported experience period: "${period}"`)
  }
  return {
    end: parseMonth(parts[1]),
    start: parseMonth(parts[0]),
  }
}

function formatMarker(monthIndex: number) {
  const year = Math.floor(monthIndex / 12)
  const month = monthIndex % 12
  return `${MONTHS[month]} ’${String(year).slice(-2)}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildExperienceTimeline(
  experience: readonly ExperienceEntry[],
  education: readonly EducationEntry[],
): ExperienceTimeline {
  const roles = experience.map((entry) => ({
    entry,
    ...parsePeriod(entry.period),
  }))
  const studies = education.map((entry) => ({
    entry,
    graduation: parseMonth(entry.graduation),
  }))
  const allDates = [
    ...roles.flatMap(({ start, end }) => [start, end]),
    ...studies.map(({ graduation }) => graduation),
  ]

  if (allDates.length === 0) {
    return { endLabel: '', items: [], markers: [], startLabel: '' }
  }

  const startMonth = Math.min(...allDates.map(({ index }) => index))
  const endMonth = Math.max(...allDates.map(({ index }) => index))
  const duration = Math.max(1, endMonth - startMonth)
  const normalize = (monthIndex: number) => (monthIndex - startMonth) / duration
  const markerMonths = [...new Set(allDates.map(({ index }) => index))].sort(
    (a, b) => a - b,
  )

  return {
    startLabel: formatFullMonth(startMonth),
    endLabel: formatFullMonth(endMonth),
    markers: markerMonths.map((monthIndex) => ({
      label: formatMarker(monthIndex),
      position: normalize(monthIndex),
    })),
    items: [
      ...roles.map(({ entry, start, end }) => ({
        end: normalize(end.index),
        id: entry.id,
        kind: 'experience' as const,
        label: entry.organization,
        period: entry.period,
        start: normalize(start.index),
      })),
      ...studies.map(({ entry, graduation }) => {
        const position = normalize(graduation.index)
        return {
          end: position,
          id: `education-${slugify(entry.institution)}`,
          kind: 'education' as const,
          label: entry.institution,
          period: entry.graduation,
          start: position,
        }
      }),
    ],
  }
}

function formatFullMonth(monthIndex: number) {
  const year = Math.floor(monthIndex / 12)
  return `${MONTHS[monthIndex % 12]} ${year}`
}

export function getExperienceChapterProgress(index: number, count: number) {
  if (count <= 1) return 0
  return clamp(index / (count - 1), 0, 1)
}

export function getExperienceChapterScrollY({
  count,
  headerOffset,
  index,
  pinDistance,
  pinStart,
}: ExperienceChapterScrollInput) {
  return Math.max(
    0,
    pinStart
      - headerOffset
      + pinDistance * getExperienceChapterProgress(index, count),
  )
}
