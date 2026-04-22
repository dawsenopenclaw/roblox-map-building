import type { Metadata } from 'next'
import { FixesClient } from './FixesClient'

export const metadata: Metadata = {
  title: 'Bug Fixes Tracker — ForjeGames Admin',
  description: 'Track all bugs, suggestions, and their fix progress',
  robots: { index: false, follow: false },
}

export default function FixesPage() {
  return <FixesClient />
}
