import type { Metadata } from 'next'
import GrowthClient from './GrowthClient'

export const metadata: Metadata = {
  title: 'Growth — ForjeGames',
  robots: { index: false, follow: false },
}

export default function GrowthPage() {
  return <GrowthClient />
}
