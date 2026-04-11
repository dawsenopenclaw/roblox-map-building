import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import ShowcaseHero from '@/components/marketing/ShowcaseHero'
import ShowcaseClient from './ShowcaseClient'
import { SHOWCASE_GAMES } from '@/lib/showcase-data'

export const metadata: Metadata = createMetadata({
  title: 'Showcase — Built with ForjeGames',
  description:
    'Browse real Roblox games built with ForjeGames AI. Every build ships with the exact prompt used — click any card to remix it in the editor.',
  path: '/showcase',
  keywords: [
    'Roblox games built with AI',
    'ForjeGames showcase',
    'AI Roblox game examples',
    'Roblox game prompts',
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
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: SHOWCASE_GAMES.length,
    itemListElement: SHOWCASE_GAMES.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: game.title,
      description: game.description,
      url: `https://forjegames.com/showcase#${game.id}`,
    })),
  },
}

export default function ShowcasePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(showcaseJsonLd) }}
      />
      <main style={{ background: '#050810' }}>
        <ShowcaseHero />
        <ShowcaseClient />
      </main>
    </>
  )
}
