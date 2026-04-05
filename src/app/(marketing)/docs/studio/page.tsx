import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import StudioDocsClient from './StudioDocsClient'

export const metadata: Metadata = createMetadata({
  title: 'Studio Plugin Docs',
  description:
    'How to install the ForjeGames Roblox Studio plugin, connect to the web editor, and troubleshoot common issues.',
  path: '/docs/studio',
  keywords: [
    'Roblox Studio plugin',
    'ForjeGames plugin',
    'Studio connection',
    'Roblox Studio setup',
  ],
})

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'ForjeGames Studio Plugin',
  description:
    'How to install the ForjeGames Roblox Studio plugin, connect to the web editor, and troubleshoot common issues.',
  url: 'https://forjegames.com/docs/studio',
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
      name: 'Studio Plugin',
      item: 'https://forjegames.com/docs/studio',
    },
  ],
}

export default function StudioDocsPage() {
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
      <StudioDocsClient />
    </>
  )
}
