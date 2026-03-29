import type { Metadata } from 'next'

export const BASE_URL = 'https://robloxforge.gg'
export const SITE_NAME = 'RobloxForge'
export const DEFAULT_DESCRIPTION =
  'Build Roblox games with AI. Generate terrain, assets, and scripts from voice or image prompts — no Studio plugins required. The fastest way to ship Roblox maps.'
export const OG_IMAGE = `${BASE_URL}/og-image.svg`

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
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
    },
    keywords: [
      'Roblox AI',
      'Roblox map builder',
      'Roblox game development',
      'AI terrain generation',
      'Roblox Studio AI',
      ...keywords,
    ],
    authors: [{ name: 'RobloxForge' }],
    creator: 'RobloxForge',
    publisher: 'RobloxForge LLC',
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
        },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@robloxforge',
      site: '@robloxforge',
    },
    other: jsonLd
      ? {
          'application/ld+json': JSON.stringify(jsonLd),
        }
      : {},
  }
}
