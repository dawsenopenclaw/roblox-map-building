import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const marketingPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/docs`, priority: 0.8, changeFrequency: 'monthly' as const },
  ]

  const legalPages = [
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/acceptable-use`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/dmca`, priority: 0.2, changeFrequency: 'yearly' as const },
  ]

  return [...marketingPages, ...legalPages].map(({ url, priority, changeFrequency }) => ({
    url,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
