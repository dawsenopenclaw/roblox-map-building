import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Connect Studio | ForjeGames',
  description: 'Connect Roblox Studio to ForjeGames and sync your builds in real time.',
  robots: { index: false, follow: false },
}

export default function ConnectPage() {
  redirect('/editor')
}
