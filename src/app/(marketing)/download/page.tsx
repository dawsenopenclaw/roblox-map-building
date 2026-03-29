import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DownloadClient from './DownloadClient'

export const metadata: Metadata = createMetadata({
  title: 'Desktop App — Coming Soon',
  description:
    'The ForjeGames desktop app is coming soon. Join the waitlist to be notified at launch. In the meantime, use the full-featured web editor.',
  path: '/download',
  keywords: [
    'ForjeGames desktop app',
    'Roblox AI desktop',
    'Roblox Studio AI plugin',
    'Roblox game builder',
  ],
})

export default function DownloadPage() {
  return <DownloadClient />
}
