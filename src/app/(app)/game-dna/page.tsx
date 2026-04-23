import type { Metadata } from 'next'
import GameDnaClient from './GameDnaClient'

export const metadata: Metadata = {
  title: 'Game DNA',
  description: 'Analyze any Roblox game to extract its DNA — progression loops, monetization patterns, and growth opportunities.',
  robots: { index: false, follow: false },
}

export default function GameDnaPage() {
  return <GameDnaClient />
}
