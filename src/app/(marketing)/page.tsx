import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import HomeClient from './HomeClient'

const _base = createMetadata({
  title: 'ForjeGames',
  description:
    'Build complete Roblox games with AI. Voice, image, or text to terrain, assets, scripts, and economy — synced live to Roblox Studio. Start free.',
  path: '/',
  keywords: [
    'Roblox game builder',
    'AI game development',
    'Roblox map generator',
    'ForjeGames',
    'build Roblox games with AI',
    'voice to game',
    'image to map',
    'Roblox terrain generator',
    'Luau script generator',
  ],
})

export const metadata: Metadata = {
  ..._base,
  title: 'ForjeGames — AI-Powered Roblox Game Development',
  openGraph: { ..._base.openGraph, title: 'ForjeGames — AI-Powered Roblox Game Development' },
  twitter: { ..._base.twitter, title: 'ForjeGames — AI-Powered Roblox Game Development' },
}

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
    'Build complete Roblox games with AI. Voice, image, or text to terrain, assets, scripts, and economy — synced live to Roblox Studio.',
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
