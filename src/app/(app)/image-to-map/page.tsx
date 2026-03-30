import type { Metadata } from 'next'
import ImageToMapClient from './ImageToMapClient'

export const metadata: Metadata = {
  title: 'Image to Map — ForjeGames',
  robots: { index: false, follow: false },
}

export default function ImageToMapPage() {
  return <ImageToMapClient />
}
