import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/showcase',
          '/docs',
          '/download',
          '/blog',
          '/about',
          '/changelog',
          '/install',
          '/api/og',
        ],
        disallow: [
          '/api/',
          '/api/trpc/',
          '/admin',
          '/editor',
          '/dashboard',
          '/onboarding',
          '/sign-in',
          '/sign-up',
          '/settings',
          '/billing',
          '/tokens',
          '/team',
          '/projects',
          '/achievements',
          '/earnings',
          '/voice',
          '/connect',
          '/community',
          '/growth',
          '/game-dna',
          '/referrals',
          '/welcome',
        ],
      },
      // Allow AI crawlers to index public marketing content
      {
        userAgent: 'GPTBot',
        allow: ['/', '/pricing', '/showcase', '/docs', '/blog', '/about'],
        disallow: ['/api/', '/editor', '/dashboard'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/pricing', '/showcase', '/docs', '/blog', '/about'],
        disallow: ['/api/', '/editor', '/dashboard'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/pricing', '/showcase', '/docs', '/blog', '/about'],
        disallow: ['/api/', '/editor', '/dashboard'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
