import type { Metadata } from 'next'
import ApiKeysClient from './ApiKeysClient'

export const metadata: Metadata = {
  title: 'API Keys — ForjeGames',
  description: 'Create and manage API keys for programmatic access to ForjeGames.',
  robots: { index: false, follow: false },
}

export default function ApiKeysPage() {
  return <ApiKeysClient />
}
