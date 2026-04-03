import type { Metadata } from 'next'
import { Suspense } from 'react'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
  title: 'Account — ForjeGames',
  description: 'Manage your ForjeGames account, billing, and Studio connection.',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsClient />
    </Suspense>
  )
}
