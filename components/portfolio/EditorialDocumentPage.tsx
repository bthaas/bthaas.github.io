import type {
  DocumentBlock,
  EditorialDocument,
  InlineText,
} from '@/content/editorial-documents'

import { AtlasNavigation } from './AtlasNavigation'

interface EditorialDocumentPageProps {
  readonly document: EditorialDocument
}

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}

function Inline({ content }: { readonly content: InlineText }) {
  return content.map((segment, index) => {
    if (typeof segment === 'string') return segment
    const external = isExternal(segment.href)
    return (
      <a
        href={segment.href}
        key={`${segment.href}-${index}`}
        rel={external ? 'noreferrer' : undefined}
        target={external ? '_blank' : undefined}
      >
        {segment.text}
      </a>
    )
  })
}

function Block({ block }: { readonly block: DocumentBlock }) {
  if (block.kind === 'paragraph') {
    return <p><Inline content={block.content} /></p>
  }
  return (
    <ul>
      {block.items.map((item, index) => (
        <li key={index}><Inline content={item} /></li>
      ))}
    </ul>
  )
}

/** Long-form editorial page (About, Privacy) in the atlas visual language. */
export function EditorialDocumentPage({ document }: EditorialDocumentPageProps) {
  const titleId = `${document.path.slice(1)}-title`

  return (
    <>
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <AtlasNavigation current="document" />
      <main className="editorial-document" id="document-content">
        <article className="atlas-shell editorial-grid" aria-labelledby={titleId}>
          <header className="editorial-document__header">
            <p className="eyebrow">{document.eyebrow}</p>
            {document.updated && (
              <p className="editorial-document__updated">Effective {document.updated}</p>
            )}
            <h1 id={titleId}>{document.title}</h1>
            <p className="editorial-document__lede">{document.lede}</p>
          </header>

          <div className="editorial-document__body">
            {document.sections.map((section) => (
              <section
                aria-labelledby={`${section.id}-heading`}
                className="editorial-document__section"
                key={section.id}
              >
                <h2 id={`${section.id}-heading`}>{section.heading}</h2>
                {section.blocks.map((block, index) => (
                  <Block block={block} key={index} />
                ))}
              </section>
            ))}
          </div>
        </article>

        <nav className="project-page__footer atlas-shell" aria-label="More from the atlas">
          <a href="/">
            <span aria-hidden="true">←</span> Home
          </a>
          <a href="/contact">
            Contact <span aria-hidden="true">→</span>
          </a>
        </nav>
      </main>
    </>
  )
}
