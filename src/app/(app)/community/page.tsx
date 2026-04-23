import type { Metadata } from 'next'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Connect with other Roblox creators. Share tips, get inspired, and grow together.',
  robots: { index: false, follow: false },
}

export default function CommunityPage() {
  return <CommunityClient />
}
