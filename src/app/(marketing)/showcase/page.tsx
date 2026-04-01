import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import ShowcaseClient from './ShowcaseClient'

export const metadata: Metadata = createMetadata({
  title: 'Asset Showcase — ForjeGames',
  description:
    'Browse AI-generated 3D asset packs for Roblox. Interactive 3D viewer with marketplace-ready models built through our Blender pipeline.',
  path: '/showcase',
  keywords: [
    'Roblox 3D assets',
    'marketplace pack',
    'medieval assets',
    'low poly models',
    'Roblox game assets',
    'AI generated 3D',
  ],
})

export default function ShowcasePage() {
  return <ShowcaseClient />
}
