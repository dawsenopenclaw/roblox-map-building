import type { Metadata } from 'next'
import Script from 'next/script'
import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'
import { createMetadata } from '@/lib/metadata'
import StatusPageClient from './StatusPageClient'

export const metadata: Metadata = createMetadata({
  title: 'System Status',
  description:
    'Realtime operational status for ForjeGames — AI generation, database, Studio plugin bridge, and more. Subscribe to incident updates.',
  path: '/status',
  keywords: [
    'ForjeGames status',
    'ForjeGames uptime',
    'system status',
    'incident history',
  ],
})

// Revalidate the static shell every 30s so the first byte is quick and the
// client component keeps the data fresh via its auto-refresh loop.
export const revalidate = 30

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'ForjeGames System Status',
  description:
    'Realtime operational status for every ForjeGames service: web, AI generation, database, Studio plugin bridge, image and 3D generation.',
  url: 'https://forjegames.com/status',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Application' },
    { '@type': 'ListItem', position: 2, name: 'AI Generation' },
    { '@type': 'ListItem', position: 3, name: 'Database' },
    { '@type': 'ListItem', position: 4, name: 'Studio Plugin Bridge' },
    { '@type': 'ListItem', position: 5, name: 'Image Generation' },
    { '@type': 'ListItem', position: 6, name: '3D Generation' },
  ],
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
      <MarketingNav />

      <div className="flex-1 pt-16 page-fade-in">
        <StatusPageClient />
      </div>

      <Footer />

      <Script
        id="status-page-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </div>
  )
}
