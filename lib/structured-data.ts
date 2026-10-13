import { aboutDocument } from '@/content/editorial-documents'
import { siteContent } from '@/content/site-content'
import { SITE_DESCRIPTION, SITE_URL } from '@/lib/site-config'

type JsonLdValue = string | number | boolean | null | JsonLdObject | readonly JsonLdValue[]

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue
}

export const PERSON_ID = `${SITE_URL}/#person`
export const WEBSITE_ID = `${SITE_URL}/#website`

const { contact, education, identity, skills } = siteContent

function uniqueValues(values: readonly string[]): readonly string[] {
  return [...new Set(values)]
}

export function buildPersonJsonLd(): JsonLdObject {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: identity.name,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    jobTitle: identity.title,
    email: `mailto:${contact.email}`,
    sameAs: [contact.github, contact.linkedin],
    address: {
      '@type': 'PostalAddress',
      addressLocality: identity.postalLocation.locality,
      addressRegion: identity.postalLocation.region,
      addressCountry: identity.postalLocation.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'professional inquiries',
      email: contact.email,
      url: `${SITE_URL}/contact`,
      availableLanguage: ['English'],
    },
    alumniOf: education.map(({ institution }) => ({
      '@type': 'CollegeOrUniversity',
      name: institution,
    })),
    knowsAbout: uniqueValues([...education.flatMap(({ focusAreas }) => focusAreas), ...skills['AI / ML']]),
  }
}

export function buildHomeJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: identity.name,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        author: { '@id': PERSON_ID },
        publisher: { '@id': PERSON_ID },
      },
      buildPersonJsonLd(),
    ],
  }
}

export function buildAboutJsonLd(): JsonLdObject {
  const url = `${SITE_URL}${aboutDocument.path}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        name: aboutDocument.metaTitle,
        description: aboutDocument.description,
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: { '@id': PERSON_ID },
      },
      buildPersonJsonLd(),
    ],
  }
}

/** Serializes JSON-LD for an inline script without allowing `</script>` breakouts. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
