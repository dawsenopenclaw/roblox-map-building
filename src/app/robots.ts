import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/editor', '/dashboard', '/onboarding', '/sign-in', '/sign-up', '/settings'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
