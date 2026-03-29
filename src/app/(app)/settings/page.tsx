import type { Metadata } from 'next'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
  title: 'Settings — ForjeGames',
  description: 'Manage your ForjeGames account, billing, API keys, and notification preferences.',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <SettingsClient />
}
