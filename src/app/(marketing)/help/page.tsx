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
        name: 'How do I install the Studio plugin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Go to forjegames.com/download and click Install Plugin to open the Roblox Creator Marketplace page. Click Get to add it to your account. The plugin appears in the Plugins toolbar next time you open Studio.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I connect Studio to ForjeGames?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Open Settings > Studio tab on forjegames.com and copy the connection code. In Roblox Studio, click the ForjeGames plugin button and paste the code. The status indicator turns green when connected.',
        },
      },
      {
        '@type': 'Question',
        name: "My build didn't appear in Studio — what do I check?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enable HTTP Requests in Game Settings > Security. Confirm the ForjeGames plugin is active in the Plugins toolbar. Try a simpler prompt to rule out complexity. Disconnect and reconnect from Settings > Studio if needed.',
        },
      },
      {
        '@type': 'Question',
        name: 'What AI models does ForjeGames use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ForjeGames uses Gemini as the primary model with Groq as a fast fallback. Additional models handle image generation, 3D mesh creation, and code review automatically.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do tokens work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each AI build costs 5-25 tokens based on complexity. Free accounts start with 1,000 tokens. Buy more at forjegames.com/tokens or upgrade your plan for a larger monthly allowance.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get better builds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Be specific: mention materials, part counts, and style. Adding game context like "for a horror lobby" helps the AI make better choices. Use "enhance this build" to add detail after generating.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I report a bug?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Email support@forjegames.com with a description of the issue and your browser console output (F12 > Console). You can also use the #bug-reports channel on Discord.',
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
