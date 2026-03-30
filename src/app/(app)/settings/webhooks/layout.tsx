import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Webhooks — ForjeGames',
  robots: { index: false, follow: false },
}

export default function WebhooksLayout({ children }: { children: React.ReactNode }) {
  return children
}
