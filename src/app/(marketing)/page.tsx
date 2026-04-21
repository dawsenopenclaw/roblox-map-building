import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import HomeClient from './HomeClient'

const HOMEPAGE_TITLE = 'ForjeGames — Build Roblox Games with AI | Voice to Game, 3D Generation'
const HOMEPAGE_DESC =
  'The #1 AI Roblox game builder. Generate terrain, buildings, scripts, and 3D assets from text or voice — synced live to Roblox Studio. Build 10x faster. Free to start.'

const _base = createMetadata({
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESC,
  path: '/',
  keywords: [
    'AI Roblox game builder',
    'Roblox AI builder',
    'build Roblox games with AI',
    'Roblox game builder',
    'Roblox map generator',
    'ForjeGames',
    'voice to game Roblox',
    'image to map Roblox',
    'Roblox terrain generator',
    'Luau script generator',
    'Roblox Studio AI plugin',
    'AI game development',
  ],
})

export const metadata: Metadata = {
  ..._base,
  title: HOMEPAGE_TITLE,
  openGraph: {
    ..._base.openGraph,
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESC,
    images: [
      {
        url: 'https://forjegames.com/api/og?type=editor',
        width: 1200,
        height: 630,
        alt: 'ForjeGames — The #1 AI Roblox Game Builder. Build terrain, scripts, and 3D assets with AI.',
      },
    ],
  },
  twitter: {
    ..._base.twitter,
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESC,
    images: ['https://forjegames.com/api/og?type=editor'],
  },
}

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ForjeGames',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, Windows, macOS',
  url: 'https://forjegames.com',
  description: HOMEPAGE_DESC,
  featureList: [
    'Voice-to-game AI generation',
    'Image-to-map conversion',
    'AI terrain generation',
    'Luau script generation',
    '3D asset generation',
    'Real-time Roblox Studio sync',
    'Economy system generation',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      description: '1,000 tokens per month. No credit card required.',
    },
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '10',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      description: '5,000 tokens per month. Voice-to-game, image-to-map, and 3D asset generation.',
    },
    {
      '@type': 'Offer',
      name: 'Creator',
      price: '50',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      description: '30,000 tokens per month. Marketplace access, team collaboration, and Game DNA scanner.',
    },
    {
      '@type': 'Offer',
      name: 'Studio',
      price: '200',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      description: '150,000 tokens per month. Full API access, white-label exports, and dedicated support.',
    },
  ],
  author: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    url: 'https://forjegames.com',
  },
  screenshot: 'https://forjegames.com/api/og?type=editor',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is ForjeGames?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ForjeGames is the #1 AI-powered Roblox game builder. Describe your game in plain English (or by voice or image), and the AI generates terrain, buildings, scripts, and economy systems — synced live to Roblox Studio.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the AI Roblox game builder work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Type, speak, or upload an image describing what you want to build. ForjeGames AI generates the terrain, assets, and Luau scripts, then pushes everything directly to Roblox Studio via the free plugin. Build 10x faster than manual development.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ForjeGames free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The free plan includes 1,000 tokens per month with no credit card required. Paid plans start at $10/month for 5,000 tokens.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need Roblox Studio to use ForjeGames?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — you can use the ForjeGames web editor independently. However, installing the free Roblox Studio plugin enables real-time sync so generated assets appear directly in your Studio session.',
      },
    },
    {
      '@type': 'Question',
      name: 'What can ForjeGames AI generate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ForjeGames can generate terrain, buildings, 3D props, Luau scripts, game economy systems, NPC behavior, and complete game scenes — all from text, voice, or image input.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can beginners use ForjeGames?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. ForjeGames is designed for all skill levels — from first-time creators to professional Roblox studios. No coding knowledge is required to generate your first game.',
      },
    },
  ],
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
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomeClient />
    </>
  )
}
