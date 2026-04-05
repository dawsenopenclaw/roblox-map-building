import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import HelpClient from './HelpClient'

export const metadata: Metadata = createMetadata({
  title: 'Help & Support',
  description:
    'Get answers fast. Browse the ForjeGames FAQ, fix common plugin and Studio issues, and reach our support team.',
  path: '/help',
  keywords: [
    'ForjeGames help',
    'ForjeGames support',
    'Roblox Studio plugin troubleshooting',
    'ForjeGames FAQ',
    'how to connect Studio plugin',
    'ForjeGames tokens',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I connect the Roblox Studio plugin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Download the ForjeGames plugin from the Roblox marketplace, install it in Studio, then enter the connection code shown in the ForjeGames editor. The plugin appears in the Plugins toolbar.',
        },
      },
      {
        '@type': 'Question',
        name: "Why isn't my build appearing in Studio?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Make sure HTTP Requests is enabled in Game Settings > Security. If it is, disconnect and reconnect the plugin from the ForjeGames editor.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do tokens work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You get 1,000 tokens free when you sign up. Each AI build costs 5 tokens. Buy more anytime from the Billing page in your dashboard.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use my own AI API key?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. ForjeGames supports Claude, GPT, and Gemini. Add your key in Settings > Model Selector to use your own quota.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get 3D meshes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every build request automatically generates a 3D mesh alongside the placed parts. You can also explicitly ask for a mesh with "generate 3d model for X".',
        },
      },
      {
        '@type': 'Question',
        name: 'Why does my build look like blocks?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'By default, AI builds use Roblox primitive parts. For detailed geometry, include "generate 3d model" in your prompt to trigger Meshy mesh generation.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I report a bug?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Email support@forjegames.com with a description of the issue and your browser console output if available.',
        },
      },
    ],
  },
})

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://forjegames.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Help',
      item: 'https://forjegames.com/help',
    },
  ],
}

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HelpClient />
    </>
  )
}
