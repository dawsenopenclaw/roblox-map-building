import type { Metadata } from 'next'
import GrowthClient from './GrowthClient'

export const metadata: Metadata = {
  title: 'Growth — ForjeGames',
  description: 'Track your game performance metrics. Analytics, revenue growth, player engagement, and marketplace trends.',
  robots: { index: false, follow: false },
}

export default function GrowthPage() {
  return <GrowthClient />
}
