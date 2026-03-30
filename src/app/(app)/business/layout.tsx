import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Hub — ForjeGames',
  description: 'Manage your LLC, team members, revenue analytics, and white-label configuration.',
  robots: { index: false, follow: false },
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
