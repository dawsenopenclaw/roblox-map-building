import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import ShowcaseClient from './ShowcaseClient'

export const metadata: Metadata = createMetadata({
  title: 'Showcase',
  description:
    'See real Roblox games built with ForjeGames AI. From first prompt to published game in hours.',
  path: '/showcase',
  keywords: [
    'Roblox games built with AI',
    'ForjeGames showcase',
    'AI Roblox game examples',
    'Roblox game demos',
    'AI game builder results',
  ],
})

const showcaseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'ForjeGames Showcase',
  url: 'https://forjegames.com/showcase',
  description:
    'Real Roblox games built with ForjeGames AI — from first prompt to published game in hours.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'ForjeGames',
    url: 'https://forjegames.com',
  },
}

export default function ShowcasePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(showcaseJsonLd) }}
      />
      <ShowcaseClient />
    </>
  )
}
