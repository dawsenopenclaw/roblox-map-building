import type { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'

export const metadata: Metadata = {
  title: 'Marketplace — ForjeGames',
  robots: { index: false, follow: false },
}

export default function MarketplacePage() {
  return <MarketplaceClient />
}
