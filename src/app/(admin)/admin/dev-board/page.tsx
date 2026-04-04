import type { Metadata } from 'next'
import { DevBoardClient } from './DevBoardClient'

export const metadata: Metadata = {
  title: 'Dev Board — ForjeGames Admin',
  description: 'Live platform metrics and analytics',
  robots: { index: false, follow: false },
}

export default function DevBoardPage() {
  return <DevBoardClient />
}
