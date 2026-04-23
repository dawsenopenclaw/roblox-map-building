import type { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'

const BASE_URL = 'https://forjegames.com'
const TITLE = 'Marketplace — ForjeGames'
const DESCRIPTION =
  'Browse, purchase, and insert Roblox templates, scripts, maps, and UI packs. Support the creator economy on ForjeGames.'
const OG_IMAGE = '/api/og?title=Marketplace&type=default'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: `${BASE_URL}/marketplace` },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/marketplace`,
    siteName: 'ForjeGames',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: '@forjegames',
    site: '@forjegames',
  },
}

export default function MarketplacePage() {
  return <MarketplaceClient />
}
