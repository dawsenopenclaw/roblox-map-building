import { type Metadata } from 'next'
import { StudioAnalyticsClient } from './StudioAnalyticsClient'

export const metadata: Metadata = {
  title: 'Studio Analytics — Admin',
  robots: { index: false, follow: false },
}

export default function StudioAnalyticsPage() {
  return <StudioAnalyticsClient />
}
