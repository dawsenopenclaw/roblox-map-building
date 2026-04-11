import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import PricingClient from './PricingClient'

export const metadata: Metadata = createMetadata({
  title: 'Pricing — Free, Starter, Pro & Studio Plans',
  description:
    'ForjeGames pricing: start free with 10 AI Roblox generations per day. Upgrade to Starter ($9.99/mo), Pro ($29.99/mo), or Studio for unlimited AI game building. No contracts, cancel anytime.',
  path: '/pricing',
  keywords: [
    'ForjeGames pricing',
    'AI Roblox game builder cost',
    'Roblox AI builder plans',
    'Roblox game builder price',
    'AI Roblox map generator price',
    'ForjeGames free plan',
    'ForjeGames subscription',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What counts as an AI generation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each time the AI generates something — terrain, a building, a full game scene — that counts as 1 generation. Free plan includes 10 per day. Starter gets 100/day, Pro 1,000/day, Studio is unlimited.',
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
          text: 'Yes. ForjeGames is COPPA compliant with parental controls built in. Safe for players aged 8 and up.',
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
          text: 'Yes. Starter, Pro, and Studio plans let you list templates and assets on the marketplace. You keep 70% of every sale.',
        },
      },
    ],
  },
})

export default function PricingPage() {
  return <PricingClient />
}
