import type { Metadata } from 'next'
import EarningsClient from './EarningsClient'

export const metadata: Metadata = {
  title: 'Creator Earnings',
  robots: { index: false, follow: false },
}

export default function EarningsPage() {
  return <EarningsClient />
}
