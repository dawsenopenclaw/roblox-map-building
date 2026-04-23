import type { Metadata } from 'next'
import SubmitTemplateClient from './SubmitTemplateClient'

export const metadata: Metadata = {
  title: 'Submit Template',
  robots: { index: false, follow: false },
}

export default function SubmitTemplatePage() {
  return <SubmitTemplateClient />
}
