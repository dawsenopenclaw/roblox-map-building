import type { Metadata } from 'next'
import AchievementsClient from './AchievementsClient'

export const metadata: Metadata = {
  title: 'Achievements — ForjeGames',
  robots: { index: false, follow: false },
}

export default function AchievementsPage() {
  return <AchievementsClient />
}
