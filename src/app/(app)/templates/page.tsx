import type { Metadata } from 'next'
import GameTemplatesClient from './GameTemplatesClient'

const BASE_URL = 'https://forjegames.com'
const TITLE = 'Game Templates — ForjeGames'
const DESCRIPTION =
  'Browse 11 publish-ready Roblox game templates built with ForjeAI. Clickers, obbies, tycoons, horror, and more — one click to start building.'
const OG_IMAGE = '/api/og?title=Game+Templates&type=default'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: `${BASE_URL}/templates` },
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/templates`,
    siteName: 'ForjeGames',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: '@forjegames',
    site: '@forjegames',
  },
}

export default function GameTemplatesPage() {
  return <GameTemplatesClient />
}
