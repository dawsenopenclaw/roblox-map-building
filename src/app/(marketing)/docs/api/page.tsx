import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import ApiReferenceClient from './ApiReferenceClient'

export const metadata: Metadata = createMetadata({
  title: 'API Reference',
  description:
    'Full REST API docs for ForjeGames — all endpoints, authentication, rate limits, request/response shapes, and code examples.',
  path: '/docs/api',
  keywords: [
    'ForjeGames API',
    'Roblox AI REST API',
    'ForjeGames endpoints',
    'Roblox AI integration',
  ],
})

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'ForjeGames REST API Reference',
  description:
    'Full REST API documentation for the ForjeGames AI-powered Roblox game development platform. Covers all endpoints, authentication, rate limits, and code examples.',
  url: 'https://forjegames.com/docs/api',
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
      name: 'API Reference',
      item: 'https://forjegames.com/docs/api',
    },
  ],
}

export default function ApiReferencePage() {
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
      <ApiReferenceClient />
    </>
  )
}
