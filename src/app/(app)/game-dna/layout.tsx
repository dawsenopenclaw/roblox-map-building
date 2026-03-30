import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Game DNA — ForjeGames',
  robots: { index: false, follow: false },
}

export default function GameDnaLayout({ children }: { children: React.ReactNode }) {
  return children
}
