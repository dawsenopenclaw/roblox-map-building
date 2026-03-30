import type { Metadata } from 'next'
import TeamSettingsClient from './TeamSettingsClient'

export const metadata: Metadata = {
  title: 'Team Settings — ForjeGames',
  description: 'Manage team roles, permissions, and member access for your ForjeGames workspace.',
  robots: { index: false, follow: false },
}

export default function TeamSettingsPage() {
  return <TeamSettingsClient />
}
