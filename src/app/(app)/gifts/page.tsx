import type { Metadata } from 'next'
import GiftsPage from './GiftsClient'

export const metadata: Metadata = {
  title: 'Gifts',
  description: 'Send and redeem ForjeGames gift codes for subscriptions and tokens.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <GiftsPage />
}
