import type { Metadata } from 'next'
import { EditorClient } from './EditorClient'

export const metadata: Metadata = {
  title: 'Editor — ForjeGames',
  description: 'Build Roblox games with AI in the ForjeGames editor. Generate terrain, scripts, and assets from voice or image prompts.',
  robots: { index: false, follow: false },
}

export default function EditorPage() {
  return <EditorClient />
}
