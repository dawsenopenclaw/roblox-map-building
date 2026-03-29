import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import HomeClient from './HomeClient'

export const metadata: Metadata = createMetadata({
  title: 'ForjeGames',
  description:
    'Generate terrain, assets, and scripts from voice or image prompts. The fastest AI-powered Roblox game development platform for creators. Free to start.',
  path: '/',
  keywords: [
    'voice to game',
    'image to map',
    'Roblox terrain generator',
    'Roblox AI builder',
    'Luau script generator',
    'Roblox map maker',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ForjeGames',
    url: 'https://forjegames.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://forjegames.com/docs?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
})

export default function HomePage() {
  return <HomeClient />
}
