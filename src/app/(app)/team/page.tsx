import type { Metadata } from 'next'
import TeamClient from './TeamClient'

export const metadata: Metadata = {
  title: 'Team',
  description: 'Invite collaborators, manage team roles, and build Roblox games together in real time.',
  robots: { index: false, follow: false },
}

export default function TeamPage() {
  return <TeamClient />
}
