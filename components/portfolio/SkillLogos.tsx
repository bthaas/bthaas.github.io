import {
  siAmazonwebservices,
  siCplusplus,
  siCss3,
  siDocker,
  siFlask,
  siGnubash,
  siGo,
  siGooglecloud,
  siHtml5,
  siJavascript,
  siKubernetes,
  siLinux,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siOpenai,
  siOpenjdk,
  siPostgresql,
  siPytorch,
  siPython,
  siReact,
  siRedis,
  siRust,
  siTensorflow,
  siTypescript,
} from 'simple-icons'

interface IconData {
  readonly hex: string
  readonly path: string
}

export interface SkillLogo {
  readonly label: string
  readonly hex: string
  readonly path: string
}

type SkillGroups = Readonly<Record<string, readonly string[]>>

function logo(label: string, icon: IconData): SkillLogo {
  return { label, hex: icon.hex, path: icon.path }
}

const claudeCodeIcon: IconData = {
  hex: 'D97757',
  path: 'M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z',
}

const skillLogoCatalog: Readonly<Partial<Record<string, readonly SkillLogo[]>>> = {
  TypeScript: [logo('TypeScript', siTypescript)],
  JavaScript: [logo('JavaScript', siJavascript)],
  Python: [logo('Python', siPython)],
  Java: [logo('Java', siOpenjdk)],
  'C/C++': [logo('C / C++', siCplusplus)],
  Go: [logo('Go', siGo)],
  Rust: [logo('Rust', siRust)],
  Bash: [logo('Bash', siGnubash)],
  'HTML/CSS': [logo('HTML5', siHtml5), logo('CSS3', siCss3)],
  React: [logo('React', siReact)],
  'React Native': [logo('React Native', siReact)],
  'Next.js': [logo('Next.js', siNextdotjs)],
  'Node.js': [logo('Node.js', siNodedotjs)],
  Flask: [logo('Flask', siFlask)],
  PyTorch: [logo('PyTorch', siPytorch)],
  TensorFlow: [logo('TensorFlow', siTensorflow)],
  'Claude Code': [logo('Claude Code', claudeCodeIcon)],
  AWS: [logo('Amazon Web Services', siAmazonwebservices)],
  Docker: [logo('Docker', siDocker)],
  Kubernetes: [logo('Kubernetes', siKubernetes)],
  'Google Cloud': [logo('Google Cloud', siGooglecloud)],
  Linux: [logo('Linux', siLinux)],
  PostgreSQL: [logo('PostgreSQL', siPostgresql)],
  MySQL: [logo('MySQL', siMysql)],
  MongoDB: [logo('MongoDB', siMongodb)],
  Redis: [logo('Redis', siRedis)],
  'OpenAI API': [logo('OpenAI API', siOpenai)],
}

export function getSkillLogos(skills: SkillGroups): readonly SkillLogo[] {
  const seen = new Set<string>()

  return Object.values(skills).flatMap((group) =>
    group.flatMap((skill) =>
      (skillLogoCatalog[skill] ?? []).filter((entry) => {
        if (seen.has(entry.label)) return false
        seen.add(entry.label)
        return true
      }),
    ),
  )
}

function SkillLogoGlyph({ logoEntry }: { readonly logoEntry: SkillLogo }) {
  return (
    <svg
      className="skill-logo__glyph"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path fill="currentColor" d={logoEntry.path} />
    </svg>
  )
}

export function SkillLogoGrid({ logos }: { readonly logos: readonly SkillLogo[] }) {
  return (
    <ul
      className="craft-logo-grid"
      aria-label="Technologies and programming languages Brett Haas works with"
    >
      {logos.map((logoEntry) => (
        <li
          className="skill-logo"
          data-skill-logo={logoEntry.label}
          key={logoEntry.label}
          style={{ color: `#${logoEntry.hex}` }}
          tabIndex={0}
        >
          <SkillLogoGlyph logoEntry={logoEntry} />
          <span className="skill-logo__name">{logoEntry.label}</span>
        </li>
      ))}
    </ul>
  )
}

export function SkillLogoSequence({
  logos,
  duplicate = false,
}: {
  readonly logos: readonly SkillLogo[]
  readonly duplicate?: boolean
}) {
  return (
    <div
      className="craft-marquee__sequence"
      aria-hidden="true"
      data-duplicate={duplicate || undefined}
    >
      {logos.map((logoEntry) => (
        <span
          className="craft-marquee__logo"
          key={logoEntry.label}
          style={{ color: `#${logoEntry.hex}` }}
        >
          <SkillLogoGlyph logoEntry={logoEntry} />
        </span>
      ))}
    </div>
  )
}
