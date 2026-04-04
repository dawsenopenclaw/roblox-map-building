import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import { Suspense } from 'react'
import InstallClient from './InstallClient'

export const metadata: Metadata = createMetadata({
  title: 'Install Studio Plugin | ForjeGames',
  description:
    'Install the ForjeGames Roblox Studio plugin in under a minute. Auto-detect your OS, copy a one-liner, and you\'re connected.',
  path: '/install',
  keywords: [
    'ForjeGames plugin install',
    'Roblox Studio plugin one-click',
    'install ForjeGames plugin',
    'Roblox AI plugin setup',
  ],
})

export default function InstallPage() {
  return (
    <Suspense>
      <InstallClient />
    </Suspense>
  )
}
