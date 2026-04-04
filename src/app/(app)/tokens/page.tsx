import type { Metadata } from 'next'
import TokensClient from './TokensClient'

export const metadata: Metadata = {
  title: 'Tokens | ForjeGames',
  description: 'View your token balance, transaction history, and purchase token packs for ForjeGames AI builds.',
  robots: { index: false, follow: false },
}

export default function TokensPage() {
  return <TokensClient />
}
