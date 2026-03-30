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
  jsonLd: [
    {
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
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ForjeGames',
      url: 'https://forjegames.com',
      logo: 'https://forjegames.com/logo.png',
      sameAs: [
        'https://twitter.com/forjegames',
        'https://discord.gg/forjegames',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@forjegames.com',
        contactType: 'customer support',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ForjeGames',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web, Windows, macOS',
      url: 'https://forjegames.com',
      description:
        'AI-powered Roblox game development platform. Generate terrain, assets, and scripts from voice or image prompts.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available. Paid plans from $9.99/month.',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '312',
      },
    },
  ] as unknown as Record<string, unknown>,
})

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ForjeGames',
  url: 'https://forjegames.com',
  logo: 'https://forjegames.com/logo.png',
  sameAs: [
    'https://twitter.com/forjegames',
    'https://discord.gg/forjegames',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@forjegames.com',
    contactType: 'customer support',
  },
}

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ForjeGames',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, Windows, macOS',
  url: 'https://forjegames.com',
  description:
    'AI-powered Roblox game development platform. Generate terrain, assets, and scripts from voice or image prompts.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available. Paid plans from $9.99/month.',
  },
  author: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    url: 'https://forjegames.com',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <HomeClient />
    </>
  )
}
