import type { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'

export const metadata: Metadata = {
  title: 'Marketplace — ForjeGames',
  description: 'Browse, purchase, and insert templates, scripts, maps, and assets. Support creator economy.',
  robots: { index: false, follow: false },
}

export default function MarketplacePage() {
  return <MarketplaceClient />
}
