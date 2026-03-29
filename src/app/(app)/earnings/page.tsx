import type { Metadata } from 'next'
import EarningsClient from './EarningsClient'

export const metadata: Metadata = {
  title: 'Earnings — ForjeGames',
  description: 'View your marketplace revenue, payout history, and earnings breakdown.',
  robots: { index: false, follow: false },
}

export default function EarningsPage() {
  return <EarningsClient />
}
