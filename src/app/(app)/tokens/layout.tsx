import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token Usage — ForjeGames',
  robots: { index: false, follow: false },
}

export default function TokensLayout({ children }: { children: React.ReactNode }) {
  return children
}
