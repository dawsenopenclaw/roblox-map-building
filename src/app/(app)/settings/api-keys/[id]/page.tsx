import type { Metadata } from 'next'
import ApiKeyDetailClient from './ApiKeyDetailClient'

export const metadata: Metadata = {
  title: 'API Key Details',
  description: 'View usage analytics, rate limit status, and manage rotation for your API key.',
  robots: { index: false, follow: false },
}

export default function ApiKeyDetailPage() {
  return <ApiKeyDetailClient />
}
