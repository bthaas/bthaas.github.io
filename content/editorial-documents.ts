import { joinNames } from './site-overview'
import { siteContent } from './site-content'

export interface InlineLink {
  readonly text: string
  readonly href: string
}

/** A run of prose; links stay structured so HTML and Markdown render them natively. */
export type InlineText = readonly (string | InlineLink)[]

export type DocumentBlock =
  | { readonly kind: 'paragraph'; readonly content: InlineText }
  | { readonly kind: 'list'; readonly items: readonly InlineText[] }

export interface DocumentSection {
  readonly id: string
  readonly heading: string
  readonly blocks: readonly DocumentBlock[]
}

export interface EditorialDocument {
  readonly path: '/about' | '/privacy'
  readonly eyebrow: string
  readonly title: string
  readonly metaTitle: string
  readonly description: string
  readonly lede: string
  readonly updated: string | null
  readonly sections: readonly DocumentSection[]
}

const { contact, education, experience, identity, projects, skills } = siteContent
const emailLink: InlineLink = { text: contact.email, href: `mailto:${contact.email}` }

function paragraph(...content: InlineText): DocumentBlock {
  return { kind: 'paragraph', content }
}

function list(items: readonly InlineText[]): DocumentBlock {
  return { kind: 'list', items }
}

const [degree] = education

export const aboutDocument: EditorialDocument = {
  path: '/about',
  eyebrow: 'About',
  title: `About ${identity.name}`,
  metaTitle: `About | ${identity.name}`,
  description: `${identity.name} is a ${identity.title.toLowerCase()} in ${identity.location} working across applied AI research, model evaluation, and production software.`,
  lede: `I’m a ${identity.title.toLowerCase()} in ${identity.location}, building ambitious products across AI, web, mobile, and intelligent systems.`,
  updated: null,
  sections: [
    {
      id: 'focus',
      heading: 'Focus',
      blocks: [
        paragraph(
          'My work sits where dependable product engineering meets applied AI research: shipping cross-platform mobile and cloud software, red-teaming and evaluating frontier language models, and studying how inference-time interventions change model behavior without retraining.',
        ),
      ],
    },
    {
      id: 'education',
      heading: 'Education',
      blocks: [
        paragraph(
          `${degree.degree}, ${degree.institution} (${degree.location}), ${degree.graduation}. Focus areas: ${joinNames(degree.focusAreas)}.`,
        ),
      ],
    },
    {
      id: 'experience',
      heading: 'Experience',
      blocks: [
        list(experience.map((entry) => [
          `${entry.role}${entry.team ? ` (${entry.team})` : ''}, ${entry.organization}, ${entry.period}. ${entry.summary ?? ''}`.trim(),
        ])),
        paragraph('Role-by-role highlights are on the ', { text: 'experience page', href: '/experience' }, '.'),
      ],
    },
    {
      id: 'projects',
      heading: 'Selected projects',
      blocks: [
        list(projects.map((project) => [
          { text: project.name, href: `/projects/${project.id}` },
          `: ${project.description}`,
        ])),
      ],
    },
    {
      id: 'tools',
      heading: 'Tools',
      blocks: [
        list(Object.entries(skills).map(([category, entries]) => [
          `${category}: ${entries.join(', ')}.`,
        ])),
      ],
    },
    {
      id: 'elsewhere',
      heading: 'Elsewhere',
      blocks: [
        paragraph(
          'Email ',
          emailLink,
          ', browse code on ',
          { text: 'GitHub', href: contact.github },
          ', or connect on ',
          { text: 'LinkedIn', href: contact.linkedin },
          '. How this site handles data is described in the ',
          { text: 'privacy policy', href: '/privacy' },
          '.',
        ),
      ],
    },
  ],
}

export const privacyDocument: EditorialDocument = {
  path: '/privacy',
  eyebrow: 'Privacy',
  title: 'Privacy policy',
  metaTitle: `Privacy | ${identity.name}`,
  description: `How ${identity.name}’s portfolio site handles visitor data: no accounts, forms, cookies, analytics, or trackers.`,
  lede: 'This is a static personal portfolio. It has no accounts, forms, analytics, advertising, or third-party trackers, and its code does not set cookies. The only personal information I receive is what you choose to send me by email.',
  updated: 'October 12, 2026',
  sections: [
    {
      id: 'visits',
      heading: 'When you visit',
      blocks: [
        paragraph(
          'Requests to this site pass through Cloudflare (DNS, content delivery, and security) and are served by GitHub Pages (hosting). To deliver pages and protect the site, these providers process standard request data such as your IP address, browser user agent, requested URL, referrer, and the time of the request. Cloudflare may also ask your browser to report network errors so delivery problems can be detected, and may set strictly necessary security cookies if it needs to screen traffic for abuse.',
        ),
        paragraph(
          'Their handling of that data is governed by the ',
          { text: 'Cloudflare privacy policy', href: 'https://www.cloudflare.com/privacypolicy/' },
          ' and the ',
          {
            text: 'GitHub General Privacy Statement',
            href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
          },
          '. I do not use this data to identify, track, or profile visitors.',
        ),
      ],
    },
    {
      id: 'browser-storage',
      heading: 'Browser storage',
      blocks: [
        paragraph(
          'The site keeps a few small flags in your browser’s session storage so that introductory animations play only once per visit. They contain no personal information, are never sent to a server, and are cleared when you close the tab. Every image, script, and 3D model is served from this domain, and no third-party scripts, fonts, or embeds load.',
        ),
      ],
    },
    {
      id: 'email',
      heading: 'Email',
      blocks: [
        paragraph(
          'If you write to ',
          emailLink,
          ', I receive your email address, your message, and anything you attach. I use it only to read and reply to you. I do not add you to a mailing list, sell your information, or share it with anyone else. Email is delivered and stored by my email provider, Google, under its own privacy terms. You can ask me to delete our correspondence at any time.',
        ),
      ],
    },
    {
      id: 'automated-access',
      heading: 'AI agents and automated access',
      blocks: [
        paragraph(
          'Pages are also available as Markdown for AI agents and other automated clients. Those requests are handled exactly like ordinary page requests, and no additional data is collected.',
        ),
      ],
    },
    {
      id: 'other-sites',
      heading: 'Other sites and apps',
      blocks: [
        paragraph(
          'Links to GitHub, LinkedIn, and project repositories leave this site, and those services’ own privacy policies apply. The PouchLess app, whose support pages are hosted on this domain, has its own ',
          { text: 'PouchLess privacy policy', href: '/nicotine/privacy/' },
          '.',
        ),
      ],
    },
    {
      id: 'children',
      heading: 'Children',
      blocks: [
        paragraph(
          'This site is not directed to children under 13, and I do not knowingly collect personal information from them.',
        ),
      ],
    },
    {
      id: 'changes',
      heading: 'Changes and questions',
      blocks: [
        paragraph(
          'If this policy changes, the effective date at the top of the page will change with it. Questions about privacy can be sent to ',
          emailLink,
          '.',
        ),
      ],
    },
  ],
}

export const editorialDocuments = [aboutDocument, privacyDocument] as const

export function getInlinePlainText(content: InlineText): string {
  return content.map((segment) => (typeof segment === 'string' ? segment : segment.text)).join('')
}
