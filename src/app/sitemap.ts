import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

// PERF: Sitemap contents are entirely static — no DB calls, no dynamic inputs.
// Without this, Next.js treats sitemap.ts as dynamic by default and re-executes
// the function on every request. Setting revalidate forces ISR-style caching
// so the sitemap is generated once per hour at most.
export const revalidate = 3600 // 1 hour

export default function sitemap(): MetadataRoute.Sitemap {
  // Strategic lastModified dates for SEO freshness signals
  const dates = {
    homepage: new Date('2026-04-24'),
    recent: new Date('2026-04-24'),
    pricing: new Date('2026-04-24'),
    docs: new Date('2026-04-20'),
    legal: new Date('2026-01-15'),
    blog: new Date('2026-04-20'),
  }

  const marketingPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const, lastModified: dates.homepage },
    { url: `${BASE_URL}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const, lastModified: dates.pricing },
    { url: `${BASE_URL}/showcase`, priority: 0.9, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/docs`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/download`, priority: 0.85, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/blog`, priority: 0.75, changeFrequency: 'weekly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/changelog`, priority: 0.6, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/help`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/whats-new`, priority: 0.65, changeFrequency: 'weekly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/prompt-guide`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/affiliates`, priority: 0.6, changeFrequency: 'monthly' as const, lastModified: dates.recent },
    { url: `${BASE_URL}/install`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.recent },
  ]

  const blogPosts = [
    { url: `${BASE_URL}/blog/building-roblox-games-with-ai`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/blog/forjegames-launch`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/blog/voice-to-game-tutorial`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/blog/how-to-build-roblox-game-2026`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/blog/top-ai-tools-roblox-2026`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
    { url: `${BASE_URL}/blog/studio-plugin-setup-guide`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.blog },
  ]

  const docsPages = [
    { url: `${BASE_URL}/docs/getting-started`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/api`, priority: 0.75, changeFrequency: 'monthly' as const, lastModified: dates.docs },
    { url: `${BASE_URL}/docs/studio`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: dates.docs },
  ]

  // Legal pages are noIndex — excluded from sitemap intentionally

  return [...marketingPages, ...blogPosts, ...docsPages].map(
    ({ url, priority, changeFrequency, lastModified }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }),
  )
}
