import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DownloadClient from './DownloadClient'

export const metadata: Metadata = createMetadata({
  title: 'Download Studio Plugin | ForjeGames',
  description:
    'Download the ForjeGames Roblox Studio plugin to connect your Studio directly to the ForjeGames AI editor. One-click install for Windows and Mac.',
  path: '/download',
  keywords: [
    'ForjeGames Studio plugin',
    'Roblox Studio AI plugin',
    'Roblox Studio plugin download',
    'ForjeGames plugin install',
    'Roblox AI game builder',
  ],
})

export default function DownloadPage() {
  return <DownloadClient />
}
