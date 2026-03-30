import type { Metadata } from 'next'
import EarningsClient from './EarningsClient'

export const metadata: Metadata = {
  title: 'Creator Earnings — ForjeGames',
  robots: { index: false, follow: false },
}

export default function EarningsPage() {
  return <EarningsClient />
}
