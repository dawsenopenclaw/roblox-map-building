import type { Metadata } from 'next'
import ImageToMapClient from './ImageToMapClient'

export const metadata: Metadata = {
  title: 'Image to Map — ForjeGames',
  description: 'Convert photos and sketches into fully-built Roblox maps. Upload an image, AI analyzes it, generates terrain and places assets.',
  robots: { index: false, follow: false },
}

export default function ImageToMapPage() {
  return <ImageToMapClient />
}
