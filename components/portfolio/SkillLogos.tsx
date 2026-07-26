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
import type { CSSProperties } from 'react'

interface IconData {
  readonly hex: string
  readonly path: string
}

export interface SkillCategory {
  readonly label: string
  readonly slug: string
  readonly color: string
}

export interface SkillLogo {
  readonly label: string
  readonly hex: string
  readonly path: string
  readonly category: string
  readonly categorySlug: string
  readonly categoryColor: string
}

type SkillGroups = Readonly<Record<string, readonly string[]>>

type CatalogLogo = Pick<SkillLogo, 'label' | 'hex' | 'path'>

function logo(label: string, icon: IconData): CatalogLogo {
  return { label, hex: icon.hex, path: icon.path }
}

const claudeCodeIcon: IconData = {
  hex: 'D97757',
  path: 'M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z',
}

const skillLogoCatalog: Readonly<Partial<Record<string, readonly CatalogLogo[]>>> = {
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

const skillCategoryCatalog: Readonly<Record<string, Omit<SkillCategory, 'label'>>> = {
  Languages: { slug: 'languages', color: '#9A6F00' },
  Frameworks: { slug: 'frameworks', color: '#276F9F' },
  'Cloud & DevOps': { slug: 'cloud-devops', color: '#7251A4' },
  Databases: { slug: 'databases', color: '#3F7C46' },
  'AI / ML': { slug: 'ai-ml', color: '#B65324' },
}

function categoryFor(label: string): SkillCategory {
  const category = skillCategoryCatalog[label]

  if (category) return { label, ...category }

  return {
    label,
    slug: label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, ''),
    color: '#52564F',
  }
}

export function getSkillLogos(skills: SkillGroups): readonly SkillLogo[] {
  const seen = new Set<string>()

  return Object.entries(skills).flatMap(([categoryLabel, group]) => {
    const category = categoryFor(categoryLabel)

    return group.flatMap((skill) =>
      (skillLogoCatalog[skill] ?? []).flatMap((entry) => {
        if (seen.has(entry.label)) return []
        seen.add(entry.label)

        return [{
          ...entry,
          category: category.label,
          categorySlug: category.slug,
          categoryColor: category.color,
        }]
      }),
    )
  })
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
          data-skill-category={logoEntry.categorySlug}
          data-skill-logo={logoEntry.label}
          key={logoEntry.label}
          style={{
            '--skill-category-color': logoEntry.categoryColor,
            color: `#${logoEntry.hex}`,
          } as CSSProperties}
          tabIndex={0}
        >
          <SkillLogoGlyph logoEntry={logoEntry} />
          <span className="skill-logo__name">{logoEntry.label}</span>
        </li>
      ))}
    </ul>
  )
}
