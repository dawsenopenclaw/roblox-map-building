import type { Metadata } from 'next'
import WebhooksClient from './WebhooksClient'

export const metadata: Metadata = {
  title: 'Webhooks | ForjeGames',
  description: 'Manage webhook endpoints and receive real-time HTTP callbacks for builds, templates, and token events.',
  robots: { index: false, follow: false },
}

export default function WebhooksPage() {
  return <WebhooksClient />
}
