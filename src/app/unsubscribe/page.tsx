import type { Metadata } from 'next'
import UnsubscribeClient from './UnsubscribeClient'

export const metadata: Metadata = {
  title: 'Unsubscribe | ForjeGames',
  description: 'Unsubscribe from ForjeGames marketing emails.',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return <UnsubscribeClient />
}
