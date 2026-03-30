import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import GetStartedClient from './GetStartedClient'

export const metadata: Metadata = createMetadata({
  title: 'Getting Started',
  description:
    'Ship your first AI-built Roblox game in 10 minutes. Sign up, open editor, type prompts, voice commands, Studio plugin, publish.',
  path: '/docs/getting-started',
  keywords: [
    'Roblox AI getting started',
    'ForjeGames tutorial',
    'voice to game tutorial',
    'Roblox game development beginner',
  ],
})

export default function GettingStartedPage() {
  return <GetStartedClient />
}
