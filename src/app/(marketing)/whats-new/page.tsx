import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import { WhatsNewClient } from './WhatsNewClient'

export const metadata: Metadata = createMetadata({
  title: "What's New — ForjeGames 2.0",
  description:
    'ForjeGames 2.0 ships 28 brand new features in a single massive April 2026 release. See everything new, improved, and coming soon.',
  path: '/whats-new',
  keywords: [
    'ForjeGames 2.0',
    'ForjeGames release notes',
    'ForjeGames April 2026',
    'ForjeGames new features',
    'Roblox AI platform changelog',
  ],
})

export default function WhatsNewPage() {
  return <WhatsNewClient />
}
