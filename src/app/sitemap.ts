import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  // Strategic lastModified dates for SEO freshness signals
  const dates = {
    homepage: new Date('2026-03-30'),
    recent: new Date('2026-03-29'),
    pricing: new Date('2026-03-28'),
    docs: new Date('2026-03-25'),
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

  const legalPages = [
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'yearly' as const, lastModified: dates.legal },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const, lastModified: dates.legal },
    { url: `${BASE_URL}/acceptable-use`, priority: 0.3, changeFrequency: 'yearly' as const, lastModified: dates.legal },
    { url: `${BASE_URL}/dmca`, priority: 0.2, changeFrequency: 'yearly' as const, lastModified: dates.legal },
  ]

  // Marketplace demo template URLs
  const demoTemplates = [
    { url: `${BASE_URL}/marketplace/demo-1`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-2`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-3`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-4`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-5`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-6`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-7`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-8`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-9`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/marketplace/demo-10`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
  ]

  const marketplaceTemplates = demoTemplates

  return [...marketingPages, ...blogPosts, ...docsPages, ...legalPages, ...marketplaceTemplates].map(
    ({ url, priority, changeFrequency, lastModified }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }),
  )
}
