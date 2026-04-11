import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DownloadClient from './DownloadClient'

export const metadata: Metadata = createMetadata({
  title: 'Download ForjeGames Plugin for Roblox Studio — Free Install',
  description:
    'Download the free ForjeGames Roblox Studio plugin. Connect your Studio directly to the ForjeGames AI editor for real-time AI-generated terrain, assets, and scripts. One-click install for Windows and Mac.',
  path: '/download',
  keywords: [
    'ForjeGames Roblox Studio plugin',
    'Roblox Studio AI plugin download',
    'Roblox Studio plugin install',
    'ForjeGames plugin',
    'AI Roblox game builder plugin',
    'Roblox Studio AI tool',
    'ForjeGames Studio connection',
  ],
})

export default function DownloadPage() {
  return <DownloadClient />
}
