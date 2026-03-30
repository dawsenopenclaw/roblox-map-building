import type { Metadata } from 'next'
import JoinTeamClient from './JoinTeamClient'

export const metadata: Metadata = {
  title: 'Join Team — ForjeGames',
  robots: { index: false, follow: false },
}

export default function JoinTeamPage() {
  return <JoinTeamClient />
}
