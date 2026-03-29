import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import PricingClient from './PricingClient'

export const metadata: Metadata = createMetadata({
  title: 'Pricing',
  description:
    'Start free, scale as you grow. RobloxForge plans from $0 to $29.99/month. Get AI terrain generation, voice-to-game, image-to-map, and Roblox asset creation tools.',
  path: '/pricing',
  keywords: [
    'Roblox AI pricing',
    'Roblox game builder cost',
    'AI Roblox map generator price',
    'RobloxForge plans',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is RobloxForge free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. RobloxForge offers a free tier with 500 tokens per month — no credit card required. Paid plans start at $4.99/month for 2,000 tokens.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a token on RobloxForge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tokens are the credits used to run AI generations — terrain builds, voice commands, image-to-map conversions, and asset creation. Different operations use different token amounts.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel my subscription at any time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All RobloxForge subscriptions are month-to-month (or annual) with no lock-in. Cancel any time and keep access until the end of your billing period.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does RobloxForge support team accounts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The Pro plan ($14.99/month) and Studio plan ($29.99/month) include team collaboration features with shared token pools and role-based access.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free trial for paid plans?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All paid plans include a 14-day free trial so you can evaluate the full feature set before being charged.',
        },
      },
    ],
  },
})

export default function PricingPage() {
  return <PricingClient />
}
