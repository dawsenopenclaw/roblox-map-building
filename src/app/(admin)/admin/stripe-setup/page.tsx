import type { Metadata } from 'next'
import StripeSetupClient from './StripeSetupClient'

export const metadata: Metadata = {
  title: 'Stripe Setup — Admin',
  description: 'Configure Stripe price IDs and verify billing setup.',
  robots: { index: false, follow: false },
}

export default function StripeSetupPage() {
  return <StripeSetupClient />
}
