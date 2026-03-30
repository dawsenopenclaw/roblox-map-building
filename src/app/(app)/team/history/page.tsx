import type { Metadata } from 'next'
import TeamHistoryClient from './TeamHistoryClient'

export const metadata: Metadata = {
  title: 'Version History — ForjeGames',
  description: 'Browse, compare, and roll back project versions. Full commit timeline with diff view.',
  robots: { index: false, follow: false },
}

export default function TeamHistoryPage() {
  return <TeamHistoryClient />
}
