import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'
import StudioDocsClient from './StudioDocsClient'

export const metadata: Metadata = createMetadata({
  title: 'Studio Plugin — ForjeGames Docs',
  description:
    'How to install the ForjeGames Roblox Studio plugin, connect to the web editor, and troubleshoot common issues.',
  path: '/docs/studio',
  keywords: [
    'Roblox Studio plugin',
    'ForjeGames plugin',
    'Studio connection',
    'Roblox Studio setup',
  ],
})

export default function StudioDocsPage() {
  return <StudioDocsClient />
}
