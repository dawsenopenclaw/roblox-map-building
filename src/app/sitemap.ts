import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  // Strategic lastModified dates for SEO freshness signals
  const dates = {
    homepage: new Date('2026-04-04'),
    recent: new Date('2026-04-04'),
    pricing: new Date('2026-04-04'),
    docs: new Date('2026-04-04'),
    legal: new Date('2026-01-15'),
  }

  const marketingPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const, lastModified: dates.homepage },
    { url: `${BASE_URL}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const, lastModified: dates.pricing },
    { url: `${BASE_URL}/showcase`, priority: 0.9, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/docs`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/download`, priority: 0.85, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/blog`, priority: 0.75, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/changelog`, priority: 0.6, changeFrequency: 'weekly' as const, lastModified: dates.recent },
  ]

  const blogPosts = [
    { url: `${BASE_URL}/blog/building-roblox-games-with-ai`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/blog/forjegames-launch`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/blog/voice-to-game-tutorial`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
  ]

  const installPages = [
    { url: `${BASE_URL}/install`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.recent },
  ]

  const docsPages = [
    { url: `${BASE_URL}/docs/getting-started`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/api`, priority: 0.75, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/studio`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    // Docs subsection anchors — surfaced as distinct URLs for search indexing
    { url: `${BASE_URL}/docs/getting-started#editor`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/getting-started#voice`, priority: 0.65, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/getting-started#image-to-map`, priority: 0.65, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/getting-started#3d-gen`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/getting-started#marketplace`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    // API docs subsections
    { url: `${BASE_URL}/docs/api#authentication`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/api#endpoints`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/api#rate-limits`, priority: 0.55, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    // Studio docs subsections
    { url: `${BASE_URL}/docs/studio#installation`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/studio#plugin`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/studio#sync`, priority: 0.55, changeFrequency: 'monthly' as const, lastModified: dates.docs },
  ]

  // Legal pages are noIndex — excluded from sitemap intentionally

  return [...marketingPages, ...blogPosts, ...docsPages, ...installPages].map(
    ({ url, priority, changeFrequency, lastModified }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }),
  )
}
