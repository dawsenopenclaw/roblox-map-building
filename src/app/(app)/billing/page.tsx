import type { Metadata } from 'next'
import BillingClient from './BillingClient'

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your ForjeGames subscription, token balance, and payment history.',
  robots: { index: false, follow: false },
}

export default function BillingPage() {
  return <BillingClient />
}
