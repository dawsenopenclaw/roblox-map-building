import type { Metadata } from 'next'
import StudioSettingsClient from './StudioSettingsClient'

export const metadata: Metadata = {
  title: 'Studio Connection — ForjeGames',
  description: 'Link Roblox Studio to the ForjeGames web editor. Install the plugin and generate a connection code.',
  robots: { index: false, follow: false },
}

export default function StudioSettingsPage() {
  return <StudioSettingsClient />
}
