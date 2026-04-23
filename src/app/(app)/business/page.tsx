import type { Metadata } from 'next'
import BusinessPage from './BusinessClient'

export const metadata: Metadata = {
  title: 'Business',
  description: 'Business dashboard, analytics, and team management.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <BusinessPage />
}
