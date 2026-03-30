import type { Metadata } from 'next'
import ImageToMapClient from './ImageToMapClient'

const BASE_URL = 'https://forjegames.com'
const TITLE = 'Image to Map — ForjeGames'
const DESCRIPTION =
  'Convert photos and sketches into fully-built Roblox maps. Upload an image, AI analyzes it, generates terrain and places assets in seconds.'
const OG_IMAGE = '/api/og?title=Image+to+Map&type=default'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: `${BASE_URL}/image-to-map` },
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/image-to-map`,
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

export default function ImageToMapPage() {
  return <ImageToMapClient />
}
