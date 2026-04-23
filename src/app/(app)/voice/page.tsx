import type { Metadata } from 'next'
import VoiceClient from './VoiceClient'

export const metadata: Metadata = {
  title: 'Voice Build',
  description: 'Build Roblox games by speaking naturally. ForjeGames turns your voice into Luau scripts, terrain, and asset placements in seconds.',
  robots: { index: false, follow: false },
}

export default function VoicePage() {
  return <VoiceClient />
}
