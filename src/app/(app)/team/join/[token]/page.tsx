import type { Metadata } from 'next'
import JoinTeamClient from './JoinTeamClient'

export const metadata: Metadata = {
  title: 'Join Team',
  robots: { index: false, follow: false },
}

export default function JoinTeamPage() {
  return <JoinTeamClient />
}
