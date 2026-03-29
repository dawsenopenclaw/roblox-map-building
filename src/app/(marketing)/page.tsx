import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import HomeClient from './HomeClient'

export const metadata: Metadata = createMetadata({
  title: 'RobloxForge — Build Roblox Games with AI',
  description:
    'Generate terrain, assets, and scripts from voice or image prompts. The fastest AI-powered Roblox game development platform. Free to start.',
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
    name: 'RobloxForge',
    url: 'https://robloxforge.gg',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://robloxforge.gg/docs?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
})

export default function HomePage() {
  return <HomeClient />
}
