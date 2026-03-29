import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import PricingClient from './PricingClient'

export const metadata: Metadata = createMetadata({
  title: 'Pricing',
  description:
    'Simple, transparent pricing. Start free with 3 game builds per month. Upgrade to Creator ($15/mo) or Studio ($50/mo) when you\'re ready. No contracts, cancel anytime.',
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
        name: 'What are game builds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each time the AI generates something — terrain, a building, a full game scene — that counts as 1 build. Free plan includes 3 per month. Creator and Studio are unlimited.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. No contracts, no cancellation fees. Cancel in one click and you keep access until the end of your billing period.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is it safe for kids?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. RobloxForge is COPPA compliant with parental controls built in. Safe for players aged 8 and up.',
        },
      },
      {
        '@type': 'Question',
        name: "What's the 10% donation?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: '10% of every subscription payment goes to education charities. We partner with organizations that teach kids coding and STEM skills.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to code?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The AI handles everything. Describe what you want in plain English, and the platform builds it for you.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I sell what I make?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Creator and Studio plans let you list templates and assets on the marketplace. You keep 70% of every sale.',
        },
      },
    ],
  },
})

export default function PricingPage() {
  return <PricingClient />
}
