export interface SitePageCopy {
  readonly path: '/experience' | '/projects' | '/skills' | '/contact'
  readonly title: string
  readonly description: string
}

/** Metadata shared by the portfolio screens and their Markdown twins. */
export const sitePages = {
  experience: {
    path: '/experience',
    title: 'Experience | Brett Haas',
    description: 'Brett Haas — research, model evaluation, and production software experience.',
  },
  projects: {
    path: '/projects',
    title: 'Projects | Brett Haas',
    description: 'Computer vision, collaborative systems, and language-model research projects.',
  },
  skills: {
    path: '/skills',
    title: 'Skills | Brett Haas',
    description: 'The engineering, machine-learning, and product skills behind Brett Haas’s work.',
  },
  contact: {
    path: '/contact',
    title: 'Contact | Brett Haas',
    description: 'Contact Brett Haas about software engineering, machine learning, and research.',
  },
} as const satisfies Record<string, SitePageCopy>

export const contactCopy = {
  intro:
    'Always open to a conversation about interesting ideas, thoughtful products, and the systems that make them work.',
  topics: 'software engineering, machine learning, and research',
  note: 'There is no contact form, newsletter, or mailing list on this site. Email is the most direct way to reach me, and messages are used only to reply.',
  siteGuide:
    'Background, education, and selected work are summarized on the About page, and the Privacy page explains how messages and visits are handled.',
} as const
