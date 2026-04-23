import type { Metadata } from 'next'

export const BASE_URL = 'https://forjegames.com'
export const SITE_NAME = 'ForjeGames'
export const DEFAULT_DESCRIPTION =
  'The #1 AI Roblox game builder. Generate terrain, buildings, scripts, and 3D assets from text or voice — synced live to Roblox Studio. Build 10x faster. Free to start.'
export const OG_IMAGE = `${BASE_URL}/api/og` // Dynamic OG image endpoint

/**
 * Generate a dynamic OG image URL with custom parameters
 * @param type - Image type: 'default' | 'template' | 'game-dna' | 'profile'
 * @param params - Query parameters for the image
 */
export function generateOGImageUrl(
  type: 'default' | 'template' | 'game-dna' | 'profile' = 'default',
  params: Record<string, string | number> = {}
): string {
  const searchParams = new URLSearchParams({ type: type.toString() })
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value.toString())
  })
  return `${OG_IMAGE}?${searchParams.toString()}`
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = OG_IMAGE,
  noIndex = false,
  keywords = [],
  jsonLd,
}: {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  jsonLd?: Record<string, unknown>
}): Metadata {
  const canonical = `${BASE_URL}${path}`
  // Don't append "— ForjeGames" here — the root layout template does it
  // via title.template: '%s — ForjeGames'
  return {
    title: title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
    },
    keywords: [
      'AI Roblox game builder',
      'Roblox AI builder',
      'build Roblox games with AI',
      'Roblox game builder',
      'Roblox map builder',
      'Roblox Studio AI plugin',
      'Roblox AI',
      'Roblox game development',
      'AI terrain generation',
      'Roblox terrain generator',
      'Roblox script generator',
      'voice to game',
      'image to map Roblox',
      'Luau script generator',
      'Roblox asset generator',
      ...keywords,
    ],
    authors: [{ name: 'ForjeGames' }],
    creator: 'ForjeGames',
    publisher: 'ForjeGames LLC',
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
        },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: `${title} — ${SITE_NAME}` }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${SITE_NAME}`,
      description,
      images: [image],
      creator: '@forjegames',
      site: '@forjegames',
    },
    other: jsonLd
      ? {
          'application/ld+json': JSON.stringify(jsonLd),
        }
      : {},
  }
}
