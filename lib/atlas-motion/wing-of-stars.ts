export const WING_VIEWBOX = {
  height: 500,
  width: 1_000,
} as const

export const CONSTELLATION_ORDER = [
  'languages',
  'frontend',
  'data',
  'cloud-infra',
  'ml-ai',
] as const

export type ConstellationKey = (typeof CONSTELLATION_ORDER)[number]
export type WingStarSize = 1 | 2 | 3

export const CONSTELLATION_LABELS: Readonly<Record<ConstellationKey, string>> = {
  languages: 'Languages',
  frontend: 'Frontend',
  data: 'Data',
  'cloud-infra': 'Cloud + infra',
  'ml-ai': 'ML + AI',
}

export const WING_STAR_ORDER = [
  'TypeScript',
  'HTML5',
  'PostgreSQL',
  'JavaScript',
  'CSS3',
  'MySQL',
  'Python',
  'React',
  'MongoDB',
  'Java',
  'Next.js',
  'Redis',
  'React Native',
  'C / C++',
  'Node.js',
  'Go',
  'Linux',
  'Google Cloud',
  'Rust',
  'Flask',
  'Amazon Web Services',
  'Kubernetes',
  'Docker',
  'Bash',
  'PyTorch',
  'TensorFlow',
  'Claude Code',
  'OpenAI API',
] as const

export type WingStarKey = (typeof WING_STAR_ORDER)[number]

export interface WingStar {
  readonly constellation: ConstellationKey
  readonly size: WingStarSize
  readonly x: number
  readonly y: number
}

export const WING_STARS = {
  TypeScript: { x: 112, y: 288, size: 3, constellation: 'languages' },
  HTML5: { x: 170, y: 245, size: 2, constellation: 'frontend' },
  PostgreSQL: { x: 178, y: 340, size: 2, constellation: 'data' },
  JavaScript: { x: 220, y: 215, size: 2, constellation: 'languages' },
  CSS3: { x: 250, y: 275, size: 1, constellation: 'frontend' },
  MySQL: { x: 270, y: 360, size: 1, constellation: 'data' },
  Python: { x: 315, y: 175, size: 3, constellation: 'languages' },
  React: { x: 350, y: 235, size: 3, constellation: 'frontend' },
  MongoDB: { x: 380, y: 335, size: 2, constellation: 'data' },
  Java: { x: 420, y: 140, size: 2, constellation: 'languages' },
  'Next.js': { x: 455, y: 210, size: 2, constellation: 'frontend' },
  Redis: { x: 490, y: 320, size: 1, constellation: 'data' },
  'React Native': { x: 520, y: 265, size: 2, constellation: 'frontend' },
  'C / C++': { x: 530, y: 110, size: 2, constellation: 'languages' },
  'Node.js': { x: 565, y: 190, size: 2, constellation: 'frontend' },
  Go: { x: 635, y: 84, size: 2, constellation: 'languages' },
  Linux: { x: 650, y: 350, size: 2, constellation: 'cloud-infra' },
  'Google Cloud': { x: 690, y: 300, size: 1, constellation: 'cloud-infra' },
  Rust: { x: 735, y: 65, size: 2, constellation: 'languages' },
  Flask: { x: 730, y: 170, size: 1, constellation: 'frontend' },
  'Amazon Web Services': { x: 760, y: 245, size: 3, constellation: 'cloud-infra' },
  Kubernetes: { x: 770, y: 365, size: 2, constellation: 'cloud-infra' },
  Docker: { x: 820, y: 310, size: 2, constellation: 'cloud-infra' },
  Bash: { x: 845, y: 52, size: 1, constellation: 'languages' },
  PyTorch: { x: 830, y: 105, size: 3, constellation: 'ml-ai' },
  TensorFlow: { x: 890, y: 145, size: 2, constellation: 'ml-ai' },
  'Claude Code': { x: 925, y: 210, size: 2, constellation: 'ml-ai' },
  'OpenAI API': { x: 915, y: 285, size: 3, constellation: 'ml-ai' },
} as const satisfies Readonly<Record<WingStarKey, WingStar>>

export interface WingEdge {
  readonly constellation: ConstellationKey
  readonly from: WingStarKey
  readonly to: WingStarKey
}

export const WING_EDGES = [
  { from: 'TypeScript', to: 'JavaScript', constellation: 'languages' },
  { from: 'JavaScript', to: 'Python', constellation: 'languages' },
  { from: 'Python', to: 'Java', constellation: 'languages' },
  { from: 'Java', to: 'C / C++', constellation: 'languages' },
  { from: 'C / C++', to: 'Go', constellation: 'languages' },
  { from: 'Go', to: 'Rust', constellation: 'languages' },
  { from: 'Rust', to: 'Bash', constellation: 'languages' },
  { from: 'HTML5', to: 'CSS3', constellation: 'frontend' },
  { from: 'CSS3', to: 'React', constellation: 'frontend' },
  { from: 'React', to: 'Next.js', constellation: 'frontend' },
  { from: 'Next.js', to: 'Node.js', constellation: 'frontend' },
  { from: 'React', to: 'React Native', constellation: 'frontend' },
  { from: 'React Native', to: 'Node.js', constellation: 'frontend' },
  { from: 'Node.js', to: 'Flask', constellation: 'frontend' },
  { from: 'PostgreSQL', to: 'MySQL', constellation: 'data' },
  { from: 'MySQL', to: 'MongoDB', constellation: 'data' },
  { from: 'MongoDB', to: 'Redis', constellation: 'data' },
  { from: 'Linux', to: 'Google Cloud', constellation: 'cloud-infra' },
  { from: 'Google Cloud', to: 'Amazon Web Services', constellation: 'cloud-infra' },
  { from: 'Amazon Web Services', to: 'Docker', constellation: 'cloud-infra' },
  { from: 'Amazon Web Services', to: 'Kubernetes', constellation: 'cloud-infra' },
  { from: 'PyTorch', to: 'TensorFlow', constellation: 'ml-ai' },
  { from: 'TensorFlow', to: 'Claude Code', constellation: 'ml-ai' },
  { from: 'Claude Code', to: 'OpenAI API', constellation: 'ml-ai' },
] as const satisfies readonly WingEdge[]

export const WING_OUTLINE_PATH = [
  'M 96 306',
  'C 188 224 338 143 525 92',
  'C 674 50 781 31 854 40',
  'C 872 78 912 129 936 197',
  'C 959 264 937 332 866 397',
  'C 791 424 686 408 574 361',
  'C 432 331 281 393 151 354',
  'Z',
].join(' ')

export function getShootingStarDelayMs(randomValue: number): number {
  const bounded = Math.min(1, Math.max(0, randomValue))
  return 8_000 + bounded * 6_000
}
