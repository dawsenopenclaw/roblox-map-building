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

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Getting Started with ForjeGames',
  description:
    'Ship your first AI-built Roblox game in 10 minutes. Sign up, open editor, type prompts, voice commands, Studio plugin, publish.',
  url: 'https://forjegames.com/docs/getting-started',
  datePublished: '2026-03-29',
  dateModified: '2026-03-29',
  author: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    url: 'https://forjegames.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    logo: {
      '@type': 'ImageObject',
      url: 'https://forjegames.com/logo.png',
    },
  },
  inLanguage: 'en-US',
  isPartOf: {
    '@type': 'WebSite',
    name: 'ForjeGames',
    url: 'https://forjegames.com',
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://forjegames.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Docs',
      item: 'https://forjegames.com/docs',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Getting Started',
      item: 'https://forjegames.com/docs/getting-started',
    },
  ],
}

export default function GettingStartedPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GetStartedClient />
    </>
  )
}
