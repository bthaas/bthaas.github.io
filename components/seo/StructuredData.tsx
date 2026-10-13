import { type JsonLdObject, serializeJsonLd } from '@/lib/structured-data'

interface StructuredDataProps {
  readonly data: JsonLdObject
}

/** Inline JSON-LD; serialization escapes markup so content cannot close the script. */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
