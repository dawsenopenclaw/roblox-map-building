import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DownloadClient from './DownloadClient'

export const metadata: Metadata = createMetadata({
  title: 'Download',
  description:
    'Download the ForjeGames desktop app for Windows, macOS, or Linux. Build Roblox games with AI directly connected to Roblox Studio. Includes 1,000 free tokens.',
  path: '/download',
  keywords: [
    'ForjeGames download',
    'Roblox AI desktop app',
    'Roblox Studio AI plugin',
    'Roblox game builder download',
  ],
})

export default function DownloadPage() {
  return <DownloadClient />
}
