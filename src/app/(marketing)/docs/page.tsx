import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsClient from './DocsClient'

export const metadata: Metadata = createMetadata({
  title: 'API Documentation',
  description:
    'ForjeGames API reference. Integrate AI terrain generation, voice-to-game, and asset creation into your Roblox Studio workflow with full REST API docs.',
  path: '/docs',
  keywords: [
    'Roblox API',
    'ForjeGames API docs',
    'AI game development API',
    'terrain generation API',
    'Roblox Studio integration',
  ],
})

export default function DocsPage() {
  return <DocsClient />
}
