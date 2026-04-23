import type { Metadata } from 'next'
import CompareClient from './CompareClient'

export const metadata: Metadata = {
  title: 'Compare Games',
  description: 'Side-by-side DNA analysis of two Roblox games. Find strengths, gaps, and strategic opportunities.',
  robots: { index: false, follow: false },
}

export default function GameDnaComparePage() {
  return <CompareClient />
}
