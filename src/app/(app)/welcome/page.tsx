import type { Metadata } from 'next'
import WelcomeClient from './WelcomeClient'

export const metadata: Metadata = {
  title: 'Welcome — ForjeGames',
  description: 'Welcome to ForjeGames. Get started building AI-powered Roblox games. Complete your setup and start creating.',
  robots: { index: false, follow: false },
}

export default function WelcomePage() {
  return <WelcomeClient />
}
