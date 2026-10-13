import type { Metadata } from 'next'

import { EditorialDocumentPage } from '@/components/portfolio/EditorialDocumentPage'
import { privacyDocument } from '@/content/editorial-documents'
import { getPageAlternates } from '@/lib/page-metadata'

export const metadata: Metadata = {
  title: privacyDocument.metaTitle,
  description: privacyDocument.description,
  alternates: getPageAlternates(privacyDocument.path),
}

export default function PrivacyPage() {
  return <EditorialDocumentPage document={privacyDocument} />
}
