import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const marketingPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/docs`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/download`, priority: 0.85, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/blog`, priority: 0.75, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/changelog`, priority: 0.6, changeFrequency: 'weekly' as const },
  ]

  const docsPages = [
    { url: `${BASE_URL}/docs/getting-started`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/api`, priority: 0.75, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/studio`, priority: 0.7, changeFrequency: 'monthly' as const },
    // Docs subsection anchors — surfaced as distinct URLs for search indexing
    { url: `${BASE_URL}/docs/getting-started#editor`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/getting-started#voice`, priority: 0.65, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/getting-started#image-to-map`, priority: 0.65, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/getting-started#3d-gen`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/docs/getting-started#marketplace`, priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  const legalPages = [
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/acceptable-use`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/dmca`, priority: 0.2, changeFrequency: 'yearly' as const },
  ]

  // Marketplace demo template URLs
  const demoTemplates = [
    { url: `${BASE_URL}/marketplace/demo-1`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-2`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-3`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-4`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-5`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-6`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-7`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-8`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-9`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/marketplace/demo-10`, priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  const marketplaceTemplates = demoTemplates

  return [...marketingPages, ...docsPages, ...legalPages, ...marketplaceTemplates].map(
    ({ url, priority, changeFrequency }) => ({
      url,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  )
}
